const TransactionRepository = require("./transaction.repository")
class TransactionService {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository
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
    service,
    driver,
    student,
    company,
    superAgent,
    authority,
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
    city,
    withdrawalId,
  }) {
    return await this.transactionRepository.createTransaction({
      amount,
      transactionStatus,
      payerId,
      payerType,
      service,
      receiverId,
      receiverType,
      parent,
      secondParent,
      school,
      driver,
      student,
      city,
      company,
      superAgent,
      authority,
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
      withdrawalId,
    })
  }

  async findTransactionByAuthority(authority) {
    const result = await this.transactionRepository.findTransactionByAuthority(authority)
    return result
  }

  findTransactions = async (arg) => await this.transactionRepository.findTransactions(arg)

  async updateTransaction({ authority, reason, status, isCallBack }) {
    await this.transactionRepository.updateTransaction({
      authority,
      reason,
      status,
      isCallBack,
    })
    return true
  }
}
module.exports = new TransactionService(TransactionRepository)
