const FactorRepository = require('./factor.repository')
const UtilService = require('../Utils/util.service')
const FinancialGroupService = require('../FinancialGroup/financialGroup.service')
const Api = require('../Api')
const ErrorHandler = require('../Handler/ErrorHandler')
const { StatusCodes } = require('../Values')

class FactorService {
  constructor (factorRepository, utilService) {
    this.factorRepository = factorRepository
    this.utilService = utilService
  }

  async createFactor ({ price, serviceId, oldSubscriptionDate, newSubscriptionDate }) {
    const foundedService = await this.factorRepository.findService(serviceId)
    if (foundedService) {
      return await this.factorRepository.createFactor({
        price,
        serviceId,
        parent: foundedService.parent,
        secondParent: foundedService?.secondParent,
        student: foundedService?.student,
        driver: foundedService?.driver,
        company: foundedService?.company,
        oldSubscriptionDate,
        newSubscriptionDate
      })
    } else false
  }

  async checkExpireServices () {
    const foundedExpireServices = await this.factorRepository.foundedExpireServices()
    const foundedExpireNowServices = await this.factorRepository.foundedExpireNowServices()
    console.log({ foundedExpireServices: foundedExpireServices.length })
    for (const i in foundedExpireServices) {
      const hasFactor = await this.factorRepository.hasFactor({
        serviceId: foundedExpireServices[i]._id,
        oldSubscriptionDate: foundedExpireServices[i].expire
      })
      const oldSubscriptionDate = await new Date(foundedExpireServices[i].expire)
      if (!hasFactor) {
        const foundedFinancialGroup = await FinancialGroupService.getFinancialGroupById(foundedExpireServices[i].schoolFinancialGroup)
        const newSubscriptionDate = foundedExpireServices[i].expire.setDate(
          foundedExpireServices[i].expire.getDate() + foundedFinancialGroup.subscriptionStudent.cycle
        )
        await this.createFactor({
          price: foundedExpireServices[i].price,
          serviceId: foundedExpireServices[i]._id,
          oldSubscriptionDate,
          newSubscriptionDate
        })
      }
    }
    for (const j in foundedExpireNowServices) {
      this.blockService({ serviceId: foundedExpireNowServices[j]._id, reason: 20011 })
    }
  }

  async factorListByServiceId (serviceId) {
    return await this.factorRepository.factorListByServiceId(serviceId)
  }

  async factorPriceByServiceId (serviceId) {
    const factorList = await this.factorRepository.factorListByServiceId(serviceId)
    console.log({ factorList })
    const factors = []
    for (const i in factorList) {
      factors.push(String(factorList[i]._id))
    }
    let price = 0
    for (const i in factorList) {
      price = factorList[i].price + price
    }
    console.log({ price, count: factorList.length })
    return { price, count: factorList.length, factorsList: factors }
  }

  async blockService ({ serviceId, userType, reason, description, managerComment, blocker, blockerUserType, blockDate = Date.now() }) {
    const isBlockByReason = await this.factorRepository.isBlockByReason({ serviceId, reason })
    if (!isBlockByReason) {
      const foundedBlock = await this.factorRepository.findServiceBlocks(serviceId)
      foundedBlock.push({ reason, description, blocker, blockerUserType, blockDate, userType, managerComment })
      return await this.factorRepository.blockService({
        serviceId,
        foundedBlock
      })
    }
  }

  changeFactorStatus = async (arg) => await this.factorRepository.changeFactorStatus(arg)
}
module.exports = new FactorService(FactorRepository, UtilService)
