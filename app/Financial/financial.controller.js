const FinancialService = require('./financial.service')
const FinancialGroupService = require('../FinancialGroup/financialGroup.service')
const ValidatorService = require('../Handler/Validator.service')
const UtilService = require('../Utils/util.service')
const ResponseHandler = require('../Handler/ResponseHandler')
const factorService = require('../Factor/factor.service')
const TransactionService = require('../Transaction/transaction.service')
const { StatusCodes, Constant, appRouting } = require('../Values')
const ErrorHandler = require('../Handler/ErrorHandler')
const Api = require('../Api')
const Redis = require('../Redis/redis.service')

const moment = require('moment')

class FinancialController {
  constructor (financialService, validatorService, utilService, transactionService) {
    this.financialService = financialService
    this.validatorService = validatorService
    this.utilService = utilService
    this.transactionService = transactionService
  }

  async priceToPay (req, res) {
    const { serviceId } = req.query
    const { price, count } = await factorService.factorPriceByServiceId(serviceId)
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: { price, count }
    })
  }

  async payServiceSubscription (req, res) {
    const { serviceId, getway, target } = req.body
    let { price, count, factorsList } = await factorService.factorPriceByServiceId(serviceId)
    const foundedService = await this.financialService.findServiceById(serviceId)
    const foundedFinancialGroup = await FinancialGroupService.getFinancialGroupById(foundedService?.schoolFinancialGroup)
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax
    }

    if (req.type === 'DRIVER') price = price - (price / 100) * shares.driver
    if (req.type === 'COMPANY') price = price - ((price / 100) * shares.company + (price / 100) * shares.driver)
    const authority = Math.floor(Math.random() * 10000000000)
    const description = `هزینه ${count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`
    const reason = 'SERVICE_SUBSCRIPTION'
    const targetGetway = 'REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE'
    let payLink
    const createdTransaction = await this.transactionService.createTransaction({
      amount: price,
      transactionStatus: 'PENDING',
      payerId: req.userId,
      payerType: req.type,
      parent: foundedService?.parent?._id,
      secondParent: foundedService?.secondParent,
      school: foundedService?.school,
      driver: foundedService?.driver,
      student: foundedService?.student?._id,
      company: foundedService?.company,
      superAgent: foundedService?.superAgent,
      schoolFinancialGroup: foundedService?.schoolFinancialGroup,
      service: serviceId,
      reason,
      target,
      count,
      factorsList,
      isForClient: true,
      authority,
      description: `هزینه ${count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName} `,
      getway,
      isOnline: true,
      isDeposit: true
    })

    if (getway === 'saderat') {
      console.log({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(price) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/pay-service-continues?reason=${reason}&target=${targetGetway}&getway=saderat&transaction=${createdTransaction._id}&authority=${authority}`,
        invoiceID: authority,
        Payload: description
      })
      const foundedToken = await Api.getTokenSaderat({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(price) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/pay-service-continues?reason=${reason}&target=${targetGetway}&getway=saderat&transaction=${createdTransaction._id}&authority=${authority}`,
        invoiceID: authority,
        Payload: description
      })
      console.log({ foundedToken })
      if (foundedToken.Status !== 0) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_SADERAT_TOKEN,
          httpCode: 400
        })
      }

      await Redis.saveEx(authority, {}, 660)
      payLink = appRouting.REDIRECT_TO_SADERAT_GETWAY({
        token: foundedToken.Accesstoken
      })
    }

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: { payLink }
    })
  }

  async payServiceSubscriptionContinues (req, res) {
    const { reason, target, getway, transaction, authority, digitalreceipt } = req.query
    console.log({ reason, target, getway, transaction, authority })
    let foundedTransaction
    let status

    //* ================== check frist time to call =====================
    if (await Redis.get(authority)) {
      await Redis.del(authority)
      //* ================== saderat getway ===============================
      if (getway === 'saderat') {
        foundedTransaction = await this.transactionService.findTransactionByAuthority(authority)
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID
        })
        if (adviceSaderat.Status === 'Duplicate' || adviceSaderat.Status === 'Ok') status = 'SUCCESS'
        else status = 'FAILED'
        await this.transactionService.updateTransaction({
          authority,
          reason,
          status
        })
        if (status === 'SUCCESS') {
          await Api.accountantChargeWalletById({
            id: foundedTransaction.parent,
            amount: foundedTransaction.amount,
            Authority: authority
          })

          //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
          await this.financialService.paySubscriptionSuccess({ foundedTransaction })

          switch (foundedTransaction.target) {
            case 'REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD':
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority
                })
              )
              break

            default:
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404
              })
          }
        } else {
          switch (foundedTransaction.target) {
            case 'REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD':
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority
                })
              )
              break

            default:
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404
              })
          }
        }
      }
    } else {
      //* ================== saderat getway ===============================
      if (getway === 'saderat') {
        foundedTransaction = await this.transactionService.findTransactionByAuthority(authority)
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID
        })
        if (adviceSaderat.Status === 'Duplicate' || adviceSaderat.Status === 'Ok') status = 'SUCCESS'
        else status = 'FAILED'
        await this.transactionService.updateTransaction({
          authority,
          reason,
          status
        })
        if (status === 'SUCCESS') {
          switch (foundedTransaction.target) {
            case 'REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD':
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority
                })
              )
              break

            default:
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404
              })
          }
        } else {
          switch (foundedTransaction.target) {
            case 'REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD':
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority
                })
              )
              break

            default:
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404
              })
          }
        }
      }
    }
  }
}

module.exports = new FinancialController(FinancialService, ValidatorService, UtilService, TransactionService)
