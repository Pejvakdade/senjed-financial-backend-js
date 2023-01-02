const Discount = require('../Models/discount.model')
const User = require('../Models/user.model')

class FinancialRepository {
  constructor () {}
  createDiscount = async (data) => {
    await Discount.deleteMany({ expire: { $lte: new Date() } })
    return await Discount(data).save()
  }

  useDiscount = async ({ userId, code }) => {
    const discount = await Discount.findOne({ code })
    if (discount) {
      if (!discount.usedFor.includes(userId)) {
        if (!discount.type) {
          await User.updateOne({ _id: userId }, { $inc: { balance: discount.price } })
          discount.usedFor.push(userId)
          return !!await discount.save()
        } else {
          console.log('process for percent type discount')
          return false
        }
      }
    }
    return false
  }

  allDiscount = async (filters = {}, { page = 1, limit = 10 }) =>
    await Discount.paginate(filters, { limit, page, lean: true, sort: { createdAt: -1 } })

  async getDriverListForCity (city) {
    console.log({ city })
    const users = await User.find({
      userTypes: { $in: 'DRIVER' },
      'driverInformation.city': city
    }).populate('driverInformation.agentId')
    return users
  }

  async findallDriver () {
    return await User.find({ userTypes: { $in: 'DRIVER' } })
    // return await User.find({_id:"6307430f0c3c6859f3ca1c42"})
  }

  async updateSubscriptionCount ({ subscriptionCount, driverId }) {
    await User.findByIdAndUpdate(driverId, { 'driverInformation.subscriptionCount': subscriptionCount })
    return true
  }
}
module.exports = new FinancialRepository()
