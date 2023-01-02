const express = require('express')
const TransactionController = require('../../Transaction/transaction.controller')
const router = express.Router()
const Heimdall = require('../../Middleware/heimdall')

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.get('/find', Heimdall, use(TransactionController.findTransactionsV2.bind(TransactionController)))

module.exports = router
