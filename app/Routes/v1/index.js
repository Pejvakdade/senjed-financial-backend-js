const FinancialRoutes = require("./financial.routes")
const PaymentRoutes = require("./payment.routes")
const FinancialGroupRoutes = require("./financialGroup.routes")
const FactorRoutes = require("./factor.routes")
const TransactionRoutes = require("./transaction.routes")
const WithdrawalRoutes = require("./withdrawal.routes")

const express = require("express")
const router = express.Router()

router.use("/payment", PaymentRoutes)
router.use("/factor", FactorRoutes)
router.use("/financial", FinancialRoutes)
router.use("/financial-group", FinancialGroupRoutes)
router.use("/transaction", TransactionRoutes)
router.use("/withdrawal", WithdrawalRoutes)

module.exports = router
