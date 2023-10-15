const User = require("../models/user.model");
const Debt = require("./debt.model");
const Service = require("../models/service.model");
const mongoose = require("mongoose");

class DebtRepository {
  constructor() {}
  findService = async (serviceId) => {
    return await Service.findById(serviceId);
  };

  createDebt = async ({
    reason,
    receiverId,
    receiverType,
    superAgent,
    driver,
    student,
    service,
    company,
    city,
    amount,
    trackingCode,
    factorsList,
    description,
    status,
    name,
    driverPhoneNumber,
    studentName,
    payerId,
    payerType,
    subscribe,
  }) => {
    const result = await Debt({
      reason,
      receiverId,
      receiverType,
      superAgent,
      driver,
      student,
      service,
      company,
      city,
      amount,
      trackingCode,
      factorsList,
      description,
      status,
      name,
      driverPhoneNumber,
      studentName,
      payerId,
      payerType,
      subscribe,
    }).save();
    return result;
  };

  async findDebt({query, limit, page, populate}) {
    return limit ? await Debt.paginate(query, {limit, page, lean: true, sort: {createdAt: -1}, populate}) : await Debt.find(query);
  }

  async findDebtPriceForCompany(user) {
    const haveDebt = await Debt.findOne({
      company: user,
      payerType: "COMPANY",
      status: "PENDING",
      reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
    });
    if (haveDebt) {
      const result = await Debt.find({
        company: user,
        payerType: "COMPANY",
        status: "PENDING",
        reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
      });

      // const result = await Debt.aggregate([
      //   {
      //     $match: { payerId: mongoose.Types.ObjectId(String(user)), payerType: "COMPANY", status: "PENDING", reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION" },
      //   },
      //   {
      //     $group: {
      //       _id: "$receiverId",
      //       totalAmount: { $sum: "$amount" },
      //       debtList: { $push: "$_id" },
      //     },
      //   },
      // ])
      return result;
    } else return false;
  }

  /**
   * Find Debt by ID
   *
   * @param {string} debtId
   * @returns {Promise<import("./debt.model").DebtModel | null>}
   */
  async findDebtById(debtId) {
    return await Debt.findById(debtId);
  }

  async findAllDebtPrice({query}) {
    const result = await Debt.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: "$receiverId",
          totalAmount: {$sum: "$amount"},
          trackingCode: {$push: "$trackingCode"},
          name: {$first: "$name"},
          driverPhoneNumber: {$first: "$driverPhoneNumber"},
          studentName: {$first: "$studentName"},
          count: {$count: {}},
        },
      },
    ]);

    return result;
  }

  async changeDebtStatus({debtId, status, paidDate}) {
    return await Debt.findByIdAndUpdate(debtId, {
      status,
      paidDate,
    });
  }

  /**
   *
   * @param {string} _id
   * @param {{
   *    fishId: string,
   *    paidDate: string,
   *    status: "SUCCESS" | "FAILED" | "PENDING",
   *    paymentType: "CARD_BY_CARD" | "POS_MACHINE" |"TRANSFER"
   * }} values
   * @returns {Promise<import("./debt.model").DebtModel | null>}
   */
  async findByIdAndUpdateAfterPayment(_id, values) {
    return await Debt.findByIdAndUpdate(
      _id,
      {
        status: values.status,
        fishId: values.fishId,
        paidDate: values.paidDate,
        paymentType: values.paymentType,
      },
      {new: true}
    );
  }
}
module.exports = new DebtRepository();
