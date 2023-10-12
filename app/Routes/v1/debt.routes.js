const express = require("express")
const router = express.Router()
const { Auth } = require("../../Middleware")
const DebtController = require("../../Debt/debt.controller")

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
router.post("/find", Auth, use(DebtController.findDebt.bind(DebtController)))
router.post("/find-price-company-to-driver", Auth, use(DebtController.findAllDebtPriceCompanyToDriver.bind(DebtController)))

module.exports = router
