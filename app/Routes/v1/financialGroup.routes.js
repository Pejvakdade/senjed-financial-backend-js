const express = require("express")
const FinancialGroupController = require("../../FinancialGroup/financialGroup.controller")
const router = express.Router()
const Heimdall = require("../../Middleware/")

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
router.post("/", use(FinancialGroupController.createFinancialGroup.bind(FinancialGroupController)))
router.put("/:id", use(FinancialGroupController.updateFinancialGroup.bind(FinancialGroupController)))
router.delete("/:id", use(FinancialGroupController.deleteFinancialGroup.bind(FinancialGroupController)))
router.post("/find/", use(FinancialGroupController.findFinancialGroup.bind(FinancialGroupController)))
// router.put('/:id', Heimdall, use(FinancialGroupController.updateFinancialGroup.bind(FinancialGroupController)))
// router.get('/', Heimdall, use(FinancialGroupController.getFinancialGroup.bind(FinancialGroupController)))
// router.get('/:id', use(FinancialGroupController.getFinancialGroupById.bind(FinancialGroupController)))
// router.post('/subscription/:id', Heimdall, use(FinancialGroupController.hasSubscription.bind(FinancialGroupController)))

module.exports = router
