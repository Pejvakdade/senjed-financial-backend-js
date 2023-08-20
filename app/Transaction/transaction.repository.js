const SchoolTransaction = require("./transaction.model")
const UtilService = require("../Utils/util.service")
const mongoose = require("mongoose")
class TransactionRepository {
  constructor(utilService) {
    this.utilService = utilService
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
  }) {
    console.log({ repoooooooo: { city, getway } })
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
    }).save()
  }

  async findTransactionByAuthority(authority) {
    console.log(authority)
    const result = await SchoolTransaction.findOne({ authority })
    return result
  }

  async updateTransaction({ authority, reason, status, isCallBack }) {
    await SchoolTransaction.findOneAndUpdate({ authority }, { reason, transactionStatus: status, isCallBack })
    return true
  }

  async findTransactions({ query, limit, page, populate }) {
    console.log({ query: query.$and })
    return await SchoolTransaction.paginate(query, { limit, page, lean: true, sort: { createdAt: -1 }, populate })
  }
}

module.exports = new TransactionRepository(UtilService)
