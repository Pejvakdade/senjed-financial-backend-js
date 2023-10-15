const express = require("express");
const router = express.Router();
const {Auth} = require("../../Middleware");
const DebtController = require("../../Debt/debt.controller");

const {_id} = require("../../Middleware/validator/params");
const {payDebt} = require("../../Middleware/validator/debt.validator");

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
router.post("/find", Auth, use(DebtController.findDebt.bind(DebtController)));
router.post("/find-price-company-to-driver", Auth, use(DebtController.findAllDebtPriceCompanyToDriver.bind(DebtController)));

router.post("/pay-bay-admin/:_id", Auth, _id, payDebt, use(DebtController.payDebtByAdmin.bind(DebtController)));
router.post("/pay-bay-company/:_id", Auth, _id, payDebt, use(DebtController.payDebtByCompany.bind(DebtController)));

module.exports = router;
