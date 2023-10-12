const express = require("express");
const FinancialController = require("../../Financial/financial.controller");
const router = express.Router();
const {Heimdall, Auth} = require("../../Middleware");

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/price-to-pay", Auth, use(FinancialController.priceToPay.bind(FinancialController)));
router.get("/price-to-pay-driver", Auth, use(FinancialController.priceToPayDriver.bind(FinancialController)));
router.post("/pay-service", Auth, use(FinancialController.payServiceSubscription.bind(FinancialController)));
router.post("/pay-driver", Auth, use(FinancialController.payDriverSubscription.bind(FinancialController)));
router.get("/pay-service-continues", use(FinancialController.payServiceSubscriptionContinues.bind(FinancialController)));
router.get("/pay-driver-continues", use(FinancialController.payDriverSubscriptionContinues.bind(FinancialController)));

router.post("/deposit", Auth, use(FinancialController.deposit.bind(FinancialController)));
router.get("/deposit-continues", use(FinancialController.depositContinues.bind(FinancialController)));

router.post("/pay-service-from-wallet", Auth, use(FinancialController.payServiceSubscriptionFromWalletForCompany.bind(FinancialController)));
// router.post("/company/transfer-to-main-balance", Auth, use(FinancialController.transferToMainBalnceForCompany.bind(FinancialController)))

module.exports = router;
