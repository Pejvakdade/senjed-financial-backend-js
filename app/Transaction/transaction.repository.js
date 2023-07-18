const SchoolTransaction = require('./transaction.model')
const UtilService = require('../Utils/util.service')
const mongoose = require('mongoose')
class TransactionRepository {
  constructor (utilService) {
    this.utilService = utilService
  }

  async createTransaction ({
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
    subscribe
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
      subscribe
    }).save()
  }

  async findTransactionByAuthority (authority) {
    console.log(authority)
    const result = await SchoolTransaction.findOne({ authority })
    return result
  }

  async updateTransaction ({ authority, reason, status, isCallBack }) {
    await SchoolTransaction.findOneAndUpdate({ authority }, { reason, transactionStatus: status, isCallBack })
    return true
  }
}

module.exports = new TransactionRepository(UtilService)
