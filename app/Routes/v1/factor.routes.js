const express = require("express");
const FactorController = require("../../Factor/factor.controller");
const router = express.Router();

const {_id} = require("../../Middleware/validator/params");
// const Heimdall = require('../../Middleware/heimdall')

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
router.post("/", use(FactorController.checkExpireServices.bind(FactorController)));
router.delete("/:_id", _id, use(FactorController.deleteFactor.bind(FactorController)));

module.exports = router;
