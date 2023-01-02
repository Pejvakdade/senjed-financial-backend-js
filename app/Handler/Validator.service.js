const ErrorHandler = require('./ErrorHandler')
const StatusCodes = require('../Values/StatusCodes')
const TravelGroupService = require('../TravelGroup/travelGroup.service')
const FinancialGroupService = require('../FinancialGroup/financialGroup.service')
const FinancialGroup = require('../FinancialGroup/financialGroup.model')
const mongoose = require('mongoose')
class ValidatorService {
  constructor (travelGroupService, financialGroupService) {
    this.travelGroupService = travelGroupService
    this.financialGroupService = financialGroupService
  }

  async zarinpalSubscriptionInputValidation ({ description, reason }) {
    // check amount number and exist
    if (description) {
      return true
    } else {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async zarinpalDepositInputValidation ({ description, reason, amount }) {
    // check amount number and exist
    if (amount && description) {
      return true
    } else {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async saderatGatewayInputValidation ({ amount }) {
    // check amount number and exist
    if (amount) return true
    else {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async internalMoneyTransferInputValidation ({ receiverId, payerId, amount, description, reason }) {
    if (mongoose.isValidObjectId(payerId) && mongoose.isValidObjectId(receiverId) && amount && description && reason === 'INTERNAL') {
      return true
    } else {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async withdrawalInputValidation ({ receiverId, amount, description, reason }) {
    if (mongoose.isValidObjectId(receiverId) && amount && description && reason === 'WITHDRAWAL') {
      return true
    } else {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async validMongooseId (id) {
    if (!mongoose.isValidObjectId(id)) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async createFinancialGroupValidation ({ groupType, travelShare, subscription, name }) {
    const founded = await this.financialGroupService.getByName(name)
    if (founded) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_DUPLICATE,
        httpCode: 400
      })
    }
    if (groupType !== 'TRAVEL' && groupType !== 'FOOD' && groupType !== 'DELIVARY') {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (!name) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (!travelShare.admin || !travelShare.agent || !travelShare.driver || !travelShare.superAgent || !travelShare.tax) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (!subscription.share.admin || !subscription.share.agent || !subscription.share.tax || !subscription.share.superAgent || !subscription.fee || !subscription.cycle) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async updateFinancialGroupValidation ({ groupType, travelShare, subscription, name }) {
    if (groupType !== 'TRAVEL' && groupType !== 'FOOD' && groupType !== 'DELIVARY') {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (!name) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (!travelShare.admin || !travelShare.agent || !travelShare.driver || !travelShare.superAgent || !travelShare.tax) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (!subscription.share.admin || !subscription.share.agent || !subscription.share.tax || !subscription.share.superAgent || !subscription.fee || !subscription.cycle) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async createTravelGroupValidation ({ leastDist, costForExtraKm, formulaRatio, ratioConstant, startCost, name, perExtraMin }) {
    console.log({ valid: { leastDist, costForExtraKm, formulaRatio, ratioConstant, startCost, name, perExtraMin } })
    const founded = await this.travelGroupService.getByName(name)
    if (founded) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_DUPLICATE,
        httpCode: 400
      })
    }
    if (!leastDist || !costForExtraKm || !formulaRatio || !ratioConstant || !startCost || !name || !perExtraMin) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (
      typeof leastDist !== 'number' ||
      typeof costForExtraKm !== 'number' ||
      typeof formulaRatio !== 'number' ||
      typeof ratioConstant !== 'number' ||
      typeof startCost !== 'number'
    ) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async updateTravelGroupValidation ({ leastDist, costForExtraKm, formulaRatio, ratioConstant, startCost, name, perExtraMin }) {
    if (!leastDist || !costForExtraKm || !formulaRatio || !ratioConstant || !startCost || !name || !perExtraMin) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
    if (
      typeof leastDist !== 'number' ||
      typeof costForExtraKm !== 'number' ||
      typeof formulaRatio !== 'number' ||
      typeof ratioConstant !== 'number' ||
      typeof startCost !== 'number'
    ) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async getTransactionsByStatus ({ status }) {
    if (!status || (status !== true && status !== false)) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async getTransactionsByGateway ({ gateway }) {
    if (!gateway) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async getTransactionsByReason ({ reason }) {
    if (!reason || (reason !== 'DEPOSIT' && reason !== 'WITHDRAWAL' && reason !== 'INTERNAL' && reason && 'SUBSCRIPTION')) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_PARAM,
        httpCode: 400
      })
    }
  }

  async verifyZarinpalGetWayValidation ({ Status, Authority }) {
    if (!Status || !Authority) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_IN_CALL_BACK_TRANSACTION_PARAM,
        httpCode: 400
      })
    }
    // if (Status !== "OK") throw new ErrorHandler({ statusCode: StatusCodes.ERROR_TRANSACTION, httpCode: 400 })
    // if (Status === "NOK") throw new ErrorHandler({ statusCode: StatusCodes.ERROR_TRANSACTION, httpCode: 400 })
  }
}
module.exports = new ValidatorService(TravelGroupService, FinancialGroupService)
