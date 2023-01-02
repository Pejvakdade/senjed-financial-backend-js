const FinancialGroup = require('./financialGroup.model')
const UtilService = require('../Utils/util.service')
class FinancialGroupRepository {
  constructor (utilService) {
    this.utilService = utilService
  }

  async createFinancialGroup ({ groupType, travelShare, subscription, name }) {
    await FinancialGroup({
      name,
      groupType,
      travelShare,
      subscription
    }).save()
  }

  async deleteFinancialGroup (id) {
    await FinancialGroup.findByIdAndDelete(id)
  }

  async getFinancialGroup (page) {
    if (!page) {
      const result = await FinancialGroup.find()
      return result
    }
    const result = await FinancialGroup.paginate(
      {},
      {
        limit: 10,
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

  async updateFinancialGroup ({
    id,
    groupType,
    name,
    travelShareAdmin,
    travelShareDriver,
    travelShareSuperAgent,
    travelShareAgent,
    travelShareTax,
    subscriptionShareAdmin,
    subscriptionShareAgent,
    subscriptionShareSuperAgent,
    subscriptionSharetax,
    subscriptionCycle,
    subscriptionFee
  }) {
    const result = await FinancialGroup.findByIdAndUpdate(
      id,
      {
        groupType,
        name,
        'travelShare.admin': travelShareAdmin,
        'travelShare.superAgent': travelShareSuperAgent,
        'travelShare.agent': travelShareAgent,
        'travelShare.driver': travelShareDriver,
        'travelShare.tax': travelShareTax,
        'subscription.share.admin': subscriptionShareAdmin,
        'subscription.share.agent': subscriptionShareAgent,
        'subscription.share.superAgent': subscriptionShareSuperAgent,
        'subscription.share.tax': subscriptionSharetax,
        'subscription.cycle': subscriptionCycle,
        'subscription.fee': subscriptionFee
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
