const FactorRepository = require("./factor.repository");
const UtilService = require("../Utils/util.service");
const BlockService = require("../Block/block.service");
const FinancialGroupService = require("../FinancialGroup/financialGroup.service");
const FinancialRepository = require("../Financial/financial.repository");
const Api = require("../Api");
const ErrorHandler = require("../Handler/ErrorHandler");
const {StatusCodes} = require("../Values");
const moment = require("moment");

class FactorService {
  constructor() {
    this.FactorRepository = FactorRepository;
    this.UtilService = UtilService;
    this.BlockService = BlockService;
  }

  async createFactor({price, serviceId, oldSubscriptionDate, newSubscriptionDate}) {
    const foundedService = await this.FactorRepository.findService(serviceId);
    if (foundedService) {
      return await this.FactorRepository.createFactor({
        price,
        serviceId,
        parent: foundedService.parent,
        secondParent: foundedService?.secondParent,
        student: foundedService?.student,
        driver: foundedService?.driver,
        company: foundedService?.company,
        oldSubscriptionDate,
        newSubscriptionDate,
      });
    } else false;
  }

  async checkExpireServices() {
    const foundedExpireServices = await this.FactorRepository.foundedExpireServices(); // lte +8 daye to expire
    const foundedExpireNowServices = await this.FactorRepository.foundedExpireNowServices(); // now expire
    //!for now expire
    if (foundedExpireNowServices.length)
      for (const i in foundedExpireNowServices) {
        const foundedFinancialGroup = foundedExpireNowServices[i].financialGroupSchool;
        if (!foundedFinancialGroup) continue;
        const cycle = foundedExpireNowServices[i].cycle;
        let arrayOfDate = [];
        let daysLeft = moment.duration(moment(foundedExpireNowServices[i].expire, "YYYY-MM-DD").diff(moment())).asDays(); // tedad roz gozashte
        if (daysLeft < 0) {
          daysLeft = Math.abs(daysLeft);

          let countOfFacktor = Math.ceil(daysLeft / cycle);
          let oldDate = new Date(foundedExpireNowServices[i].expire);
          for (let j = 0; j < countOfFacktor; j++) {
            const tempOldDate = new Date(oldDate);
            const newOldDate = new Date(tempOldDate.setDate(tempOldDate.getDate() + cycle));
            const hasFactor = await this.FactorRepository.hasFactor({
              serviceId: foundedExpireNowServices[i]._id,
              oldSubscriptionDate: oldDate,
            });

            if (hasFactor === false) {
              await this.createFactor({
                price: foundedExpireNowServices[i].price,
                serviceId: foundedExpireNowServices[i]._id,
                oldSubscriptionDate: oldDate,
                newSubscriptionDate: newOldDate,
              });
            }
            await this.BlockService.subscription(foundedExpireNowServices[i]._id);
            oldDate = newOldDate;
          }

          await FinancialRepository.updateHasFactorFlag({id: foundedExpireNowServices[i]._id, hasFactor: true});
        }

        //!for have lte 8 day to expire
      }
    for (const i in foundedExpireServices) {
      const hasFactor = await this.FactorRepository.hasFactor({
        serviceId: foundedExpireServices[i]._id,
        oldSubscriptionDate: foundedExpireServices[i].expire,
      });
      const oldSubscriptionDate = new Date(foundedExpireServices[i].expire);
      const foundedFinancialGroup = foundedExpireServices[i].financialGroupSchool;
      const cycle = foundedExpireServices[i].cycle;

      if (hasFactor === false) {
        const tempExpireDate = new Date(foundedExpireServices[i].expire);
        const newSubscriptionDate = tempExpireDate.setDate(tempExpireDate.getDate() + cycle);

        await this.createFactor({
          price: foundedExpireServices[i].price,
          serviceId: foundedExpireServices[i]._id,
          oldSubscriptionDate,
          newSubscriptionDate,
        });
      }
      await FinancialRepository.updateHasFactorFlag({id: foundedExpireServices[i]._id, hasFactor: true});
    }
    for (const j in foundedExpireNowServices) {
      this.blockService({serviceId: foundedExpireNowServices[j]._id, reason: 20011});
    }
  }

  async factorListByServiceId(serviceId) {
    return await this.FactorRepository.factorListByServiceId(serviceId);
  }

  /**
   *
   * @param {string} serviceId
   * @returns {Promise<{ price: number, count: number, factorsList: any[] }>}
   * @throws {Error}
   */
  async factorPriceByServiceId(serviceId) {
    const factorList = await this.FactorRepository.factorListByServiceId(serviceId);
  
    let price = 0;
    for (const i in factorList) {
      price = factorList[i].price + price;
    }
    return {price, count: factorList.length, factorsList: factorList};
  }

  async factorByDriverId(driverId) {
    return await this.FactorRepository.findFactorByDriverId(driverId);
  }

  async blockService({serviceId, userType, reason, description, managerComment, blocker, blockerUserType, blockDate = Date.now()}) {
    const isBlockByReason = await this.FactorRepository.isBlockByReason({serviceId, reason});
    if (!isBlockByReason) {
      const foundedBlock = await this.FactorRepository.findServiceBlocks(serviceId);
      foundedBlock.push({reason, description, blocker, blockerUserType, blockDate, userType, managerComment});
      return await this.FactorRepository.blockService({
        serviceId,
        foundedBlock,
      });
    }
  }

  changeFactorStatus = async (arg) => await this.FactorRepository.changeFactorStatus(arg);
}
module.exports = new FactorService();
