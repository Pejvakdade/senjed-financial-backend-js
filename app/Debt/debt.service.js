const DebtRepository = require("./debt.repository");
const UtilService = require("../Utils/util.service");
const BlockService = require("../Block/block.service");
const TransactionService = require("../Transaction/transaction.service");
const FinancialGroupService = require("../FinancialGroup/financialGroup.service");
const FinancialRepository = require("../Financial/financial.repository");
const Api = require("../Api");
const ErrorHandler = require("../Handler/ErrorHandler");
const {StatusCodes} = require("../Values");
const moment = require("moment");

class DebtService {
  constructor() {
    this.DebtRepository = DebtRepository;
    this.UtilService = UtilService;
    this.BlockService = BlockService;
    this.TransactionService = TransactionService;
  }

  async createDebt({
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
    trackingCode = Math.floor(Math.random() * 10000000000),
    factorsList,
    description,
    status = "PENDING",
    name,
    driverPhoneNumber,
    studentName,
    payerId,
    payerType,
    subscribe,
  }) {
    if (Number(amount) > 0)
      return await this.DebtRepository.createDebt({
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
      });
    else return true;
  }

  async payDebt(debtId) {
    await this.DebtRepository.changeDebtStatus({debtId, status: "SUCCESS", paidDate: new Date()});
    return true;
  }

  changeDebtStatus = async (arg) => await this.DebtRepository.changeDebtStatus(arg);

  find = async (arg) => await this.DebtRepository.find(arg);

  findDebtPriceForCompany = async (arg) => await this.DebtRepository.findDebtPriceForCompany(arg);

  findAllDebtPrice = async (arg) => await this.DebtRepository.findAllDebtPrice(arg);
}
module.exports = new DebtService();
