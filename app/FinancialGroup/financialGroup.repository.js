const FinancialGroup = require('./financialGroup.model')
const UtilService = require('../Utils/util.service')
class FinancialGroupRepository {
  constructor (utilService) {
    this.utilService = utilService
  }

  async createFinancialGroup ({ agentSubscription, name, subscriptionStudent, subscriptionAgent }) {
    await FinancialGroup({
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent
    }).save()
  }

  async deleteFinancialGroup (id) {
    await FinancialGroup.findByIdAndDelete(id)
  }

  async getFinancialGroup ({ page, limit }) {
    if (!page) {
      const result = await FinancialGroup.find()
      return result
    }
    const result = await FinancialGroup.paginate(
      {},
      {
        limit,
        page
      }
    )
    return result
  }

  async getFinancialGroupById (id) {
    const result = await FinancialGroup.findById(id)
    return result
  }

  async getFinancialGroupByName (name, page) {
    if (!name) {
      name = ''
    }
    const regex = new RegExp(await this.utilService.escapeRegex(name), 'gi')
    const result = await FinancialGroup.paginate(
      { name: regex },
      {
        limit: 10,
        page
      }
    )
    return result
  }

  async getByName (name) {
    const result = await FinancialGroup.findOne({ name })
    return result
  }

  async updateFinancialGroup ({ id, agentSubscription, name, subscriptionStudent, subscriptionAgent }) {
    const result = await FinancialGroup.findByIdAndUpdate(
      id,
      {
        agentSubscription,
        name,
        subscriptionStudent,
        subscriptionAgent
      },
      { new: true }
    )
    return result
  }

  async hasSubscription (id) {
    const result = await FinancialGroup.findById(id)
    if (typeof result.hasSubscription === 'boolean') {
      return result.hasSubscription
    }
  }
}
module.exports = new FinancialGroupRepository(UtilService)
