const express = require("express")
const router = express.Router()
const Heimdall = require("../../Middleware/heimdall")
const TransactionController = require("../../Transaction/transaction.controller")

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// router.post('/s-f', Heimdall, use(TransactionController.searchAndFilterTransaction.bind(TransactionController)))
router.post("/find", Heimdall, use(TransactionController.findTransactions.bind(TransactionController)))
router.post("/find-child", Heimdall, use(TransactionController.findChildTransactions.bind(TransactionController)))
// router.get('/gateway', Heimdall, use(TransactionController.getTransactionsByGateway.bind(TransactionController)))
// router.get('/status', Heimdall, use(TransactionController.getTransactionByStatus.bind(TransactionController)))
// router.get('/reason', Heimdall, use(TransactionController.getTransactionsByReason.bind(TransactionController)))
// router.get('/reason-by-id', Heimdall, use(TransactionController.getTransactionByReasenforUser.bind(TransactionController)))
// router.get('/transaction-by-id', Heimdall, use(TransactionController.getTransactionById.bind(TransactionController)))
// router.post('/find', Heimdall, use(TransactionController.findTransactions.bind(TransactionController)))

module.exports = router
