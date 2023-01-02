const express = require('express')
const FinancialController = require('../../Financial/financial.controller')
const router = express.Router()
const { Heimdall, Auth } = require('../../Middleware')

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.get('/calculate-price', use(FinancialController.calculatePrice.bind(FinancialController)))

router.post('/discount', Auth, use(FinancialController.createDiscount.bind(FinancialController)))
router.get('/discounts', Auth, use(FinancialController.allDiscount.bind(FinancialController)))
router.get('/discount', Auth, use(FinancialController.useDiscount.bind(FinancialController)))

router.get('/exl-subscription-count', use(FinancialController.creteExel.bind(FinancialController)))

router.get('/calculate-travel-share', Auth, use(FinancialController.calculateShare.bind(FinancialController)))

router.get('/finish-travel-online-payment', Auth, use(FinancialController.finishTravelWithOnlinePayment.bind(FinancialController)))
router.get('/finish-travel-offline-payment', Auth, use(FinancialController.finishTravelWithOfflinePayment.bind(FinancialController)))

router.get('/pay-driver-debt', use(FinancialController.payDriverDebts.bind(FinancialController)))
router.get('/pay-driver-debt-continues', use(FinancialController.payDriverDebtsContinues.bind(FinancialController)))
router.get('/pay-driver-debt-from-balance', use(FinancialController.payDriverDebtsWFromBalance.bind(FinancialController)))
router.put('/pay-driver-debt-internal-by-parent', Heimdall, use(FinancialController.payDriverDebtsInternal.bind(FinancialController)))
router.get('/pay-driver-subscription', use(FinancialController.payDriverSubscription.bind(FinancialController)))
router.get('/pay-driver-subscription-continues', use(FinancialController.payDriverSubscriptionContinues.bind(FinancialController)))
router.get('/pay-driver-subscription-from-balance', use(FinancialController.payDriverSubscriptionFromBalance.bind(FinancialController)))
router.put('/pay-driver-subscription-internal', Heimdall, use(FinancialController.payDriverSubscriptionInternal.bind(FinancialController)))

module.exports = router
