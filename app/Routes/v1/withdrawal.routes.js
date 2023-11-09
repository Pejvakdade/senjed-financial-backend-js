const {Auth} = require("../../Middleware");
const {WithdrawalController} = require("../../Withdrawal");

const express = require("express");
const router = express.Router();

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET
router.get("/find-by-userId/:_id", Auth, use(WithdrawalController.findByUserId.bind(WithdrawalController)));

// PUT
router.put("/accept", Auth, use(WithdrawalController.acc.bind(WithdrawalController)));
router.put("/reject", Auth, use(WithdrawalController.reject.bind(WithdrawalController)));
router.put("/pay-by-userId/:_id", Auth, use(WithdrawalController.findByUserIdAndPay.bind(WithdrawalController)));

// POST
router.post("/find", Auth, use(WithdrawalController.find.bind(WithdrawalController)));
router.post("/request", Auth, use(WithdrawalController.request.bind(WithdrawalController)));
router.post("/find-need-pay", Auth, use(WithdrawalController.findNeedPay.bind(WithdrawalController)));

module.exports = router;
