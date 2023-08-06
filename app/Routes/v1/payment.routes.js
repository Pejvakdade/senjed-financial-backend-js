const express = require("express")
const { PaymentController } = require("../../Payment")
const router = express.Router()
// const { Heimdall, Auth, Financial } = require('../../Middleware')
const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
router.get("/redirect-saderat", use(PaymentController.getRedirectSaderat.bind(PaymentController)))
// router.get('/zarinpal/deposit', use(PaymentController.deposit.bind(PaymentController)))
// router.get('/zarinpal/verify', use(PaymentController.verifyZarinpalGateway.bind(PaymentController)))
// router.get('/zarinpal/subscription', Heimdall, use(PaymentController.zarinpalSubscription.bind(PaymentController)))
// router.get("/saderat", Heimdall, use(PaymentController.saderatGateway.bind(PaymentController)))
// router.get("/saderat/verify", Heimdall, use(PaymentController.verifySaderatGateway.bind(PaymentController)))
router.get("/payment-page", use(PaymentController.getPaymentPage.bind(PaymentController)))
router.get("/failed-payment-page", use(PaymentController.getFailedPaymentPage.bind(PaymentController)))

module.exports = router
