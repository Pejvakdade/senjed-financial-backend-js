const FinancialGroupService = require('./financialGroup.service')
const ValidatorService = require('../Handler/Validator.service')
const { ResponseHandler, ErrorHandler } = require('../Handler')
const { StatusCodes, Constant } = require('../Values')
const UtilService = require('../Utils/util.service')

class FinancialGroupController {
  constructor (financialGroupService, validatorService, utilService) {
    this.financialGroupService = financialGroupService
    this.validatorService = validatorService
    this.utilService = utilService
  }

  async createFinancialGroup (req, res) {
    const { groupType, travelShare, subscription, name } = req.body
    await this.validatorService.createFinancialGroupValidation(req.body)
    await this.financialGroupService.createFinancialGroup({
      groupType,
      travelShare,
      subscription,
      name
    })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async deleteFinancialGroup (req, res) {
    const { id } = req.params
    await this.validatorService.validMongooseId(id)
    // call axios taha for checking financialGroup is used or not
    const result = await this.utilService.axiosInstance({
      url: Constant.financialIsUsed + `/${id}`,
      token: req.token,
      type: 'get'
    })
    if (result.isFinancialGroupUseByAnyone === true) {
      throw new ErrorHandler({
        httpCode: 403,
        statusCode: StatusCodes.ERROR_FINANCIALGROUP_IS_ALREADY_USED
      })
    }
    await this.financialGroupService.deleteFinancialGroup(id)
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_DELETE,
      httpCode: 200
    })
  }

  async updateFinancialGroup (req, res) {
    const {
      groupType,
      name,
      travelShareAdmin,
      travelShareDriver,
      travelShareAgent,
      travelShareSuperAgent,
      travelShareTax,
      subscriptionShareAdmin,
      subscriptionShareAgent,
      subscriptionShareSuperAgent,
      subscriptionSharetax,
      subscriptionCycle,
      subscriptionFee
    } = req.body
    const { id } = req.params
    // await this.validatorService.validMongooseId(id)
    console.log({
      id,
      groupType,
      name,
      travelShareAdmin,
      travelShareDriver,
      travelShareAgent,
      travelShareSuperAgent,
      travelShareTax,
      subscriptionShareAdmin,
      subscriptionShareAgent,
      subscriptionShareSuperAgent,
      subscriptionSharetax,
      subscriptionCycle,
      subscriptionFee
    })
    const result = await this.financialGroupService.updateFinancialGroup({
      id,
      groupType,
      name,
      travelShareAdmin,
      travelShareDriver,
      travelShareAgent,
      travelShareSuperAgent,
      travelShareTax,
      subscriptionShareAdmin,
      subscriptionShareAgent,
      subscriptionShareSuperAgent,
      subscriptionSharetax,
      subscriptionCycle,
      subscriptionFee
    })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }

  async getFinancialGroup (req, res) {
    const { page } = req.query
    const result = await this.financialGroupService.getFinancialGroup(page)
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }

  async getFinancialGroupById (req, res) {
    const { id } = req.params
    await this.validatorService.validMongooseId(id)
    const result = await this.financialGroupService.getFinancialGroupById(id)
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }

  async getFinancialGroupByName (req, res) {
    const { name, page } = req.query
    const result = await this.financialGroupService.getFinancialGroupByName(name, page)
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }

  async hasSubscription (req, res) {
    const { id } = req.params
    const result = await this.financialGroupService.hasSubscription(id)
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }
}
module.exports = new FinancialGroupController(FinancialGroupService, ValidatorService, UtilService)
