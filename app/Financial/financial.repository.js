const User = require("../models/user.model")
const Service = require("../models/service.model")
const Student = require("../models/student.model")
const moment = require("moment")

class FinancialRepository {
  constructor() {}
  findServiceById = async (serviceId) => {
    return await Service.findById(serviceId).populate("student parent financialGroupSchool")
  }

  async findAdminId() {
    const result = await User.findOne({ userTypes: { $in: ["ADMIN"] } })
    return result._id
  }

  async findUserById(id) {
    const result = await User.findById(id)
    return result
  }

  async findBankSchoolId() {
    const result = await User.findOne({ userTypes: { $in: ["BANK_SCHOOL"] } })
    return result._id
  }

  async findCommissionManagerSchoolId() {
    const result = await User.findOne({ userTypes: { $in: ["COMMISSION_MANAGER_SCHOOL"] } })
    return result._id
  }

  async findTaxId() {
    const result = await User.findOne({ userTypes: { $in: ["TAX"] } })
    return result._id
  }

  async addSubscriptionDay({ serviceId, days, date }) {
    serviceId = String(serviceId)
    console.log({ serviceId, days, date })
    const foundedService = await Service.findById(serviceId)
    console.log({ foundedService })
    let updatedService
    if (days) {
      console.log({ newDate: moment(foundedService.expire).add(days, "d").format() })
      const newDate = moment(foundedService.expire).add(days, "d").format()
      updatedService = await Service.findByIdAndUpdate(
        serviceId,
        {
          expire: newDate,
        },
        { new: true }
      )
    } else {
      updatedService = await Service.findByIdAndUpdate(
        serviceId,
        {
          "foundedService.expire": moment(date).format(),
        },
        { new: true }
      )
    }

    return updatedService
  }

  async deleteBlockByReasonAndUserType({ serviceId, blockReason }) {
    console.log({ serviceId, blockReason })
    return await Service.findByIdAndUpdate(serviceId, { $pull: { blocks: { reason: blockReason } } }, { new: true }).exec()
  }

  async checkWallet({ id, amount }) {
    const user = await User.findById(id)
    return user.balance >= amount
  }

  async chargeWallet({ id, amount }) {
    await User.findByIdAndUpdate(id, { $inc: { balance: amount } }, { new: true })
    return true
  }

  async canWithdrawal({ id, amount }) {
    const user = await User.findById(id)
    return user.balance >= Math.abs(amount)
  }

  async updateHasFactorFlag({ id, hasFactor }) {
    const result = await Service.findByIdAndUpdate(id, { hasFactor })
    return result
  }
}
module.exports = new FinancialRepository()
