const WithdrawalService = require("./withdrawal.service")
const TransactionService = require("../Transaction/transaction.service")
const ResponseHandler = require("../Handler/ResponseHandler")
const { StatusCodes, Constant, appRouting } = require("../Values")
const ErrorHandler = require("../Handler/ErrorHandler")

class WithdrawalController {
  constructor() {
    this.WithdrawalService = WithdrawalService
    this.TransactionService = TransactionService
  }

  async request(req, res) {
    let { amount, shabaId, bankId, bankName } = req.body
    amount = Number(amount)
    const foundedUser = await this.WithdrawalService.findUserById(req.userId)
    const isBalanceEnough = await this.WithdrawalService.checkWallet({ id: req.userId, amount })
    console.log({ isBalanceEnough })
    if (isBalanceEnough == false)
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_BALANCE,
        httpCode: 400,
      })
    if (amount < Number(process.env.MIN_AMOUNT_WITHDRAWAL))
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_MIN_WITHDRAWAL,
        httpCode: 400,
      })
    else if (amount > Number(process.env.MAX_AMOUNT_WITHDRAWAL)) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_MORE_THAN_MAX_WITHDRAWAL,
        httpCode: 400,
      })
    }
    await this.WithdrawalService.changeWallet({ id: req.userId, amount: -amount })
    let superAgent, driver, company, city, province
    if (req.type === "SUPER_AGENT_SCHOOL") {
      superAgent = req.userId
      city = foundedUser?.superAgentSchoolInformation?.city
      province = foundedUser?.superAgentSchoolInformation?.province
    }
    if (req.type === "COMPANY") {
      city = foundedUser?.companyInformation?.city[0]
      province = foundedUser?.companyInformation?.province
      superAgent = foundedUser?.companyInformation.superAgent
      company = req.userId
    }
    if (req.type === "DRIVER") {
      city = foundedUser?.schoolDriverInformation?.city
      province = foundedUser?.schoolDriverInformation?.province
      superAgent = foundedUser?.schoolDriverInformation?.superAgent
      company = foundedUser?.schoolDriverInformation?.company
      driver = req.userId
    }
    const result = await this.WithdrawalService.createWithdrawal({
      amount,
      userId: req.userId,
      type: req.type,
      phoneNumber: req.phoneNumber,
      superAgent,
      driver,
      company,
      city,
      province,
      shabaId,
      bankName,
      bankId,
      trackingCode: Math.floor(Math.random() * 10000000000),
      description: "",
    })

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }

  async requestFromProfit(req, res) {
    console.log("taha")
    let { amount, shabaId, bankId, bankName } = req.body
    amount = Number(amount)
    console.log({ amount, shabaId, bankId, bankName })
    const foundedUser = await this.WithdrawalService.findUserById(req.userId)
    const isBalanceEnough = await this.WithdrawalService.checkProfitWallet({ id: req.userId, amount })
    console.log({ isBalanceEnough })
    if (isBalanceEnough == false)
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_BALANCE,
        httpCode: 400,
      })
    if (amount < Number(process.env.MIN_AMOUNT_WITHDRAWAL))
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_MIN_WITHDRAWAL,
        httpCode: 400,
      })
    else if (amount > Number(process.env.MAX_AMOUNT_WITHDRAWAL)) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_MORE_THAN_MAX_WITHDRAWAL,
        httpCode: 400,
      })
    }
    await this.WithdrawalService.changeProfitWallet({ id: req.userId, amount: -amount })
    let superAgent, company, city, province

    if (req.type === "COMPANY") {
      city = foundedUser?.companyInformation?.city[0]
      province = foundedUser?.companyInformation?.province
      superAgent = foundedUser?.companyInformation.superAgent
      company = req.userId
    }

    const result = await this.WithdrawalService.createWithdrawal({
      amount,
      userId: req.userId,
      type: req.type,
      phoneNumber: req.phoneNumber,
      superAgent,
      company,
      city,
      province,
      shabaId,
      bankName,
      bankId,
      trackingCode: Math.floor(Math.random() * 10000000000),
      description: "",
      from: "PROFIT",
    })

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }

  async acc(req, res) {
    let result
    if (req.type === "ADMIN") {
      let { withdrawalId, description } = req.body
      const foundedWithrawal = await this.WithdrawalService.findWithrawalById(withdrawalId)
      if (foundedWithrawal.status === "PENDING")
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_WITHDRAWAL_STATUS_NOT_PENDING,
          httpCode: 400,
        })
      result = await this.WithdrawalService.updateWithrawal({ withdrawalId, status: "SUCCESS", description })
      await this.TransactionService.createTransaction({
        receiverId: foundedWithrawal?.userId,
        receiverType: foundedWithrawal?.type,
        amount: foundedWithrawal.amount,
        transactionStatus: "SUCCESS",
        driver: foundedWithrawal?.driver,
        company: foundedWithrawal?.company,
        superAgent: foundedWithrawal?.superAgent,
        reason: "WITHDRAWAL",
        description,
        isOnline: false,
        isDeposit: false,
        city: foundedWithrawal?.city,
        withdrawalId,
      }) //todo send sms
    } else
      throw new ErrorHandler({
        statusCode: StatusCodes.AUTH_FAILED,
        httpCode: 403,
      })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }

  async reject(req, res) {
    let result
    if (req.type === "ADMIN") {
      let { withdrawalId, description } = req.body
      const foundedWithrawal = await this.WithdrawalService.findWithrawalById(withdrawalId)
      console.log({ status: foundedWithrawal.status })
      if (foundedWithrawal.status !== "PENDING")
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_WITHDRAWAL_STATUS_NOT_PENDING,
          httpCode: 400,
        })
      result = await this.WithdrawalService.updateWithrawal({ withdrawalId, status: "REJECT", description })
      console.log({ id: foundedWithrawal.userId, amount: Number(foundedWithrawal.amount) })
      if (foundedWithrawal?.from) {
        if (foundedWithrawal?.from === "PROFIT") await this.WithdrawalService.changeProfitWallet({ id: foundedWithrawal.userId, amount: Number(foundedWithrawal.amount) })
        else await this.WithdrawalService.changeWallet({ id: foundedWithrawal.userId, amount: Number(foundedWithrawal.amount) })
      } else await this.WithdrawalService.changeWallet({ id: foundedWithrawal.userId, amount: Number(foundedWithrawal.amount) })

      //todo send sms
    } else
      throw new ErrorHandler({
        statusCode: StatusCodes.AUTH_FAILED,
        httpCode: 403,
      })
    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }

  async find(req, res) {
    let { sort, page, limit, populate, userId, type, superAgent, company, driver, city, service, province, amount, status, search } = req.body

    if (sort) {
      switch (sort) {
        case "CREATED_AT":
          sort = { createdAt: -1 }
          break
        case "BIGGEST_AMOUNT":
          sort = { amount: -1 }
          break
        case "LOWEST_AMOUNT":
          sort = { amount: 1 }
          break
        default:
          sort = { createdAt: -1 }
          break
      }
    }

    let query = { $and: [] }

    if (req.type === "DRIVER") query.$and.push({ driver: req.userId })
    if (req.type === "COMPANY") query.$and.push({ comopany: req.userId })
    if (req.type === "SUPER_AGENT_SCHOOL") query.$and.push({ superAgent: req.userId })

    if (userId) query.$and.push({ userId })
    if (type) query.$and.push({ type })
    if (superAgent) query.$and.push({ superAgent })
    if (company) query.$and.push({ company })
    if (driver) query.$and.push({ driver })
    if (city) query.$and.push({ city })
    if (service) query.$and.push({ service })
    if (province) query.$and.push({ province })
    if (amount) query.$and.push({ amount })
    if (status) query.$and.push({ status })

    if (search) {
      switch (search.searchMode) {
        case "PHONE_NUMBER":
          query.$and.push({ phoneNumber: { $regex: search.searchValue.replace(/^[0\.]+/) } })
          break
        case "DESCRIPTION":
          query.$and.push({ description: { $regex: search.searchValue } })
          break
        case "TRACKING_CODE":
          query.$and.push({ trackingCode: { $regex: search.searchValue } })
          break
        case "SHABA_ID":
          query.$and.push({ shabaId: { $regex: search.searchValue } })
          break
        case "BANK_ID":
          query.$and.push({ bankId: { $regex: search.searchValue } })
          break
        case "BANK_NAME":
          query.$and.push({ bankName: { $regex: search.searchValue } })
          break
      }
    }

    query = query.$and.length < 1 ? null : query
    const result = await this.WithdrawalService.find({
      populate,
      query,
      limit,
      page,
      sort,
    })

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result,
    })
  }
}

module.exports = new WithdrawalController()
