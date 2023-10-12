const DebtService = require("./debt.service")
const { ResponseHandler, ErrorHandler } = require("../Handler")
const { StatusCodes, Constant } = require("../Values")
const mongoose = require("mongoose")
class DebtController {
  constructor() {
    this.DebtService = DebtService
  }

  async findDebt(req, res) {
    let { page, limit, populate, status, reason, receiverId, receiverType, superAgent, driver, student, service, company, city, amount, search } = req.body

    let query = { $and: [] }

    if (req.type === "DRIVER") {
      query.$and.push({ driver: req.userId })
    }
    if (req.type === "COMPANY") {
      query.$and.push({ company: req.userId })
    }
    if (req.type === "SUPER_AGENT_SCHOOL") {
      query.$and.push({ superAgent: req.userId })
    }

    if (status) query.$and.push({ status })
    if (reason) query.$and.push({ reason })
    if (receiverId) query.$and.push({ receiverId })
    if (receiverType) query.$and.push({ receiverType })
    if (superAgent) query.$and.push({ superAgent })
    if (parent) query.$and.push({ parent })
    if (school) query.$and.push({ school })
    if (driver) query.$and.push({ driver })
    if (student) query.$and.push({ student })
    if (company) query.$and.push({ company })
    if (service) query.$and.push({ service })
    if (amount) query.$and.push({ amount })
    if (city) query.$and.push({ city })

    if (search) {
      switch (search.searchMode) {
        case "description":
          query.$and.push({ description: { $regex: search.searchValue } })
          break

        case "trackingCode":
          query.$and.push({ trackingCode: { $regex: search.searchValue } })
          break

        default:
          break
      }
    }
    query = query.$and.length < 1 ? null : query
    const result = await this.DebtController.find({
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

  async findAllDebtPriceCompanyToDriver(req, res) {
    let { status, reason, receiverId, receiverType, superAgent, driver, student, service, company, city } = req.body

    let query = { $and: [] }
    query.$and.push()

    query.$and.push({ reason: "COMPANY_DEBT_TO_DRIVER" })
    if (req.type === "DRIVER") {
      query.$and.push({ driver: mongoose.Types.ObjectId(String(req.userId)) })
    }
    if (req.type === "COMPANY") {
      query.$and.push({ company: mongoose.Types.ObjectId(String(req.userId)) })
    }
    if (req.type === "SUPER_AGENT_SCHOOL") {
      query.$and.push({ superAgent: mongoose.Types.ObjectId(String(req.userId)) })
    }

    if (status) query.$and.push({ status })
    if (reason) query.$and.push({ reason })
    if (receiverId) query.$and.push({ receiverId: mongoose.Types.ObjectId(String(receiverId)) })
    if (receiverType) query.$and.push({ receiverType })
    if (superAgent) query.$and.push({ superAgent: mongoose.Types.ObjectId(String(superAgent)) })
    if (driver) query.$and.push({ driver: mongoose.Types.ObjectId(String(driver)) })
    if (student) query.$and.push({ student: mongoose.Types.ObjectId(String(student)) })
    if (company) query.$and.push({ company: mongoose.Types.ObjectId(String(company)) })
    if (service) query.$and.push({ service: mongoose.Types.ObjectId(String(service)) })
    if (city) query.$and.push({ city: mongoose.Types.ObjectId(String(city)) })

    query = query.$and.length < 1 ? null : query
    const result = await this.DebtService.findAllDebtPrice({
      query,
    })
    return ResponseHandler.send({
      res,
      httpCode: 200,
      statusCode: StatusCodes.SUCCESS_RESPONSE,
      result,
    })
  }

  // async createDebt(req, res) {
  //   const result = await this.DebtService.createDebt({ price, serviceId })
  //   return ResponseHandler.send({
  //     res,
  //     statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
  //     httpCode: 200,
  //     result,
  //   })
  // }
}
module.exports = new DebtController()
