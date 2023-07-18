const User = require('../models/user.model')
const Factor = require('./factor.model')
const Service = require('../models/service.model')

class FactorRepository {
  constructor () {}
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
      newSubscriptionDate
    }).save()
    return result
  }

  async foundedExpireServices () {
    let timeforCheck = new Date()
    timeforCheck = timeforCheck.setDate(timeforCheck.getDate() + 8)
    const foundedExpireServices = await Service.find({
      expire: { $lte: new Date(timeforCheck) },
      'approve.companyApprove.isApprroved': true,
      'approve.parrentApprove.isApprroved': true
    }).lean()
    return foundedExpireServices
  }

  async foundedExpireNowServices () {
    const timeforCheck = new Date()
    const foundedExpireServices = await Service.find({
      expire: { $lte: new Date(timeforCheck) },
      'approve.companyApprove.isApprroved': true,
      'approve.parrentApprove.isApprroved': true
    }).lean()
    return foundedExpireServices
  }

  async hasFactor ({ serviceId, oldSubscriptionDate }) {
    const hasFactorResult = await Factor.findOne({ serviceId, oldSubscriptionDate }).lean()
    return !!hasFactorResult
  }

  async isBlockByReason ({ serviceId, reason }) {
    const user = await Service.findOne({
      _id: serviceId,
      'blocks.reason': { $in: reason }
    })
    return user
  }

  async factorListByServiceId (serviceId) {
    console.log({ serviceId })
    const result = await Factor.find({ serviceId, status: 'UN_PAID' }).lean()
    return result
  }

  async findServiceBlocks (serviceId) {
    const result = await Service.findById(serviceId)
    return result.blocks
  }

  async blockService ({ serviceId, foundedBlock }) {
    return !!(await Service.findByIdAndUpdate(serviceId, {
      blocks: foundedBlock
    }))
  }

  async changeFactorStatus ({ factorsList, paidBy, paidDate }) {
    console.log({ factorsList })
    for (const i in factorsList) {
      await Factor.findByIdAndUpdate(factorsList[i], {
        status: 'PAID',
        paidBy,
        paidDate
      })
    }
  }
}
module.exports = new FactorRepository()
