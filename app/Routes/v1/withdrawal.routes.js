const express = require("express")
const { WithdrawalController } = require("../../Withdrawal")

const router = express.Router()
const Heimdall = require("../../Middleware/heimdall")
const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.post("/request", Heimdall, use(WithdrawalController.request.bind(WithdrawalController)))
router.put("/accept", Heimdall, use(WithdrawalController.acc.bind(WithdrawalController)))
router.put("/reject", Heimdall, use(WithdrawalController.reject.bind(WithdrawalController)))
router.post("/find", Heimdall, use(WithdrawalController.find.bind(WithdrawalController)))

module.exports = router
