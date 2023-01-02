const express = require('express')
const DeliveryGroupController = require('../../DeliveryGroup/deliveryGroup.controller')
const router = express.Router()
const Heimdall = require('../../Middleware/heimdall')

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
router.get('/s/', Heimdall, use(DeliveryGroupController.getDeliveryGroupByName.bind(DeliveryGroupController)))
router.post('/', Heimdall, use(DeliveryGroupController.createDeliveryGroup.bind(DeliveryGroupController)))
router.delete('/:id', Heimdall, use(DeliveryGroupController.deleteDeliveryGroup.bind(DeliveryGroupController)))
router.put('/:id', Heimdall, use(DeliveryGroupController.updateDeliveryGroup.bind(DeliveryGroupController)))
router.get('/', Heimdall, use(DeliveryGroupController.getDeliveryGroup.bind(DeliveryGroupController)))
router.get('/:id', Heimdall, use(DeliveryGroupController.getDeliveryGroupById.bind(DeliveryGroupController)))

module.exports = router
