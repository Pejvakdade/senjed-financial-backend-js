const FinancialGroup = require("./financialGroup.model")
const Service = require("../models/service.model")
const UtilService = require("../Utils/util.service")
class FinancialGroupRepository {
  constructor(utilService) {
    this.utilService = utilService
  }

  async createFinancialGroup({ type, agentSubscription, name, subscriptionStudent, subscriptionAgent }) {
    console.log({ 2: { type, agentSubscription, name, subscriptionStudent, subscriptionAgent } })
    const result = await FinancialGroup({ type, agentSubscription, name, subscriptionStudent, subscriptionAgent }).save()
    return result
  }

  async deleteFinancialGroup(id) {
    await FinancialGroup.findByIdAndDelete(id)
  }

  async financialGroupExist(service) {
    return !!(await Service.findOne({ schoolFinancialGroup: service }))
  }

  async findFinancialGroup({ query, page, limit }) {
    let result
    if (!limit) {
      result = await FinancialGroup.find(query)
      return result
    }
    result = await FinancialGroup.paginate(query, {
      limit,
      page,
    })
    return result
  }

  async getFinancialGroupById(id) {
    const result = await FinancialGroup.findById(id)
    return result
  }

  async getFinancialGroupByName(name, page) {
    if (!name) {
      name = ""
    }
    const regex = new RegExp(await this.utilService.escapeRegex(name), "gi")
    const result = await FinancialGroup.paginate(
      { name: regex },
      {
        limit: 10,
        page,
      }
    )
    return result
  }

  async getByName(name) {
    const result = await FinancialGroup.findOne({ name })
    return result
  }

  async updateFinancialGroup({ id, type, agentSubscription, name, subscriptionStudent, subscriptionAgent }) {
    const result = await FinancialGroup.findByIdAndUpdate(
      id,
      { type, agentSubscription, name, subscriptionStudent, subscriptionAgent },
      { new: true }
    )
    return result
  }

  async hasSubscription(id) {
    const result = await FinancialGroup.findById(id)
    if (typeof result.hasSubscription === "boolean") {
      return result.hasSubscription
    }
  }
}
module.exports = new FinancialGroupRepository(UtilService)
