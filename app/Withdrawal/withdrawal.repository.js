const User = require("../models/user.model")
const Service = require("../models/service.model")
const Withdrawal = require("./withdrawal.model")
const Student = require("../models/student.model")
const moment = require("moment")

class WithdrawalRepository {
  constructor() {}
  findUserById = async (userId) => {
    return await User.findById(userId)
  }

  findWithrawalById = async (id) => {
    return await Withdrawal.findById(id)
  }

  updateWithrawal = async ({ withdrawalId, status, description }) => {
    return await Withdrawal.findByIdAndUpdate(withdrawalId, { status, description }, { new: true })
  }

  async checkWallet({ id, amount }) {
    console.log({ id, amount })
    const user = await User.findById(id)
    console.log({ balance: user.balance, amount })
    return user.balance >= amount
  }

  async checkProfitWallet({ id, amount }) {
    const user = await User.findById(id)
    return user?.companyInformation?.profitBalance >= amount
  }

  async changeWallet({ id, amount }) {
    await User.findByIdAndUpdate(id, { $inc: { balance: amount } }, { new: true })
    return true
  }

  async changeProfitWallet({ id, amount }) {
    await User.findByIdAndUpdate(id, { $inc: { "companyInformation.profitBalance": amount } }, { new: true })
    return true
  }

  async createWithdrawal({ amount, userId, type, from, superAgent, driver, company, city, province, shabaId, bankId, bankName, trackingCode, description, phoneNumber }) {
    return await Withdrawal({
      amount,
      userId,
      from,
      type,
      superAgent,
      driver,
      company,
      city,
      province,
      shabaId,
      bankName,
      bankId,
      trackingCode,
      description,
      phoneNumber,
    }).save()
  }

  async find({ query, limit, page, populate, sort }) {
    return await Withdrawal.paginate(query, { limit, page, lean: true, sort, populate })
  }
}
module.exports = new WithdrawalRepository()
