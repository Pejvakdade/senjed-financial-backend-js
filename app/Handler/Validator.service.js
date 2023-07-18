const ErrorHandler = require('./ErrorHandler')
const StatusCodes = require('../Values/StatusCodes')
// const TravelGroupService = require('../TravelGroup/travelGroup.service')
const FinancialGroupService = require('../FinancialGroup/financialGroup.service')
const FinancialGroup = require('../FinancialGroup/financialGroup.model')
const mongoose = require('mongoose')
class ValidatorService {
  constructor (financialGroupService) {
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
}
module.exports = new ValidatorService(FinancialGroupService)
