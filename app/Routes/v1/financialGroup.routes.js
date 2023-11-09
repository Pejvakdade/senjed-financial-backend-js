const FinancialGroupController = require("../../FinancialGroup/financialGroup.controller");

const express = require("express");
const router = express.Router();

const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET
router.get("/:id", use(FinancialGroupController.findFinancialGroupById.bind(FinancialGroupController)));

// PUT
router.put("/:id", use(FinancialGroupController.updateFinancialGroup.bind(FinancialGroupController)));

// POST
router.post("/", use(FinancialGroupController.createFinancialGroup.bind(FinancialGroupController)));
router.post("/find/", use(FinancialGroupController.findFinancialGroup.bind(FinancialGroupController)));

// DELETE
router.delete("/:id", use(FinancialGroupController.deleteFinancialGroup.bind(FinancialGroupController)));

module.exports = router;
