const express = require("express")
const FinancialController = require("../../Financial/financial.controller")
const router = express.Router()
const { Heimdall, Auth } = require("../../Middleware")

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.get("/price-to-pay", Auth, use(FinancialController.priceToPay.bind(FinancialController)))
router.post("/pay-service", Auth, use(FinancialController.payServiceSubscription.bind(FinancialController)))
router.get("/pay-service-continues", use(FinancialController.payServiceSubscriptionContinues.bind(FinancialController)))

router.post("/deposit", Auth, use(FinancialController.deposit.bind(FinancialController)))
router.get("/deposit-continues", use(FinancialController.depositContinues.bind(FinancialController)))

module.exports = router
