const TransactionRepository = require("./transaction.repository");
class TransactionService {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * @param {{
   *  city: string,
   *  count: number,
   *  amount: number,
   *  school: string,
   *  parent: string,
   *  reason: string,
   *  driver: string,
   *  fishId?: string,
   *  getway?: string,
   *  target?: string,
   *  payerId: string,
   *  service: string,
   *  student: string,
   *  company: string,
   *  isOnline: boolean,
   *  payerType: string,
   *  authority: number,
   *  isDeposit: boolean,
   *  superAgent: string,
   *  receiverId?: string,
   *  factorsList: string[],
   *  isForClient: boolean,
   *  description: string,
   *  secondParent: string,
   *  receiverType?: string,
   *  withdrawalId?: string,
   *  offlinePayType?: string,
   *  payerOriginType?: string,
   *  transactionStatus: string,
   *  schoolFinancialGroup: string,
   * }} param0
   *
   * @returns {Promise<any>}
   */
  async createTransaction({
    city,
    count,
    fishId,
    parent,
    getway,
    school,
    driver,
    amount,
    reason,
    target,
    service,
    student,
    company,
    payerId,
    isOnline,
    payerType,
    authority,
    isDeposit,
    superAgent,
    receiverId,
    factorsList,
    isForClient,
    description,
    secondParent,
    withdrawalId,
    receiverType,
    offlinePayType,
    payerOriginType,
    transactionStatus,
    schoolFinancialGroup,
  }) {
    return await this.transactionRepository.createTransaction({
      city,
      count,
      fishId,
      parent,
      getway,
      school,
      driver,
      amount,
      reason,
      target,
      service,
      student,
      company,
      payerId,
      isOnline,
      payerType,
      authority,
      isDeposit,
      superAgent,
      receiverId,
      factorsList,
      isForClient,
      description,
      secondParent,
      withdrawalId,
      receiverType,
      offlinePayType,
      payerOriginType,
      transactionStatus,
      schoolFinancialGroup,
    });
  }

  async findTransactionByAuthority(authority) {
    const result = await this.transactionRepository.findTransactionByAuthority(authority);
    return result;
  }

  findTransactions = async (arg) => await this.transactionRepository.findTransactions(arg);

  updateManyTransaction = async (arg) => await this.transactionRepository.updateManyTransaction(arg);

  findManyTransactionByAuthority = async (arg) => await this.transactionRepository.findManyTransactionByAuthority(arg);

  faildMayTransactiondByDriverId = async (arg) => await this.transactionRepository.faildMayTransactiondByDriverId(arg);

  async updateTransaction({authority, reason, status, isCallBack}) {
    await this.transactionRepository.updateTransaction({
      authority,
      reason,
      status,
      isCallBack,
    });
    return true;
  }
}
module.exports = new TransactionService(TransactionRepository);
