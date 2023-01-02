const FinancialService = require('./financial.service')
const { PaymentService } = require('../Payment')
const TransactionService = require('../Transaction/transaction.service')
const ValidatorService = require('../Handler/Validator.service')
const UtilService = require('../Utils/util.service')
const ResponseHandler = require('../Handler/ResponseHandler')
const { StatusCodes, Constant, appRouting } = require('../Values')
const ErrorHandler = require('../Handler/ErrorHandler')
const Api = require('../Api')
const j2x = require('json2xls')
const fs = require('fs')
const moment = require('moment')

class FinancialController {
  constructor (financialService, validatorService, utilService, paymentService) {
    this.financialService = financialService
    this.validatorService = validatorService
    this.utilService = utilService
    this.paymentService = paymentService
  }

  async internalMoneyTransfer (req, res) {
    const { receiverId, payerId, amount, description } = req.query
    // await this.validatorService.internalMoneyTransferInputValidation(req.query)
    await this.financialService.internalMoneyTransfer({
      receiverId,
      payerId,
      amount,
      description
    })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async withdrawal () {
    const { receiverId, amount, description, reason } = req.query
    await this.validatorService.withdrawalInputValidation(req.query)
    await this.financialService.withdrawal({
      receiverId,
      amount: parseInt(amount),
      description,
      reason
    })
    // internal url
    // await this.utilService.callToAnotherService()
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async walletAmount (req, res) {
    const { id } = req.params
    await this.validatorService.validMongooseId(id)
    const result = await this.utilService.axiosInstance({
      url: Constant.getWalletAmount,
      data: { id },
      token: req.token,
      type: ''
    })
    return ResponseHandler.send({
      res,
      httpCode: 200,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      result
    })
  }

  async calculateShare (req, res) {
    const { id, price } = req.query
    const shares = await this.financialService.calculateTravelShare({
      price,
      id
    })
    return ResponseHandler.send({ res, result: shares, httpCode: 200 })
  }

  async calculatePrice (req, res) {
    return ResponseHandler.send({
      res,
      result: await this.financialService.calculatePrice(req.body),
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async createDiscount (req, res) {
    if (req.type !== 'ADMIN') throw new ErrorHandler({ httpCode: 400, statusCode: StatusCodes.ERROR_PARAM })
    const data = req.body
    const { code, type, price, percent, expire } = data
    if (type) {
      if (!percent) throw new ErrorHandler({ httpCode: 400, statusCode: StatusCodes.ERROR_PARAM })
    } else {
      if (!price) throw new ErrorHandler({ httpCode: 400, statusCode: StatusCodes.ERROR_PARAM })
    }
    const thisDate = new Date()
    if (!expire) data.expire = thisDate.setDate(thisDate.getDate() + 10)
    if (!code) {
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      data.code = result
    }
    return ResponseHandler.send({
      res,
      result: await this.financialService.createDiscount(data),
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async allDiscount (req, res) {
    if (req.type !== 'ADMIN') throw new ErrorHandler({ httpCode: 400, statusCode: StatusCodes.ERROR_PARAM })
    return ResponseHandler.send({
      res,
      result: await this.financialService.allDiscount(req.body.filters, req.query),
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async useDiscount (req, res) {
    if (req.type !== 'PASSENGER') throw new ErrorHandler({ httpCode: 400, statusCode: StatusCodes.ERROR_PARAM })
    const data = {
      userId: req.userId,
      code: req.query.code
    }
    const result = await this.financialService.useDiscount(data)
    if (result) {
      return ResponseHandler.send({
        res,
        result,
        statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
        httpCode: 200
      })
    } else {
      return ResponseHandler.send({
        res,
        result,
        statusCode: StatusCodes.ERROR_INTERNAL,
        httpCode: 500
      })
    }
  }

  async finishTravelWithOnlinePayment (req, res) {
    const { driverId, passengerId, fee, travelCode } = req.body

    //* Passenger pay to the driver
    await this.financialService.internalMoneyTransfer({
      reason: 'TRAVEL_COST',
      payerId: passengerId,
      payerType: 'PASSENGER',
      receiverId: driverId,
      receiverType: 'DRIVER',
      amount: fee,
      travelCode,
      isForClient: true
    })

    //* Driver pay to others
    await this.financialService.transferTravelShareFromDriverToOthers({
      driverId,
      amount: fee,
      travelCode
    })

    return ResponseHandler.send({
      res,
      result: true,
      statusCode: StatusCodes.PAYMENTS_WERE_MADE,
      httpCode: 200
    })
  }

  async finishTravelWithOfflinePayment (req, res) {
    const { driverId, fee, travelCode } = req.body
    const token = req.token

    const shares = await this.financialService.calculateTravelShare({
      price: fee,
      id: driverId
    })
    const checkWalletAmount = await Api.accountantCheckWalletById({
      id: driverId,
      amount: shares.admin + shares.superAgent + shares.agent + shares.tax
    })
    if (checkWalletAmount === true) {
      await this.financialService.transferTravelShareFromDriverToOthers({
        driverId,
        amount: fee,
        travelCode
      })
    } else {
      await this.financialService.createDebtForTravelShareFromDriverToOthers({
        driverId,
        amount: fee,
        token,
        type: req.type,
        travelCode
      })
      const newFoundedDriver = await Api.blockDriverForDebt({
        driverId,
        token: req.token,
        type: req.token
      })
      await Api.sendSmsDebt({ userId: newFoundedDriver._id, token: req.token, type: req.type })
    }
    return ResponseHandler.send({
      res,
      result: true,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async payDriverSubscription (req, res) {
    const { driverId, getway } = req.query
    const foundedDriver = await Api.getDriverById(driverId)

    await this.paymentService.zarinpalDeposit(
      {
        amount: foundedDriver.driverInformation.financialGroup.subscription.fee,
        userId: driverId,
        reason: 'SUBSCRIPTION',
        target: 'REDIRECT_TO_PAY_SUBSCRIPTION_CONTINUE',
        payerType: 'DRIVER',
        isForClient: true,
        description: `هزینه ماهیانه ${foundedDriver.phoneNumber} ${foundedDriver.firstName} ${foundedDriver?.lastName} `,
        getway
      },
      res
    )
    return true
  }

  async payDriverSubscriptionContinues (req, res) {
    const { driverId, amount, Authority } = req.query
    const foundedDriver = await Api.getDriverById(driverId)

    //* pay others commission to driver :
    await this.financialService.transferSubscriptionShareFromDriverToOthers(driverId)
    //* add subscription days
    const daysLeft = await Api.addSubscriptionDays({
      driverId,
      days: foundedDriver.driverInformation.financialGroup.subscription.cycle
    })
    //* unblock user

    // const unblocked = await Api.unblockUserForReasonById({ driverId, reason: 2013, type: req.type })
    // if (unblocked.status !== 200) await Api.unblockUserForReasonById({ driverId, reason: 2013, type: req.type })
    await TransactionService.deleteBlockByReason({ userId: driverId, blockReason: 2013 })

    //* update subscription count
    const subscriptionCount = foundedDriver.driverInformation.subscriptionCount ? Number(foundedDriver.driverInformation.subscriptionCount) : 0
    await this.financialService.updateSubscriptionCount({
      driverId,
      subscriptionCount: subscriptionCount + 1
    })
    //* update sms flag after pay
    await Api.updateSmsFlagAfterPay({ driverId })

    console.log({ daysLeft })

    // //* send sms for user
    Api.sendSmsSubscriptionSubmit({
      userId: driverId,
      days: Math.round(daysLeft)
    })
    return res.redirect(
      appRouting.REDIRECT_SUBSCRIPTION_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
        Authority,
        driverId,
        amount,
        daysLeft: Math.floor(daysLeft)
      })
    )
  }

  async payDriverSubscriptionFromBalance (req, res) {
    const { driverId } = req.query
    const foundedDriver = await Api.getDriverById(driverId)

    await TransactionService.createTransaction({
      reason: 'SUBSCRIPTION_FROM_DRIVER_WALLET',
      payerId: driverId,
      payerType: 'DRIVER',
      receiverId: driverId,
      receiverType: 'DRIVER',
      amount: foundedDriver.driverInformation.financialGroup.subscription.fee,
      description: 'SUBSCRIPTION_FROM_DRIVER_WALLET',
      isForClient: true,
      isDeposit: true
    })

    //* pay others commission from driver :
    await this.financialService.transferSubscriptionShareFromDriverToOthers(driverId)
    //* add subscription days
    const daysLeft = await Api.addSubscriptionDays({
      driverId,
      days: foundedDriver.driverInformation.financialGroup.subscription.cycle
    })

    //* unblock user
    // await Api.unblockUserForReasonById({ driverId, reason: 2013, type: req.type })
    await TransactionService.deleteBlockByReason({ userId: driverId, blockReason: 2013 })

    //* update subscription count
    const subscriptionCount = foundedDriver.driverInformation.subscriptionCount ? Number(foundedDriver.driverInformation.subscriptionCount) : 0
    await this.financialService.updateSubscriptionCount({
      driverId,
      subscriptionCount: subscriptionCount + 1
    })

    //* update sms flag after pay
    await Api.updateSmsFlagAfterPay({ driverId })

    //* send sms for user
    Api.sendSmsSubscriptionSubmit({
      userId: driverId,
      days: Math.round(daysLeft)
    })
    return ResponseHandler.send({
      res,
      result: true,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async payDriverSubscriptionInternal (req, res) {
    const { driverId } = req.query

    const foundedDriver = await Api.getDriverById(driverId)

    await this.financialService.internalMoneyTransfer({
      reason: 'SUBSCRIPTION_INTERNAL',
      payerId: req.userId,
      payerType: req.type,
      receiverId: driverId,
      receiverType: 'DRIVER',
      amount: foundedDriver.driverInformation.financialGroup.subscription.fee,
      description: 'SUBSCRIPTION_INTERNAL_FROM_PARRENT',
      isForClient: true
    })

    //* pay others commission from driver :
    await this.financialService.transferSubscriptionShareFromDriverToOthers(driverId)

    //* add subscription days
    const daysLeft = await Api.addSubscriptionDays({
      driverId,
      days: foundedDriver.driverInformation.financialGroup.subscription.cycle
    })

    //* unblock user
    // await Api.unblockUserForReasonById({ driverId, reason: 2013, type: req.type })
    await TransactionService.deleteBlockByReason({ userId: driverId, blockReason: 2013 })

    //* update subscription count
    const subscriptionCount = foundedDriver.driverInformation.subscriptionCount ? Number(foundedDriver.driverInformation.subscriptionCount) : 0
    await this.financialService.updateSubscriptionCount({
      driverId,
      subscriptionCount: subscriptionCount + 1
    })

    //* update sms flag after pay
    await Api.updateSmsFlagAfterPay({ driverId })

    //* send sms for user
    Api.sendSmsSubscriptionSubmit({
      userId: driverId,
      days: Math.round(daysLeft)
    })
    return ResponseHandler.send({
      res,
      result: true,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async payDriverDebts (req, res) {
    let { driverId, amount = 0, getway } = req.query
    const toEnDigit = (n) => n.replace(/[٠-٩۰-۹]/g, (n) => 15 & n.charCodeAt(0))
    amount = parseInt(toEnDigit(String(amount)))
    const foundedDriver = await Api.getDriverById(driverId)
    const insufficient = true
    const totalDebts = await Api.calculateDriverDebt({
      driverId
    })
    if (!totalDebts) {
      await this.paymentService.zarinpalDeposit(
        {
          amount,
          userId: driverId,
          description: 'other',
          reason: 'CHARGE_WALLET',
          target: 'REDIRECT_TO_DRIVER_APP_WALLET',
          payerType: 'DRIVER',
          isForClient: true,
          description: `شارژ حساب راننده ${foundedDriver.phoneNumber} ${foundedDriver.firstName} ${foundedDriver.lastName}`,
          getway
        },
        res
      )
    } else {
      if (amount >= totalDebts) {
        await this.paymentService.zarinpalDeposit(
          {
            amount,
            userId: driverId,
            description: 'other',
            reason: 'PAY_DEBTS',
            target: 'REDIRECT_TO_PAY_DEPTS',
            payerType: 'DRIVER',
            isForClient: true,
            description: `پرداخت بدهی راننده ${foundedDriver.phoneNumber} ${foundedDriver.firstName} ${foundedDriver.lastName}`,
            getway
          },
          res
        )
      } else {
        throw new ErrorHandler({
          httpCode: 500,
          statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_THE_DEBT
        })
      }
    }

    return true
  }

  async payDriverDebtsContinues (req, res) {
    const { driverId, totalDebts, Authority } = req.query
    const result = await this.financialService.payDriverDebts({
      driverId,
      totalDebts
    })
    return res.redirect(
      appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
        driverId,
        amount: totalDebts,
        Authority
      })
    )
  }

  async payDriverDebtsWFromBalance (req, res) {
    const { driverId, totalDebts } = req.query
    const result = await this.financialService.payDriverDebts({
      driverId,
      totalDebts
    })
    return ResponseHandler.send({
      res,
      result,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async payDriverDebtsInternal (req, res) {
    let { driverId, amount = 0 } = req.query
    const toEnDigit = (n) => n.replace(/[٠-٩۰-۹]/g, (n) => 15 & n.charCodeAt(0))
    amount = parseInt(toEnDigit(String(amount)))
    const totalDebts = await Api.calculateDriverDebt({
      driverId
    })

    if (!totalDebts) {
      await this.financialService.internalMoneyTransfer({
        payerId: req.userId,
        receiverId: driverId,
        amount,
        reason: 'CHARGE_WALLET',
        description: 'PAY_CHARGE_WALLET_INTERNAL_BY_PARENT',
        payerType: req.type,
        receiverType: 'DRIVER'
      })
    } else {
      if (amount >= totalDebts) {
        await this.financialService.internalMoneyTransfer({
          payerId: req.userId,
          receiverId: driverId,
          amount,
          reason: 'PAY_DEBTS',
          description: 'PAY_DEBTS_INTERNAL_BY_PARENT',
          payerType: req.type,
          receiverType: 'DRIVER'
        })
        await this.financialService.payDriverDebts({
          driverId,
          totalDebts
        })
      } else {
        throw new ErrorHandler({
          httpCode: 500,
          statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_THE_DEBT,
          result: totalDebts
        })
      }
    }
    return ResponseHandler.send({
      res,
      result: true,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async transferSubscriptionShareFromDriverToOthers (req, res) {
    const { driverId } = req.query
    const foundedUser = await Api.getDriverById(driverId)
    if (!foundedUser) {
      return new ErrorHandler({
        httpCode: 500,
        statusCode: StatusCodes.ERROR_INTERNAL,
        result: 'Something went wrong'
      })
    }
    const subsDay = foundedUser.driverInformation.financialGroup.subscription.cycle
    await this.financialService.unblockForSubscriptionByToken({
      token: req.token,
      type: req.type
    })
    await this.financialService.addSubscriptionDays({
      driverId,
      days: subsDay,
      token: req.token
    })
    const shares = await this.financialService.transferSubscriptionShareFromDriverToOthers(driverId)
    return ResponseHandler.send({ res, result: shares, httpCode: 200 })
  }

  //   let driverList = await this.financialService.findallDriver()
  //   console.log({driverList:driverList.length})
  //  for (let i = 0; i < driverList.length; i++) {
  //   const subscriptionCount = await TransactionService.subscriptionCount(driverList[i]._id)
  //    this.financialService.updateSubscriptionCount({subscriptionCount,driverId:driverList[i]._id})
  //   console.log(i)
  //  }

  async creteExel (req, res) {
    const city = await Api.getAllCity({})
    console.log({ city })
    for (const j in city) {
      const obj = []
      console.log({ city: city[j].TownName })
      const driverList = await this.financialService.getDriverListForCity(city[j].TownName)
      for (const i in driverList) {
        const row = {
          شهر: `${city[j].TownName}`,
          'اسم راننده': `${driverList[i].firstName} ${driverList[i].lastName}`,
          'موبایل راننده': `${driverList[i].phoneNumber}`,
          'نام آژانس': `${driverList[i].driverInformation?.agentId?.agentInformation?.agentName}`,
          'شماره آژانس': `${driverList[i].driverInformation?.agentId?.agentInformation?.code}`,
          'تعداد پرداخت ماهانه': `${driverList[i].driverInformation?.subscriptionCount}`,
          'روز باقی مانده': `${Math.floor(moment.duration(moment(driverList[i].driverInformation?.subscriptionExpireAt, 'YYYY-MM-DD').diff(moment())).asDays())}`
        }
        obj.push(row)
      }
      const xls = j2x(obj)
      fs.writeFileSync(`./ex/${city[j].TownName}.xlsx`, xls, 'binary')
    }
    return ResponseHandler.send({ res, result: true, httpCode: 200 })
  }
}
module.exports = new FinancialController(FinancialService, ValidatorService, UtilService, PaymentService)
