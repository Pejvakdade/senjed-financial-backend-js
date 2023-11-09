const {PaymentController} = require("../../Payment");

const express = require("express");
const router = express.Router();

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET
router.get("/payment-page", use(PaymentController.getPaymentPage.bind(PaymentController)));
router.get("/redirect-saderat", use(PaymentController.getRedirectSaderat.bind(PaymentController)));
router.get("/failed-payment-page", use(PaymentController.getFailedPaymentPage.bind(PaymentController)));

module.exports = router;
