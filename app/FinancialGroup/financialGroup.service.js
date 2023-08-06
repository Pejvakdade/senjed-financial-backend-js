const FinancialGroupRepository = require("./financialGroup.repository")
class FinancialGroupService {
  constructor(financialGroupRepository) {
    this.financialGroupRepository = financialGroupRepository
  }

  async createFinancialGroup({ type, agentSubscription, name, subscriptionStudent, subscriptionAgent }) {
    return await this.financialGroupRepository.createFinancialGroup({
      agentSubscription,
      name,
      subscriptionStudent,
      subscriptionAgent,
      type,
    })
  }

  async deleteFinancialGroup(id) {
    await this.financialGroupRepository.deleteFinancialGroup(id)
  }

  updateFinancialGroup = async (arg) => await this.financialGroupRepository.updateFinancialGroup(arg)

  financialGroupExist = async (arg) => await this.financialGroupRepository.financialGroupExist(arg)

  async findFinancialGroup({ query, page, limit }) {
    const result = await this.financialGroupRepository.findFinancialGroup({ query, page, limit })
    return result
  }

  async getFinancialGroupById(id) {
    const result = await this.financialGroupRepository.getFinancialGroupById(id)
    return result
  }

  async getFinancialGroupByName(name, page) {
    const result = await this.financialGroupRepository.getFinancialGroupByName(name, page)
    return result
  }

  async getByName(name) {
    const result = await this.financialGroupRepository.getByName(name)
    return result
  }

  async hasSubscription(id) {
    const result = await this.financialGroupRepository.hasSubscription(id)
    return result
  }
}
module.exports = new FinancialGroupService(FinancialGroupRepository)
