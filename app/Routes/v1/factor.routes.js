const FactorController = require("../../Factor/factor.controller");

const express = require("express");
const router = express.Router();

const {_id} = require("../../Middleware/validator/params");

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST
router.post("/", use(FactorController.checkExpireServices.bind(FactorController)));
router.post("/find-by-company-id", use(FactorController.findByCompanyId.bind(FactorController)));

// DELETE
router.delete("/:_id", _id, use(FactorController.deleteFactor.bind(FactorController)));

module.exports = router;
