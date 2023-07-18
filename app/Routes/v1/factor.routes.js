const express = require('express')
const FactorController = require('../../Factor/factor.controller')
const router = express.Router()
// const Heimdall = require('../../Middleware/heimdall')

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
router.post('/', use(FactorController.checkExpireServices.bind(FactorController)))

module.exports = router
