const {_id} = require("../../Middleware/validator/params");
const {Auth} = require("../../Middleware");
const {payDebt} = require("../../Middleware/validator/debt.validator");

const DebtController = require("../../Debt/debt.controller");
const express = require("express");
const router = express.Router();

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST
router.post("/find", Auth, use(DebtController.findDebt.bind(DebtController)));
router.post("/pay-by-admin/:_id", Auth, _id, payDebt, use(DebtController.payDebtByAdmin.bind(DebtController)));
router.post("/pay-by-company/:_id", Auth, _id, payDebt, use(DebtController.payDebtByCompany.bind(DebtController)));
router.post("/find-price-company-to-driver", Auth, use(DebtController.findAllDebtPriceCompanyToDriver.bind(DebtController)));

module.exports = router;
