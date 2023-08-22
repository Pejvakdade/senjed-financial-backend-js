const FinancialService = require("./financial.service")
const FinancialGroupService = require("../FinancialGroup/financialGroup.service")
const ValidatorService = require("../Handler/Validator.service")
const UtilService = require("../Utils/util.service")
const ResponseHandler = require("../Handler/ResponseHandler")
const factorService = require("../Factor/factor.service")
const ZarinpalService = require("../Zarinpal/zarinpal.service")
const TransactionService = require("../Transaction/transaction.service")
const { StatusCodes, Constant, appRouting } = require("../Values")
const ErrorHandler = require("../Handler/ErrorHandler")
const Api = require("../Api")
const Redis = require("../Redis/redis.service")

const moment = require("moment")

class FinancialController {
  constructor() {
    this.FinancialService = FinancialService
    this.ValidatorService = ValidatorService
    this.UtilService = UtilService
    this.TransactionService = TransactionService
    this.ZarinpalService = ZarinpalService
  }

  async priceToPay(req, res) {
    //TODO ROLE CONTROL
    const { serviceId } = req.query
    const foundedService = await this.FinancialService.findServiceById(serviceId)
    const foundedFinancialGroup = foundedService.financialGroupSchool
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    }
    console.log({ typeeeeeeeeeee: req.type })
    let { price, count, factorsList } = await factorService.factorPriceByServiceId(serviceId)
    if (req.type === "DRIVER") price = price - (price / 100) * shares.driver
    if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver)

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: { price, count, factorsList },
    })
  }

  async payServiceSubscription(req, res) {
    const { serviceId, getway, target } = req.body
    let { price, count, factorsList } = await factorService.factorPriceByServiceId(serviceId)
    const foundedService = await this.FinancialService.findServiceById(serviceId)
    const foundedFinancialGroup = foundedService.financialGroupSchool
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    }
    let newFactorsList = []

    for (const i in factorsList) {
      newFactorsList.push(factorsList[i]._id)
    }

    if (req.type === "DRIVER") price = price - (price / 100) * shares.driver
    if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver)
    const authority = Math.floor(Math.random() * 10000000000)
    const description = `هزینه ${count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`
    const reason = "SERVICE_SUBSCRIPTION"
    // const targetGetway = "REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE"
    let payLink

    const createdTransaction = await this.TransactionService.createTransaction({
      amount: price,
      transactionStatus: "PENDING",
      payerId: req.userId,
      payerType: req.type,
      parent: foundedService?.parent?._id,
      secondParent: foundedService?.secondParent,
      school: foundedService?.school,
      driver: foundedService?.driver,
      student: foundedService?.student?._id,
      company: foundedService?.company,
      superAgent: foundedService?.superAgent,
      schoolFinancialGroup: foundedFinancialGroup._id,
      service: serviceId,
      reason,
      target,
      count,
      factorsList: newFactorsList,
      isForClient: true,
      authority,
      description: `هزینه ${count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName} `,
      getway,
      city: String(foundedService?.city),
      isOnline: true,
      isDeposit: true,
    })

    if (getway === "saderat") {
      console.log({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(price) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/pay-service-continues?reason=${reason}&target=${target}&getway=saderat&transaction=${createdTransaction._id}&authority2=${authority}`,
        invoiceID: authority,
        Payload: description,
      })
      const foundedToken = await Api.getTokenSaderat({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(price) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/pay-service-continues?reason=${reason}&target=${target}&getway=saderat&transaction=${createdTransaction._id}&authority2=${authority}`,
        invoiceID: authority,
        Payload: description,
      })
      console.log({ foundedToken })
      if (foundedToken.Status !== 0) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_SADERAT_TOKEN,
          httpCode: 400,
        })
      }

      await Redis.saveEx(authority, {}, 660)

      payLink = `https://certificateir.ir/api/v1/financial/payment/redirect-saderat?token=${foundedToken.Accesstoken}`

      // appRouting.REDIRECT_TO_SADERAT_GETWAY({
      //   token: foundedToken.Accesstoken,
      // })
    }

    if (getway === "zarinpal") {
      const foundedToken = await this.ZarinpalService.request({
        amount: Number(price) * 10,
        callback_url: `${process.env.BASE_URL}/api/v1/financial/financial/pay-service-continues?reason=${reason}&target=${targetGetway}&getway=zarinpal&transaction=${createdTransaction._id}&authority2=${authority}`,
        description,
        trackingCode: authority,
      })

      console.log({ foundedToken })
      if (!foundedToken) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN,
          httpCode: 400,
        })
      }

      await Redis.saveEx(authority, {}, 660)

      payLink = `https://www.zarinpal.com/pg/StartPay/${foundedToken}`
    }

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: { payLink },
    })
  }

  async payServiceSubscriptionContinues(req, res) {
    const { reason, target, getway, respcode, transaction, authority2, authority, digitalreceipt, Authority, Status } = req.query
    console.log({ queryZZZ: req.query })
    let foundedTransaction
    let status

    //* ================== check frist time to call =====================
    if (await Redis.get(authority2)) {
      await Redis.del(authority2)
      foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2)

      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        })
        console.log({ adviceSaderat })
        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS"
        else status = "FAILED"
      } else if (getway === "zarinpal") {
        if (Status === "OK") status = "SUCCESS"
        else status = "FAILED"

        if (status == "SUCCESS") {
          console.log({ amount: foundedTransaction.amount, Authority })
          // const verifyZarinpal = await this.ZarinpalService.verify({
          //   amount: foundedTransaction.amount,
          //   authority: Authority,
          // })
          // console.log({ verifyZarinpal })
        }
      }

      if (status === "SUCCESS") {
        await FinancialService.updateHasFactorFlag({ id: foundedTransaction.service, hasFactor: false })
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        })

        await this.FinancialService.chargeWallet({
          id: foundedTransaction.payerId,
          amount: foundedTransaction.amount,
        })

        //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
        await this.FinancialService.paySubscriptionSuccess({ foundedTransaction })
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                serviceId: foundedTransaction.service,
                payerId: foundedTransaction.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                authority: authority2,
              })
            )
            break

          default:
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            })
        }
      } else {
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        })
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                serviceId: foundedTransaction.service,
                payerId: foundedTransaction.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                authority: authority2,
              })
            )
            break

          default:
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            })
        }
      }
    } else {
      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2)
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        })
        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS"
        else status = "FAILED"
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        })
        if (status === "SUCCESS") {
          switch (foundedTransaction.target) {
            case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority: authority2,
                })
              )
              break
            case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                  authority: authority2,
                })
              )
              break

            case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                  authority: authority2,
                })
              )
              break

            default:
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404,
              })
          }
        } else {
          switch (foundedTransaction.target) {
            case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority: authority2,
                })
              )
              break
            case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                  authority: authority2,
                })
              )
              break

            case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                  authority: authority2,
                })
              )
              break

            default:
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404,
              })
          }
        }
      }
    }
  }

  async deposit(req, res) {
    const { amount, getway, target } = req.body
    const authority = Math.floor(Math.random() * 10000000000)
    const reason = "DEPOSIT"
    const targetGetway = "REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE"
    let payLink
    const foundedUser = await this.FinancialService.findUserById(req.userId)
    const description = `شارژ حساب 0${req.phoneNumber} ${foundedUser?.firstName} ${foundedUser?.lastName}`
    let parent, driver, company, superAgent, province, city
    switch (req.type) {
      case "PARENT":
        parent = req.userId
        province = foundedUser?.parentInformation?.province
        city = foundedUser?.parentInformation?.city
        break

      case "DRIVER":
        driver = req?.userId
        company = foundedUser?.schoolDriverInformation?.company
        superAgent = foundedUser?.schoolDriverInformation?.superAgent
        province = foundedUser?.schoolDriverInformation?.province
        city = foundedUser?.schoolDriverInformation?.city
        break

      case "COMPANY":
        company = req?.userId
        superAgent = foundedUser?.companyInformation?.superAgent
        province = foundedUser?.companyInformation?.province
        city = foundedUser?.companyInformation?.city
        break

      case "SUPER_AGENT_SCHOOL":
        superAgent = req?.userId
        province = foundedUser?.superAgentSchoolInformation?.province
        city = foundedUser?.superAgentSchoolInformation?.city
        break
    }

    const createdTransaction = await this.TransactionService.createTransaction({
      amount,
      transactionStatus: "PENDING",
      payerId: req.userId,
      payerType: req.type,
      parent,
      driver,
      company,
      superAgent,
      province,
      city,
      reason,
      target,
      isForClient: true,
      authority,
      description,
      getway,
      isOnline: true,
      isDeposit: true,
    })

    if (getway === "saderat") {
      const foundedToken = await Api.getTokenSaderat({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(amount) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/deposit-continues?reason=${reason}&target=${targetGetway}&getway=saderat&transaction=${createdTransaction._id}&authority2=${authority}`,
        invoiceID: authority,
        Payload: description,
      })
      console.log({ foundedToken })
      if (foundedToken.Status !== 0) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_SADERAT_TOKEN,
          httpCode: 400,
        })
      }

      await Redis.saveEx(authority, {}, 660)

      payLink = `https://certificateir.ir/api/v1/financial/payment/redirect-saderat?token=${foundedToken.Accesstoken}`
    }

    if (getway === "zarinpal") {
      const foundedToken = await this.ZarinpalService.request({
        amount: Number(amount) * 10,
        callback_url: `${process.env.BASE_URL}/api/v1/financial/financial/deposit-continues?reason=${reason}&target=${targetGetway}&getway=zarinpal&transaction=${createdTransaction._id}&authority2=${authority}`,
        description,
        trackingCode: authority,
      })

      console.log({ foundedToken })
      if (!foundedToken) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN,
          httpCode: 400,
        })
      }

      await Redis.saveEx(authority, {}, 660)

      payLink = `https://www.zarinpal.com/pg/StartPay/${foundedToken}`
    }

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: { payLink },
    })
  }

  async depositContinues(req, res) {
    const { reason, target, getway, respcode, transaction, authority2, authority, digitalreceipt, Authority, Status } = req.query
    let foundedTransaction
    let status

    //* ================== check frist time to call =====================
    if (await Redis.get(authority2)) {
      await Redis.del(authority2)
      foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2)

      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        })
        console.log({ adviceSaderat })
        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS"
        else status = "FAILED"
      } else if (getway === "zarinpal") {
        if (Status === "OK") status = "SUCCESS"
        else status = "FAILED"
      }

      if (status === "SUCCESS") {
        await this.TransactionService.updateTransaction({
          authority: authority2,
          status,
        })
        await Api.accountantChargeWalletById({
          id: foundedTransaction.payerId,
          amount: foundedTransaction.amount,
          Authority: authority2,
        })

        //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                serviceId: foundedTransaction?.service,
                payerId: foundedTransaction?.payerId,
                amount: foundedTransaction?.amount,
                target: foundedTransaction?.target,
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                authority: authority2,
              })
            )
            break

          default:
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            })
        }
      } else {
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        })
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                serviceId: foundedTransaction?.service,
                payerId: foundedTransaction?.payerId,
                amount: foundedTransaction?.amount,
                target: foundedTransaction?.target,
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                authority: authority2,
              })
            )
            break

          default:
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            })
        }
      }
    } else {
      foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2)

      if (status === "SUCCESS") {
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                serviceId: foundedTransaction?.service,
                payerId: foundedTransaction?.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            )
            break
          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                authority: authority2,
              })
            )
            break

          default:
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            })
        }
      } else {
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                serviceId: foundedTransaction.service,
                payerId: foundedTransaction.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            )
            break
          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                authority: authority2,
              })
            )
            break

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                authority: authority2,
              })
            )
            break

          default:
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            })
        }
      }
    }
  }

  async payServiceSubscriptionFromWallet(req, res) {
    const { serviceId } = req.body
    let { price, count, factorsList } = await factorService.factorPriceByServiceId(serviceId)
    const foundedService = await this.FinancialService.findServiceById(serviceId)
    const foundedUser = await this.FinancialService.findUserById(req.userId)
    const foundedFinancialGroup = foundedService.financialGroupSchool
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    }
    let newFactorsList = []

    for (const i in factorsList) {
      newFactorsList.push(factorsList[i]._id)
    }

    if (newFactorsList.length <= 0 || price <= 0)
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_FACTOR_NOT_FOUND,
        httpCode: 400,
      })

    if (req.type === "DRIVER") price = price - (price / 100) * shares.driver
    if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver)
    const authority = Math.floor(Math.random() * 10000000000)
    const reason = "SERVICE_SUBSCRIPTION_FROM_WALLET"

    if (foundedUser.balance < price)
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_BALANCE,
        httpCode: 400,
      })

    const createdTransaction = await this.TransactionService.createTransaction({
      amount: price,
      transactionStatus: "SUCCESS",
      payerId: req.userId,
      payerType: req.type,
      parent: foundedService?.parent?._id,
      secondParent: foundedService?.secondParent,
      school: foundedService?.school,
      driver: foundedService?.driver,
      student: foundedService?.student?._id,
      company: foundedService?.company,
      superAgent: foundedService?.superAgent,
      schoolFinancialGroup: foundedFinancialGroup._id,
      service: serviceId,
      reason,
      count,
      factorsList: newFactorsList,
      isForClient: true,
      authority,
      description: `هزینه ${count} ماه ماهیانه سرویس مدارس از موجودی 0${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName} `,
      city: String(foundedService?.city),
      isOnline: false,
      isDeposit: true,
    })

    await FinancialService.updateHasFactorFlag({ id: serviceId, hasFactor: false })

    //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
    await this.FinancialService.paySubscriptionSuccess({ foundedTransaction: createdTransaction })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: createdTransaction,
    })
  }
}

module.exports = new FinancialController()
