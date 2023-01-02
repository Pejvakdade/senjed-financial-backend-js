const FinancialRoutes = require('./financial.routes')
const PaymentRoutes = require('./payment.routes')
const FinancialGroupRoutes = require('./financialGroup.routes')
const TransactionRoutes = require('./transaction.routes')
const TravelGroupRoutes = require('./travelGroup.routes')
const DeliveryGroupRoutes = require('./deliveryGroup.routes')
const InvoiceRoutes = require('./invoice.routes')
const WithdrawalRoutes = require('./withdrawal.routes')

const express = require('express')
const router = express.Router()

router.use('/payment', PaymentRoutes)
router.use('/financial', FinancialRoutes)
router.use('/financial-group', FinancialGroupRoutes)
router.use('/travel-group', TravelGroupRoutes)
router.use('/delivery-group', TravelGroupRoutes)
router.use('/transaction', TransactionRoutes)
router.use('/invoice', InvoiceRoutes)
router.use('/withdrawal', WithdrawalRoutes)

module.exports = router
