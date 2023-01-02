const express = require('express')
const TravelGroupController = require('../../TravelGroup/travelGroup.controller')
const router = express.Router()
const Heimdall = require('../../Middleware/heimdall')

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
router.get('/s/', Heimdall, use(TravelGroupController.getTravelGroupByName.bind(TravelGroupController)))
router.post('/', Heimdall, use(TravelGroupController.createTravelGroup.bind(TravelGroupController)))
router.get('/', Heimdall, use(TravelGroupController.getTravelGroup.bind(TravelGroupController)))
router.delete('/:id', Heimdall, use(TravelGroupController.deleteTravelGroup.bind(TravelGroupController)))
router.put('/:id', Heimdall, use(TravelGroupController.updateTravelGroup.bind(TravelGroupController)))
router.get('/:id', use(TravelGroupController.getTravelGroupById.bind(TravelGroupController)))

module.exports = router
