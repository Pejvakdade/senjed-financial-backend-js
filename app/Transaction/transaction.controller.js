const TransactionService = require("./transaction.service")
const ResponseHandler = require("../Handler/ResponseHandler")
const ValidatorService = require("../Handler/Validator.service")
const { Constant, StatusCodes } = require("../Values")

class TransactionController {
  constructor(transactionService, validatorService) {
    this.transactionService = transactionService
    this.validatorService = validatorService
  }

  async getTransaction(req, res) {
    const { page } = req.query
    const result = await this.transactionService.getTransactions(page)
    return result
  }

  async findTransactions(req, res) {
    let {
      page,
      limit,
      populate,
      transactionStatus,
      reason,
      payerId,
      payerType,
      receiverId,
      receiverType,
      superAgent,
      parent,
      secondParent,
      school,
      driver,
      student,
      company,
      service,
      subscribe,
      amount,
      isDeposit,
      isCallBack,
      isForClient,
      withdrawalId,
      isOnline,
      count,
      target,
      getway,
      city,

      search,
    } = req.body
    console.log({
      page,
      limit,
      populate,
      transactionStatus,
      reason,
      payerId,
      payerType,
      receiverId,
      receiverType,
      superAgent,
      parent,
      secondParent,
      school,
      driver,
      student,
      company,
      service,
      subscribe,
      amount,
      isDeposit,
      isCallBack,
      withdrawalId,
      isOnline,
      count,
      target,
      getway,
      city,
      search,
    })
    console.log({ type: req.type })
    console.log({ type: req.userId })
    let query = { $and: [] }
    query.$and.push({ isForClient: true })

    if (req.type === "PASSENGER") {
      query.$and.push({ parent: req.userId })
    }
    if (req.type === "DRIVER") {
      query.$and.push({ driver: req.userId })
    }
    if (req.type === "COMPANY") {
      query.$and.push({ company: req.userId })
    }
    if (req.type === "SUPER_AGENT_SCHOOL") {
      query.$and.push({ superAgent: req.userId })
    }

    if (transactionStatus) query.$and.push({ transactionStatus })
    if (reason) query.$and.push({ reason })
    if (payerId) query.$and.push({ payerId })
    if (payerType) query.$and.push({ payerType })
    if (receiverId) query.$and.push({ receiverId })
    if (receiverType) query.$and.push({ receiverType })
    if (superAgent) query.$and.push({ superAgent })
    if (parent) query.$and.push({ parent })
    if (secondParent) query.$and.push({ secondParent })
    if (school) query.$and.push({ school })
    if (driver) query.$and.push({ driver })
    if (student) query.$and.push({ student })
    if (company) query.$and.push({ company })
    if (service) query.$and.push({ service })
    if (subscribe) query.$and.push({ subscribe })
    if (amount) query.$and.push({ amount })
    if (isDeposit) query.$and.push({ isDeposit })
    if (isCallBack) query.$and.push({ isCallBack })
    if (isForClient) query.$and.push({ isForClient })
    if (withdrawalId) query.$and.push({ withdrawalId })
    if (isOnline) query.$and.push({ isOnline })
    if (count) query.$and.push({ count })
    if (target) query.$and.push({ target })
    if (getway) query.$and.push({ getway })
    if (city) query.$and.push({ city })

    if (search) {
      switch (search.searchMode) {
        case "description":
          query.$and.push({ description: { $regex: search.searchValue } })
          break

        case "authority":
          query.$and.push({ authority: { $regex: search.searchValue } })
          break

        case "trackingCode":
          query.$and.push({ trackingCode: { $regex: search.searchValue } })
          break

        default:
          break
      }
    }
    query = query.$and.length < 1 ? null : query
    const result = await this.transactionService.findTransactions({
      populate,
      query,
      limit,
      page,
    })
    return ResponseHandler.send({
      res,
      httpCode: 200,
      statusCode: StatusCodes.SUCCESS_RESPONSE,
      result,
    })
  }

  async findChildTransactions(req, res) {
    let { page, limit, populate, transactionId } = req.body

    let query = { $and: [] }
    query.$and.push({ isForClient: false })
    query.$and.push({ subscribe: transactionId })

    if (req.type === "PASSENGER") {
      query.$and.push({ parent: req.userId })
    }
    if (req.type === "DRIVER") {
      query.$and.push({ driver: req.userId })
    }
    if (req.type === "COMPANY") {
      query.$and.push({ company: req.userId })
    }
    if (req.type === "SUPER_AGENT_SCHOOL") {
      query.$and.push({ superAgent: req.userId })
    }
    if (req.type === "PASSENGER") {
      query.$and.push({ parent: req.userId })
    }

    query = query.$and.length < 1 ? null : query
    const result = await this.transactionService.findTransactions({
      populate,
      query,
      limit,
      page,
    })
    return ResponseHandler.send({
      res,
      httpCode: 200,
      statusCode: StatusCodes.SUCCESS_RESPONSE,
      result,
    })
  }
}
module.exports = new TransactionController(TransactionService, ValidatorService)
