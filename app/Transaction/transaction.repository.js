const SchoolTransaction = require("./transaction.model");
const UtilService = require("../Utils/util.service");
const mongoose = require("mongoose");
class TransactionRepository {
  constructor(utilService) {
    this.utilService = utilService;
  }

  async createTransaction({
    amount,
    transactionStatus,
    payerId,
    payerType,
    receiverId,
    receiverType,
    parent,
    secondParent,
    school,
    invoiceID,
    authority,
    driver,
    student,
    company,
    superAgent,
    service,
    schoolFinancialGroup,
    reason,
    target,
    count,
    factorsList,
    isForClient,
    description,
    getway,
    isOnline,
    isDeposit,
    subscribe,
    city,
    withdrawalId,
    payerOriginType,
  }) {
    return await SchoolTransaction({
      amount,
      transactionStatus,
      payerId,
      payerType,
      receiverId,
      receiverType,
      parent,
      secondParent,
      school,
      authority,
      driver,
      city,
      invoiceID,
      student,
      service,
      company,
      superAgent,
      schoolFinancialGroup,
      reason,
      target,
      count,
      factorsList,
      isForClient,
      description,
      getway,
      isOnline,
      isDeposit,
      subscribe,
      withdrawalId,
      payerOriginType,
    }).save();
  }

  async findTransactionByAuthority(authority) {
    const result = await SchoolTransaction.findOne({authority});
    return result;
  }

  async findManyTransactionByAuthority(authority) {
    return await SchoolTransaction.find({authority});
  }

  async updateTransaction({authority, reason, status, isCallBack}) {
    await SchoolTransaction.findOneAndUpdate({authority}, {reason, transactionStatus: status, isCallBack});
    return true;
  }

  async updateManyTransaction({authority, reason, status, isCallBack}) {
    await SchoolTransaction.updateMany({authority}, {reason, transactionStatus: status, isCallBack});
    return true;
  }

  async findTransactions({query, limit, page, populate}) {
    return await SchoolTransaction.paginate(query, {limit, page, lean: true, sort: {createdAt: -1}, populate});
  }

  async faildMayTransactiondByDriverId(driverId) {
    return await SchoolTransaction.updateMany({driver: driverId}, {$set: {transactionStatus: "FAILED"}});
  }

  async findTransactionById(_id) {
    return await SchoolTransaction.findById(_id);
  }
}

module.exports = new TransactionRepository(UtilService);
