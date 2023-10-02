const User = require("../models/user.model")
const Factor = require("./factor.model")
const Service = require("../models/service.model")

class FactorRepository {
  constructor() {}
  findService = async (serviceId) => {
    return await Service.findById(serviceId)
  }

  createFactor = async ({ price, serviceId, parent, secondParent, student, driver, company, oldSubscriptionDate, newSubscriptionDate }) => {
    const result = await Factor({
      price,
      serviceId,
      parent,
      secondParent,
      student,
      driver,
      company,
      oldSubscriptionDate,
      newSubscriptionDate,
    }).save()
    console.log({ result })
    return result
  }

  async foundedExpireServices() {
    let nowTime = new Date()
    const time8Dayafter = nowTime.setDate(nowTime.getDate() + 8)
    const foundedExpireServices = await Service.find({
      expire: { $lte: new Date(time8Dayafter), $gt: new Date() },
      "approve.companyApprove.isApprroved": true,
      "approve.parrentApprove.isApprroved": true,
    })
      .populate("student parent financialGroupSchool")
      .lean()
    return foundedExpireServices
  }

  async foundedExpireNowServices() {
    const timeforCheck = new Date()
    const foundedExpireServices = await Service.find({
      expire: { $lte: new Date(timeforCheck) },
      "approve.companyApprove.isApprroved": true,
      "approve.parrentApprove.isApprroved": true,
    })
      .populate("student parent financialGroupSchool")
      .lean()
    return foundedExpireServices
  }

  async hasFactor({ serviceId, oldSubscriptionDate }) {
    const hasFactorResult = await Factor.findOne({ serviceId, oldSubscriptionDate, status: "UN_PAID" }).lean()
    return !!hasFactorResult
  }

  async isBlockByReason({ serviceId, reason }) {
    const user = await Service.findOne({
      _id: serviceId,
      "blocks.reason": { $in: reason },
    })
    return user
  }

  async factorListByServiceId(serviceId) {
    const result = await Factor.find({ serviceId, status: "UN_PAID" }).lean()
    return result
  }

  async findServiceBlocks(serviceId) {
    const result = await Service.findById(serviceId)
    return result.blocks
  }

  async blockService({ serviceId, foundedBlock }) {
    try {
      await Service.findByIdAndUpdate(serviceId, {
        blocks: foundedBlock,
      })
      return true
    } catch (error) {
      return false
    }
  }

  async changeFactorStatus({ factorsList, paidBy, paidDate }) {
    console.log({ factorsList })
    for (const i in factorsList) {
      await Factor.findByIdAndUpdate(factorsList[i], {
        status: "PAID",
        paidBy,
        paidDate,
      })
    }
  }
}
module.exports = new FactorRepository()
