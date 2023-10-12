const User = require("../models/user.model");
const Service = require("../models/service.model");
const Withdrawal = require("./withdrawal.model");
const Student = require("../models/student.model");
const moment = require("moment");

class WithdrawalRepository {
  constructor() {}
  findUserById = async (userId) => {
    return await User.findById(userId);
  };

  findWithrawalById = async (id) => {
    return await Withdrawal.findById(id);
  };

  updateWithrawal = async ({withdrawalId, status, description, shabaId, bankId, bankName}) => {
    return await Withdrawal.findByIdAndUpdate(withdrawalId, {status, description, shabaId, bankId, bankName}, {new: true});
  };

  async checkWallet({id, amount}) {
    const user = await User.findById(id);
    return user.balance >= amount;
  }

  async checkProfitWallet({id, amount}) {
    const user = await User.findById(id);
    return user?.companyInformation?.profitBalance >= amount;
  }

  async changeWallet({id, amount}) {
    await User.findByIdAndUpdate(id, {$inc: {balance: amount}}, {new: true});
    return true;
  }

  async changeProfitWallet({id, amount}) {
    await User.findByIdAndUpdate(id, {$inc: {"companyInformation.profitBalance": amount}}, {new: true});
    return true;
  }

  async createWithdrawal({
    amount,
    userId,
    type,
    superAgent,
    driver,
    company,
    city,
    province,
    shabaId,
    bankId,
    bankName,
    trackingCode,
    description,
    phoneNumber,
    name,
  }) {
    if (!shabaId && !bankId) {
      const foundedWithdrawal = await Withdrawal.findOne({userId, status: "SUCCESS"});
      shabaId = foundedWithdrawal?.shabaId ? foundedWithdrawal?.shabaId : 0;
      bankId = foundedWithdrawal?.bankId ? foundedWithdrawal?.bankId : 0;
      bankName = foundedWithdrawal?.bankName ? foundedWithdrawal?.bankName : "0";
    }
    return await Withdrawal({
      amount,
      userId,
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
      name,
    }).save();
  }

  async find({query, limit, page, populate, sort}) {
    return await Withdrawal.paginate(query, {limit, page, lean: true, sort, populate});
  }
  async findNeedPay({query, limit = 10, page = 1}) {
    const result = await Withdrawal.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: "$userId",
          totalAmount: {$sum: "$amount"},
          trackingCode: {$push: "$trackingCode"},
          description: {$push: "$description"},
          name: {$first: "$name"},
          phoneNumber: {$first: "$phoneNumber"},
          status: {$first: "$status"},
          count: {$count: {}},
          shabaId: {$first: "$shabaId"},
          bankId: {$first: "$bankId"},
          bankName: {$first: "$bankName"},
          type: {$first: "$type"},
        },
      },
      {
        $sort: {createdAt: -1},
      },
    ]);

    const startIndex = (page - 1) * limit;

    // Slice the result array to get the paginated data
    const paginatedResult = result.slice(startIndex, startIndex + limit);

    return paginatedResult;
    // return result
  }
}
module.exports = new WithdrawalRepository();
