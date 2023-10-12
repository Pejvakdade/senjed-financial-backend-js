const express = require("express")
const { WithdrawalController } = require("../../Withdrawal")

const router = express.Router()
const { Auth } = require("../../Middleware")

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.post("/request", Auth, use(WithdrawalController.request.bind(WithdrawalController)))
// router.post("/company/request-from-profit", Auth, use(WithdrawalController.requestFromProfit.bind(WithdrawalController)))

router.put("/accept", Auth, use(WithdrawalController.acc.bind(WithdrawalController)))
router.put("/reject", Auth, use(WithdrawalController.reject.bind(WithdrawalController)))
router.post("/find", Auth, use(WithdrawalController.find.bind(WithdrawalController)))
router.post("/find-need-pay", Auth, use(WithdrawalController.findNeedPay.bind(WithdrawalController)))

module.exports = router
