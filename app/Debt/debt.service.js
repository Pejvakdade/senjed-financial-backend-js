const DebtRepository = require("./debt.repository");
const UtilService = require("../Utils/util.service");
const BlockService = require("../Block/block.service");
const TransactionService = require("../Transaction/transaction.service");
const FinancialGroupService = require("../FinancialGroup/financialGroup.service");
const FinancialRepository = require("../Financial/financial.repository");
const Api = require("../Api");
const ErrorHandler = require("../Handler/ErrorHandler");
const {StatusCodes, userRoles} = require("../Values");
const moment = require("moment");

class DebtService {
  constructor() {
    this.DebtRepository = DebtRepository;
    this.UtilService = UtilService;
    this.BlockService = BlockService;
    this.TransactionService = TransactionService;
    this.userRoles = userRoles;
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

  findDebt = async (arg) => await this.DebtRepository.findDebt(arg);

  findDebtPriceForCompany = async (arg) => await this.DebtRepository.findDebtPriceForCompany(arg);

  findAllDebtPrice = async (arg) => await this.DebtRepository.findAllDebtPrice(arg);

  /**
   *
   * @param {string} debtId
   * @returns {Promise<import("./debt.model").DebtModel | null>}
   */
  findDebtById = async (debtId) => await this.DebtRepository.findDebtById(debtId);

  /**
   * Throws an error if the _id did NOT exist in MongoDB.
   * @param {import("mongoose").ObjectId} _id - The _id of Debt to check.
   * @throws {ErrorHandler} Throws an error if the _id did NOT exist in MongoDB.
   */
  async errorIfDebtNotFoundByReceiverId(_id) {
    if (!(await this.DebtRepository.findDebtByReceiverId(_id))) {
      return res.status(404).json({ statusCode: StatusCodes.ERROR_DEBT_NOT_FOUND });
    }
  }

  /**
   * Throws an error if the user type is not 'ADMIN'.
   * @param {string} userType - The type of user to check.
   * @throws {ErrorHandler} Throws an error if the user type is not 'ADMIN'.
   */
  errorIfNotAdmin(userType) {
    if (userType !== this.userRoles.ADMIN) {
      return res.status(403).json({ statusCode: StatusCodes.ERROR_ONLY_ADMIN });
    }
  }

  /**
   * Throws an error if the user type is not 'COMPANY'.
   * @param {string} userType - The type of user to check.
   * @throws {ErrorHandler} Throws an error if the user type is not 'COMPANY'.
   */
  errorIfNotComapny(userType) {
    if (userType !== this.userRoles.COMPANY) {
      return res.status(403).json({ statusCode: StatusCodes.ERROR_ONLY_COMPANY });
    }
  }

  /**
   *
   * @param {import("mongoose").ObjectId} _id
   * @param {"SUCCESS" | "FAILED" | "PENDING"} status
   * @param {{
   *    fishId: string,
   *    paidDate: string,
   *    paymentType: "CARD_BY_CARD" | "POS_MACHINE" | "TRANSFER",
   * }} values
   * @returns {Promise<import("./debt.model").DebtModel | null>}
   */
  async findAndPayDebtByReceiverId(_id, values, status = "SUCCESS") {
    console.log({
      _id, values
    })
    return await this.DebtRepository.findByIdAndUpdateAfterPayment(_id, {
      status,
      fishId: values.fishId,
      paidDate: values.paidDate,
      paymentType: values.paymentType,
    });
  }
}
module.exports = new DebtService();
