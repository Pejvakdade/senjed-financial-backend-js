const TransactionService = require('./transaction.service')
const ResponseHandler = require('../Handler/ResponseHandler')
const ValidatorService = require('../Handler/Validator.service')
const { Constant, StatusCodes } = require('../Values')

class TransactionController {
  constructor (transactionService, validatorService) {
    this.transactionService = transactionService
    this.validatorService = validatorService
  }

  async getTransaction (req, res) {
    const { page } = req.query
    const result = await this.transactionService.getTransactions(page)
    return result
  }
}
module.exports = new TransactionController(TransactionService, ValidatorService)
