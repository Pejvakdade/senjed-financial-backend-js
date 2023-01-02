const TransactionRoutes = require('./transaction.routes')

const express = require('express')
const router = express.Router()

router.use('/transaction', TransactionRoutes)

module.exports = router
