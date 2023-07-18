const FactorService = require('./factor.service')
const ValidatorService = require('../Handler/Validator.service')
const { ResponseHandler, ErrorHandler } = require('../Handler')
const { StatusCodes, Constant } = require('../Values')
const UtilService = require('../Utils/util.service')

class FactorController {
  constructor (factorService, validatorService, utilService) {
    this.factorService = factorService
    this.validatorService = validatorService
    this.utilService = utilService
  }

  async checkExpireServices (req, res) {
    const result = await this.factorService.checkExpireServices()
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }

  async createFactor (req, res) {
    const result = await this.factorService.createFactor({ price, serviceId })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }
}
module.exports = new FactorController(FactorService, ValidatorService, UtilService)