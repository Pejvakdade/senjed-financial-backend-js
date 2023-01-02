const express = require("express")
const { WithdrawalController } = require("../../Withdrawal")

const router = express.Router()
const Heimdall = require("../../Middleware/heimdall")
const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.post("/", Heimdall, use(WithdrawalController.createWithdrawal.bind(WithdrawalController)))

router.put("/submit", use(WithdrawalController.submitWithdrawal.bind(WithdrawalController)))
router.put("/reject", use(WithdrawalController.rejectWithdrawal.bind(WithdrawalController)))
router.get("/find", use(WithdrawalController.findWithdrawals.bind(WithdrawalController)))

// router.put("/reject", Heimdall, use(WithdrawalController.rejectInvoice.bind(WithdrawalController)))
// router.get("/", Heimdall, use(WithdrawalController.getInvoiceById.bind(WithdrawalController)))
// router.post("/find", Heimdall, use(WithdrawalController.findInvoice.bind(WithdrawalController)))

module.exports = router
