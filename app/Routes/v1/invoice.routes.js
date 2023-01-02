const express = require('express')
const { InvoiceController } = require('../../invoice')

const router = express.Router()
const Heimdall = require('../../Middleware/heimdall')
const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.post('/', Heimdall, use(InvoiceController.createNewInvoice.bind(InvoiceController)))
router.put('/submit', Heimdall, use(InvoiceController.submitInvoice.bind(InvoiceController)))
router.put('/reject', Heimdall, use(InvoiceController.rejectInvoice.bind(InvoiceController)))
router.get('/', Heimdall, use(InvoiceController.getInvoiceById.bind(InvoiceController)))
router.post('/find', Heimdall, use(InvoiceController.findInvoice.bind(InvoiceController)))

module.exports = router
