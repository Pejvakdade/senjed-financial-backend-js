const FinancialGroupRepository = require('./financialGroup.repository')
class FinancialGroupService {
  constructor (financialGroupRepository) {
    this.financialGroupRepository = financialGroupRepository
  }

  async createFinancialGroup ({ groupType, travelShare, subscription, name }) {
    await this.financialGroupRepository.createFinancialGroup({
      groupType,
      travelShare,
      subscription,
      name
    })
  }

  async deleteFinancialGroup (id) {
    await this.financialGroupRepository.deleteFinancialGroup(id)
  }

  updateFinancialGroup = async (arg) => await this.financialGroupRepository.updateFinancialGroup(arg)

  async getFinancialGroup (page) {
    const result = await this.financialGroupRepository.getFinancialGroup(page)
    return result
  }

  async getFinancialGroupById (id) {
    const result = await this.financialGroupRepository.getFinancialGroupById(id)
    return result
  }

  async getFinancialGroupByName (name, page) {
    const result = await this.financialGroupRepository.getFinancialGroupByName(name, page)
    return result
  }

  async getByName (name) {
    const result = await this.financialGroupRepository.getByName(name)
    return result
  }

  async hasSubscription (id) {
    const result = await this.financialGroupRepository.hasSubscription(id)
    return result
  }
}
module.exports = new FinancialGroupService(FinancialGroupRepository)
