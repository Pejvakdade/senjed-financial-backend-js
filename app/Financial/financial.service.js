const FinancialRepository = require('./financial.repository')
const TransactionRepository = require('../Transaction/transaction.repository')
const InvoiceRepository = require('../invoice/invoice.repository')
const TravelGroupService = require('../TravelGroup/travelGroup.service')
const UtilService = require('../Utils/util.service')
const Api = require('../Api')
const ErrorHandler = require('../Handler/ErrorHandler')
const { StatusCodes } = require('../Values')
const { nightTime, morningTime } = require('../Values/constants')

class FinancialService {
  constructor (financialRepository, transactionRepository, utilService) {
    this.financialRepository = financialRepository
    this.transactionRepository = transactionRepository
    this.utilService = utilService
  }

  async internalMoneyTransfer ({ withdrawalId, reason, payerId, payerType, receiverId, receiverType, isForClient, amount, description, isOnline = false }) {
    const checkWalletAmount = await Api.accountantCheckWalletById({
      id: payerId,
      amount
    })
    if (!checkWalletAmount) {
      throw new ErrorHandler({
        httpCode: 400,
        statusCode: StatusCodes.ERROR_INSUFFICIENT_BALANCE
      })
    }

    await this.transactionRepository.createTransaction({
      reason,
      payerId,
      payerType,
      receiverId,
      receiverType,
      amount,
      description,
      isOnline,
      isForClient,
      isDeposit: false,
      withdrawalId
    })
    await Api.accountantChargeWalletById({ id: payerId, amount: -amount })
    await this.transactionRepository.createTransaction({
      reason,
      payerId,
      payerType,
      receiverId,
      receiverType,
      amount,
      description,
      isOnline,
      isForClient,
      isDeposit: true,
      withdrawalId
    })
    await Api.accountantChargeWalletById({ id: receiverId, amount })
  }

  async increaseAccountBalance ({ invoiceId, receiverId, receiverType, payerId, amount, isForClient, description, reason, isOnline = false, payerType }) {
    await this.transactionRepository.createTransaction({
      reason,
      invoiceId,
      payerId,
      payerType,
      receiverId,
      receiverType,
      amount,
      description,
      isDeposit: true,
      isForClient,
      isOnline
    })
    await Api.accountantChargeWalletById({ id: receiverId, amount })
  }

  async payDriverSubscriptionContinues ({ driverId, amount, Authority }) {
    console.error({ taahaaa: driverId })
    const foundedDriver = await Api.getDriverById(driverId)

    //* pay others commission to driver :
    await this.transferSubscriptionShareFromDriverToOthers(driverId)
    //* add subscription days
    const daysLeft = await Api.addSubscriptionDays({
      driverId,
      days: foundedDriver.driverInformation.financialGroup.subscription.cycle
    })
    //* unblock user

    const unblocked = await Api.unblockUserForReasonById({ driverId, reason: 2013, type: 'DRIVER' })
    if (unblocked.status !== 200) await Api.unblockUserForReasonById({ driverId, reason: 2013, type: 'DRIVER' })

    //* update subscription count
    const subscriptionCount = foundedDriver.driverInformation.subscriptionCount ? Number(foundedDriver.driverInformation.subscriptionCount) : 0
    await this.updateSubscriptionCount({
      driverId,
      subscriptionCount: subscriptionCount + 1
    })
    //* update sms flag after pay
    await Api.updateSmsFlagAfterPay({ driverId })

    // //* send sms for user
    Api.sendSmsSubscriptionSubmit({
      userId: driverId,
      days: Math.round(daysLeft)
    })
    return Math.floor(daysLeft)
  }

  async createDebtForTravelShareFromDriverToOthers ({ driverId, amount, token, type, travelCode }) {
    const foundedDriver = await Api.getDriverById(driverId)
    const shares = await this.calculateTravelShare({
      price: amount,
      id: driverId
    })
    const foundedAdminId = await Api.findAdminById()
    const foundedTaxId = await Api.findTaxById()

    //* agent
    await Api.createDebtForDriver({
      reason: 'TRAVEL_COST_COMMISSION',
      debtorId: foundedDriver._id,
      payerId: driverId,
      payerType: 'DRIVER',
      receiverType: 'AGENT',
      receiverId: foundedDriver.driverInformation.agentId,
      amount: shares.admin + shares.agent + shares.superAgent + shares.tax,
      token,
      type,
      travelCode
    })

    //* superAgent
    await Api.createDebtForDriver({
      reason: 'TRAVEL_COST_COMMISSION',
      debtorId: foundedDriver._id,
      payerId: foundedDriver.driverInformation.agentId,
      payerType: 'AGENT',
      receiverId: foundedDriver.driverInformation.superAgentId,
      receiverType: 'SUPER_AGENT',
      amount: shares.admin + shares.superAgent + shares.tax,
      token,
      type,
      travelCode
    })

    //* admin
    await Api.createDebtForDriver({
      reason: 'TRAVEL_COST_COMMISSION',
      debtorId: foundedDriver._id,
      payerId: foundedDriver.driverInformation.superAgentId,
      payerType: 'SUPER_AGENT',
      receiverId: foundedAdminId,
      receiverType: 'ADMIN',
      amount: shares.admin + shares.tax,
      token,
      type,
      travelCode
    })

    //* tax
    await Api.createDebtForDriver({
      reason: 'TRAVEL_COST_COMMISSION',
      debtorId: foundedDriver._id,
      payerId: foundedAdminId,
      payerType: 'ADMIN',
      receiverId: foundedTaxId,
      receiverType: 'TAX',
      amount: shares.tax,
      token,
      type,
      travelCode
    })

    return true
  }

  async transferTravelShareFromDriverToOthers ({ driverId, amount, travelCode }) {
    const foundedDriver = await Api.getDriverById(driverId)
    const shares = await this.calculateTravelShare({
      price: amount,
      id: driverId
    })

    const foundedAdminId = await Api.findAdminById()
    const foundedTaxId = await Api.findTaxById()

    //* admin
    await this.internalMoneyTransfer({
      reason: 'TRAVEL_COST_COMMISSION',
      payerId: driverId,
      payerType: 'DRIVER',
      receiverId: foundedAdminId,
      receiverType: 'ADMIN',
      amount: shares.admin + shares.agent + shares.superAgent + shares.tax,
      isForClient: true,
      travelCode
    })

    //* superAgent
    await this.internalMoneyTransfer({
      reason: 'TRAVEL_COST_COMMISSION',
      payerId: foundedAdminId,
      payerType: 'ADMIN',
      receiverId: foundedDriver.driverInformation.superAgentId,
      receiverType: 'SUPER_AGENT',
      amount: shares.agent + shares.superAgent + shares.tax,
      travelCode
    })

    //* agent
    await this.internalMoneyTransfer({
      reason: 'TRAVEL_COST_COMMISSION',
      payerId: foundedDriver.driverInformation.superAgentId,
      payerType: 'SUPER_AGENT',
      receiverId: foundedDriver.driverInformation.agentId,
      receiverType: 'AGENT',
      amount: shares.agent + shares.tax,
      travelCode
    })

    //* tax
    await this.internalMoneyTransfer({
      reason: 'TRAVEL_COST_COMMISSION',
      payerId: foundedDriver.driverInformation.agentId,
      payerType: 'AGENT',
      receiverId: foundedTaxId,
      receiverType: 'TAX',
      amount: shares.tax,
      travelCode
    })
    return true
  }

  async unblockForSubscriptionByToken ({ token }) {
    const unblock = await Api.unblockForSubscriptionByToken({ token, type: req.type })
  }

  async transferSubscriptionShareFromDriverToOthers (driverId) {
    const foundedDriver = await InvoiceRepository.userFindById(driverId)

    const shares = {
      admin: foundedDriver.driverInformation.financialGroup.subscription.share.admin,
      agent: foundedDriver.driverInformation.financialGroup.subscription.share.agent,
      superAgent: foundedDriver.driverInformation.financialGroup.subscription.share.superAgent,
      tax: foundedDriver.driverInformation.financialGroup.subscription.share.tax
    }
    const foundedAdminId = await Api.findAdminById()
    const foundedTaxId = await Api.findTaxById()

    //* agent

    await this.internalMoneyTransfer({
      reason: 'SUBSCRIPTION_COMMISSION',
      payerId: driverId,
      payerType: 'DRIVER',
      receiverId: foundedDriver.driverInformation.agentId,
      receiverType: 'AGENT',
      amount: shares.admin + shares.agent + shares.superAgent + shares.tax
    })

    //* superAgent
    await this.internalMoneyTransfer({
      reason: 'SUBSCRIPTION_COMMISSION',
      payerId: String(foundedDriver.driverInformation.agentId),
      payerType: 'AGENT',
      receiverId: foundedDriver.driverInformation.superAgentId,
      receiverType: 'SUPER_AGENT',
      amount: shares.admin + shares.superAgent + shares.tax
    })

    //* admin
    await this.internalMoneyTransfer({
      reason: 'SUBSCRIPTION_COMMISSION',
      payerId: String(foundedDriver.driverInformation.superAgentId),
      payerType: 'SUPER_AGENT',
      receiverId: foundedAdminId,
      receiverType: 'ADMIN',
      amount: shares.admin + shares.tax
    })

    //* tax
    await this.internalMoneyTransfer({
      reason: 'SUBSCRIPTION_COMMISSION',
      payerId: String(foundedAdminId),
      payerType: 'ADMIN',
      receiverId: foundedTaxId,
      receiverType: 'TAX',
      amount: shares.tax
    })
    return true
  }

  // async withdrawal({ receiverId, amount, description, reason }) {
  //   await this.transactionRepository.createTransaction({
  //     receiverId,
  //     payerId,
  //     amount,
  //     description,
  //     reason,
  //   })
  // }

  async calculateTravelShare ({ price, id }) {
    const foundedUser = await Api.getDriverById(id)

    const shares = {
      admin: (price / 100) * foundedUser.driverInformation.financialGroup.travelShare.admin,
      driver: (price / 100) * foundedUser.driverInformation.financialGroup.travelShare.driver,
      agent: (price / 100) * foundedUser.driverInformation.financialGroup.travelShare.agent,
      superAgent: (price / 100) * foundedUser.driverInformation.financialGroup.travelShare.superAgent,
      tax: (price / 100) * foundedUser.driverInformation.financialGroup.travelShare.tax
    }
    return shares
  }

  async calculatePrice ({ price = 0, distance, duration, secondDestinationDistance, secondDestinationDuration, stoppageTime, round, driverId, DTO }) {
    distance = distance ? distance / 1000 : distance
    duration = duration ? duration / 60 : duration
    secondDestinationDistance = secondDestinationDistance ? secondDestinationDistance / 1000 : secondDestinationDistance
    secondDestinationDuration = secondDestinationDuration ? secondDestinationDuration / 60 : secondDestinationDuration
    if (!DTO) {
      const foundedUser = await Api.getDriverById(driverId)
      DTO = foundedUser.hasOwnProperty('driverInformation') ? foundedUser.driverInformation.travelGroup : false
    }
    const { pauseInTripPerMinute, percentRoundTrip, percentSecondTrip, startCost } = DTO
    if (secondDestinationDistance) {
      if (distance) {
        const allDistance = distance + secondDestinationDistance
        const allDuration = duration + secondDestinationDuration
        price += await this.utilService.calculateOneWayPrice({
          distance: allDistance,
          duration: allDuration,
          DTO
        })
        price += pauseInTripPerMinute * 5
      } else {
        price += await this.utilService.calculateOneWayPrice({
          distance: secondDestinationDistance,
          duration: secondDestinationDuration,
          DTO
        })
        price *= percentSecondTrip / 100
      }
    }

    if (distance && !price) {
      price += await this.utilService.calculateOneWayPrice({
        distance,
        duration,
        DTO
      })
    }
    if (round) price += price * (percentRoundTrip / 100)
    if (stoppageTime) price += stoppageTime * pauseInTripPerMinute
    let result = Math.round(price / 1000) * 1000
    const thisTime = new Date().getHours() + 4
    if (thisTime >= nightTime && thisTime <= morningTime) result = (result * 30) / 100
    return result < startCost ? startCost : result
  }

  async createDiscount (args) {
    return await FinancialRepository.createDiscount(args)
  }

  async allDiscount (filters, args) {
    return await FinancialRepository.allDiscount(filters, args)
  }

  async useDiscount (args) {
    return await FinancialRepository.useDiscount(args)
  }

  async addSubscriptionDays ({ driverId, days, token }) {
    const result = await Api.addSubscriptionDays({ driverId, days, token })
    return result
  }

  async payDriverDebts ({ driverId, totalDebts }) {
    const foundedDriver = await Api.getDriverById(driverId)
    const checkWalletAmount = await Api.accountantCheckWalletById({
      amount: totalDebts,
      id: driverId
    })
    if (!checkWalletAmount) {
      throw new ErrorHandler({
        httpCode: 400,
        statusCode: StatusCodes.ERROR_INSUFFICIENT_BALANCE
      })
    }
    for (const i in foundedDriver.driverInformation.debt) {
      await this.internalMoneyTransfer({
        reason: foundedDriver.driverInformation.debt[i].reason,
        payerId: foundedDriver.driverInformation.debt[i].payerId,
        payerType: foundedDriver.driverInformation.debt[i].payerType,
        receiverId: foundedDriver.driverInformation.debt[i].receiverId,
        receiverType: foundedDriver.driverInformation.debt[i].receiverType,
        amount: foundedDriver.driverInformation.debt[i].amount,
        description: foundedDriver.driverInformation.debt[i].description,
        isForClient: i === 0,
        travelCode: foundedDriver.driverInformation.debt[i].travelCode
      })
    }
    await Api.unblockUserForReasonById({ driverId, reason: 2014 })

    await Api.deleteAllDebts({ driverId })

    await Api.sendSmsPayDebt({
      userId: foundedDriver._id
    })
    return true
  }

  getDriverListForCity = async (arg) => await FinancialRepository.getDriverListForCity(arg)

  findallDriver = async (arg) => await FinancialRepository.findallDriver(arg)

  updateSubscriptionCount = async (arg) => await FinancialRepository.updateSubscriptionCount(arg)
}
module.exports = new FinancialService(FinancialRepository, TransactionRepository, UtilService)
