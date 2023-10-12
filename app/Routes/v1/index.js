const FinancialRoutes = require("./financial.routes");
const PaymentRoutes = require("./payment.routes");
const FinancialGroupRoutes = require("./financialGroup.routes");
const FactorRoutes = require("./factor.routes");
const TransactionRoutes = require("./transaction.routes");
const WithdrawalRoutes = require("./withdrawal.routes");
const DebtRoutes = require("./debt.routes");

const express = require("express");
const router = express.Router();

router.use("/debt", DebtRoutes);
router.use("/factor", FactorRoutes);
router.use("/payment", PaymentRoutes);
router.use("/financial", FinancialRoutes);
router.use("/withdrawal", WithdrawalRoutes);
router.use("/transaction", TransactionRoutes);
router.use("/financial-group", FinancialGroupRoutes);

module.exports = router;
