const User = require("../models/user.model");
const Service = require("../models/service.model");
const Student = require("../models/student.model");
const moment = require("moment");

class FinancialRepository {
  constructor() {}
  findServiceById = async (serviceId) => {
    return await Service.findById(serviceId).populate("student driver parent financialGroupSchool company").lean();
  };

  /**
   * @param {string} serviceId
   * @param {boolean} factorStatus
   * @returns {Promise<any>}
   */
  findServiceByIdAndUpdateHasFactor = async (serviceId, factorStatus) => {
    return await Service.findByIdAndUpdate(serviceId, {hasFactor: factorStatus}, {new: true});
  };

  findServiceByDriverId = async (driverId) => {
    return await Service.find({driver: driverId}).populate("student driver parent financialGroupSchool company").lean();
  };

  async findAdminId() {
    const result = await User.findOne({userTypes: {$in: ["ADMIN"]}});
    return result._id;
  }

  async findUserById(id) {
    const result = await User.findById(id);
    return result;
  }

  async findBankSchoolId() {
    const result = await User.findOne({userTypes: {$in: ["BANK_SCHOOL"]}});
    return result._id;
  }

  async findCommissionManagerSchoolId() {
    const result = await User.findOne({userTypes: {$in: ["COMMISSION_MANAGER_SCHOOL"]}});
    return result._id;
  }

  async findTaxId() {
    const result = await User.findOne({userTypes: {$in: ["TAX"]}});
    return result._id;
  }

  async addSubscriptionDay({serviceId, days, date}) {
    serviceId = String(serviceId);
    const foundedService = await Service.findById(serviceId);
    let updatedService;
    if (days) {
      const newDate = moment(foundedService.expire).add(days, "d").format();
      updatedService = await Service.findByIdAndUpdate(
        serviceId,
        {
          expire: newDate,
        },
        {new: true}
      );
    } else {
      updatedService = await Service.findByIdAndUpdate(
        serviceId,
        {
          "foundedService.expire": moment(date).format(),
        },
        {new: true}
      );
    }

    return updatedService;
  }

  async deleteBlockByReasonAndUserType({serviceId, blockReason}) {
    return await Service.findByIdAndUpdate(serviceId, {$pull: {blocks: {reason: blockReason}}}, {new: true}).exec();
  }

  async checkWallet({id, amount}) {
    const user = await User.findById(id);
    return user.balance >= amount;
  }

  async chargeWallet({id, amount}) {
    await User.findByIdAndUpdate(id, {$inc: {balance: amount}}, {new: true});
    return true;
  }

  async chargeWalletCompany({id, amount}) {
    await User.findByIdAndUpdate(id, {$inc: {"companyInformation.profitBalance": amount}}, {new: true});
    return true;
  }

  async canWithdrawal({id, amount}) {
    const user = await User.findById(id);
    return user.balance >= Math.abs(amount);
  }

  async updateHasFactorFlag({id, hasFactor}) {
    const result = await Service.findByIdAndUpdate(id, {hasFactor});
    return result;
  }

  async checkProfitWallet({id, amount}) {
    const user = await User.findById(id);
    return user?.companyInformation?.profitBalance >= amount;
  }

  // async transferToMainBalnceForCompany({ id, amount }) {
  //   await User.findByIdAndUpdate(id, { $inc: { "companyInformation.profitBalance": -amount } }, { new: true })
  //   return await User.findByIdAndUpdate(id, { $inc: { balance: amount } }, { new: true })
  // }
}
module.exports = new FinancialRepository();
