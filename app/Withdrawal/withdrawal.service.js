const WithdrawalRepository = require("./withdrawal.repository");
const ErrorHandler = require("../Handler/ErrorHandler");
const {StatusCodes, userRoles} = require("../Values");

class WithdrawalService {
  constructor(ErrorHandler, userRoles) {
    this.WithdrawalRepository = WithdrawalRepository;
    this.errorHandler = ErrorHandler;
    this.userRoles = userRoles;
  }

  checkWallet = async (arg) => await this.WithdrawalRepository.checkWallet(arg);

  checkProfitWallet = async (arg) => await this.WithdrawalRepository.checkProfitWallet(arg);

  findUserById = async (arg) => await this.WithdrawalRepository.findUserById(arg);

  findWithrawalById = async (arg) => await this.WithdrawalRepository.findWithrawalById(arg);

  createWithdrawal = async (arg) => await this.WithdrawalRepository.createWithdrawal(arg);

  changeWallet = async (arg) => await this.WithdrawalRepository.changeWallet(arg);

  changeProfitWallet = async (arg) => await this.WithdrawalRepository.changeProfitWallet(arg);

  find = async (arg) => await this.WithdrawalRepository.find(arg);

  findNeedPay = async (arg) => await this.WithdrawalRepository.findNeedPay(arg);

  /**
   * @param {string} _id
   * @param {{
   *    date: string,
   *    status: "SUCCESS" | "REJECT" | "PENDING",
   *    bankId: string,
   *    fishId: string,
   *    shabaId: string,
   *    bankName: string
   *    description: string,
   *    paymentType: string,
   * }} values
   * @returns {Promise<any>}
   */
  async updateWithrawal(_id, values) {
    return await this.WithdrawalRepository.updateWithrawal(_id, values);
  }

  /**
   * @param {string} userType
   * @returns {any}
   */
  throwErrorIfNotAdmin(userType) {
    if (userType !== userRoles.ADMIN) {
      throw new this.errorHandler({
        statusCode: StatusCodes.AUTH_FAILED,
        httpCode: 403,
      });
    }
  }

  /**
   * @param {import("mongoose").ObjectId} _id
   * @returns {Promise<any>}
   */
  async throwErrorIfWithdrawalNotFoundOrNotPending(_id) {
    if (!(await this.findWithrawalById(_id)) && (await this.findWithrawalById(_id)).status !== "PENDING")
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_WITHDRAWAL_STATUS_NOT_PENDING,
        httpCode: 400,
      });
  }

  /**
   * @param {import("mongoose").ObjectId} _id
   * @param
   * @returns {Promise<any>}
   */
  async findWithDrawalWithUserIdIfIsPending(_id) {
    return await this.WithdrawalRepository.findWithDrawalWithUserIdIfIsPending(_id);
  }

  /**
   * @param {import("mongoose").ObjectId} _id
   * @param {{
   *  fishId: string,
   *  paidDate: string,
   *  paymentType: "CARD_BY_CARD" | "POS_MACHINE" | "TRANSFER",
   * }} requestBody
   * @returns {Promise<any>}
   */
  async findWithDrawalWithUserIdAndPayIfIsPending(_id, requestBody) {
    return await this.WithdrawalRepository.findWithDrawalWithUserIdAndPayIfIsPending(_id, requestBody);
  }
}
module.exports = new WithdrawalService(ErrorHandler, userRoles);
