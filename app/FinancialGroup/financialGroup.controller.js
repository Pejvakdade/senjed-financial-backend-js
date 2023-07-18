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
    const { agentSubscription, name, subscriptionStudent, subscriptionAgent } = req.body
    await this.financialGroupService.createFinancialGroup({
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent
    })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200
    })
  }

  async deleteFinancialGroup (req, res) {
    const { id } = req.params
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
    const { agentSubscription, name, subscriptionStudent, subscriptionAgent } = req.body
    const { id } = req.params
    // await this.validatorService.validMongooseId(id)
    console.log({
      id,
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent
    })
    const result = await this.financialGroupService.updateFinancialGroup({
      id,
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent
    })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result
    })
  }

  async getFinancialGroup (req, res) {
    const { page, limit } = req.query
    const result = await this.financialGroupService.getFinancialGroup({ page, limit })
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
