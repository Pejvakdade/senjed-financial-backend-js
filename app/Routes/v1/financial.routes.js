const {Auth} = require("../../Middleware");
const FinancialController = require("../../Financial/financial.controller");

const express = require("express");
const router = express.Router();

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET
router.get("/price-to-pay", Auth, use(FinancialController.priceToPay.bind(FinancialController)));
router.get("/deposit-continues", use(FinancialController.depositContinues.bind(FinancialController)));
router.get("/price-to-pay-driver", Auth, use(FinancialController.priceToPayDriver.bind(FinancialController)));
router.get("/pay-driver-continues", use(FinancialController.payDriverSubscriptionContinues.bind(FinancialController)));
router.get("/pay-service-continues", use(FinancialController.payServiceSubscriptionContinues.bind(FinancialController)));

// POST
router.post("/deposit", Auth, use(FinancialController.deposit.bind(FinancialController)));
router.post("/pay-driver", Auth, use(FinancialController.payDriverSubscription.bind(FinancialController)));
router.post("/pay-service", Auth, use(FinancialController.payServiceSubscription.bind(FinancialController)));
router.post("/pay-driver-factor", Auth, use(FinancialController.payDriverSubscriptionByFactorIds.bind(FinancialController)));
router.post("/pay-service-from-wallet", Auth, use(FinancialController.payServiceSubscriptionFromWalletForCompany.bind(FinancialController)));
router.post("/pay-driver-factor-offline", Auth, use(FinancialController.payFactorsByIdOffline.bind(FinancialController)));

module.exports = router;
