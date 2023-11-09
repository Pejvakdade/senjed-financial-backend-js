const TransactionController = require("../../Transaction/transaction.controller");
const {Heimdall, Auth} = require("../../Middleware");

const express = require("express");
const router = express.Router();

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST
router.post("/find", Auth, use(TransactionController.findTransactions.bind(TransactionController)));
router.post("/find-child", Heimdall, use(TransactionController.findChildTransactions.bind(TransactionController)));

module.exports = router;
