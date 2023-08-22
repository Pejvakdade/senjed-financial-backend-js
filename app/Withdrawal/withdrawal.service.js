const WithdrawalRepository = require("./withdrawal.repository")
const ErrorHandler = require("../Handler/ErrorHandler")
const { StatusCodes, Message } = require("../Values")

class WithdrawalService {
  constructor() {
    this.WithdrawalRepository = WithdrawalRepository
  }

  checkWallet = async (arg) => await this.WithdrawalRepository.checkWallet(arg)

  findUserById = async (arg) => await this.WithdrawalRepository.findUserById(arg)

  findWithrawalById = async (arg) => await this.WithdrawalRepository.findWithrawalById(arg)

  updateWithrawal = async (arg) => await this.WithdrawalRepository.updateWithrawal(arg)

  createWithdrawal = async (arg) => await this.WithdrawalRepository.createWithdrawal(arg)

  changeWallet = async (arg) => await this.WithdrawalRepository.changeWallet(arg)

  find = async (arg) => await this.WithdrawalRepository.find(arg)
}
module.exports = new WithdrawalService()
