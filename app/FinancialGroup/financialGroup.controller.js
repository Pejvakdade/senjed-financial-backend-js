const FinancialGroupService = require("./financialGroup.service")
const ValidatorService = require("../Handler/Validator.service")
const { ResponseHandler, ErrorHandler } = require("../Handler")
const { StatusCodes, Constant } = require("../Values")
const UtilService = require("../Utils/util.service")

class FinancialGroupController {
  constructor(financialGroupService, validatorService, utilService) {
    this.financialGroupService = financialGroupService
    this.validatorService = validatorService
    this.utilService = utilService
  }

  async createFinancialGroup(req, res) {
    const { type, agentSubscription, name, subscriptionStudent, subscriptionAgent } = req.body
    console.log({ agentSubscription, name, subscriptionStudent, subscriptionAgent })
    const result = await this.financialGroupService.createFinancialGroup({
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent,
      type,
    })
    return ResponseHandler.send({
      result,
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
    })
  }

  async deleteFinancialGroup(req, res) {
    const { id } = req.params

    const foundedFinancialGroup = await this.financialGroupService.financialGroupExist(id)
    if (foundedFinancialGroup) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_FINANCIALGROUP_IS_ALREADY_USED,
        httpCode: 400,
      })
    } else {
      await this.financialGroupService.deleteFinancialGroup(id)
    }

    return ResponseHandler.send({
      result: true,
      res,
      statusCode: StatusCodes.RESPONSE_DELETE,
      httpCode: 200,
    })
  }

  async updateFinancialGroup(req, res) {
    const { type, agentSubscription, name, subscriptionStudent, subscriptionAgent } = req.body
    const { id } = req.params
    // await this.validatorService.validMongooseId(id)
    console.log({
      id,
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent,
    })
    const result = await this.financialGroupService.updateFinancialGroup({
      id,
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent,
    })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }

  async findFinancialGroup(req, res) {
    const { page, limit, type } = req.body
    let query = { $and: [] }
    if (type) query.$and.push({ type })

    query = query.$and.length < 1 ? null : query
    const result = await this.financialGroupService.findFinancialGroup({ query, page, limit })

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }

  async hasSubscription(req, res) {
    const { id } = req.params
    const result = await this.financialGroupService.hasSubscription(id)
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }
}
module.exports = new FinancialGroupController(FinancialGroupService, ValidatorService, UtilService)
