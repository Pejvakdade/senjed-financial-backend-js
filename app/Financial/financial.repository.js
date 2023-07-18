const User = require('../models/user.model')
const Service = require('../models/service.model')
const Student = require('../models/student.model')
const moment = require('moment')

class FinancialRepository {
  constructor () {}
  findServiceById = async (serviceId) => {
    return await Service.findById(serviceId).populate('student parent')
  }

  async findAdminId () {
    const result = await User.findOne({ userTypes: { $in: ['ADMIN'] } })
    return result._id
  }

  async findBankSchoolId () {
    const result = await User.findOne({ userTypes: { $in: ['BANK_SCHOOL'] } })
    return result._id
  }

  async findCommissionManagerSchoolId () {
    const result = await User.findOne({ userTypes: { $in: ['COMMISSION_MANAGER_SCHOOL'] } })
    return result._id
  }

  async findTaxId () {
    const result = await User.findOne({ userTypes: { $in: ['TAX'] } })
    return result._id
  }

  async addSubscriptionDay ({ serviceId, days, date }) {
    const foundedService = await Service.findById(serviceId)
    let updatedService
    if (days) {
      updatedService = await Service.findByIdAndUpdate(
        serviceId,
        {
          expire: moment(foundedService.expire).add(days, 'd').format()
        },
        { new: true }
      )
    } else {
      updatedService = await Service.findByIdAndUpdate(
        serviceId,
        {
          'foundedService.expire': moment(date).format()
        },
        { new: true }
      )
    }

    return updatedService
  }

  async deleteBlockByReasonAndUserType ({ serviceId, blockReason }) {
    console.log({ serviceId, blockReason })
    return await Service.findByIdAndUpdate(serviceId, { $pull: { blocks: { reason: blockReason } } }, { new: true }).exec()
  }

  async checkWallet ({ id, amount }) {
    const user = await User.findById(id)
    return user.balance >= amount
  }
}
module.exports = new FinancialRepository()
