const BlockService = require("./block.service")
const axios = require("axios")
const { ErrorHandler, ResponseHandler, ValidatorHandler } = require("../Handler")
const { statusCodes } = require("../values")

class BlockController {
  constructor() {
    this.BlockService = BlockService
  }
}
module.exports = new BlockController()
