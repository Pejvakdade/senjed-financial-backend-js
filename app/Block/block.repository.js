const Service = require("../models/service.model")

class BlockRepository {
  constructor() {}

  async isBlockByReason({ id, reason }) {
    const user = await Service.findOne({
      _id: id,
      "blocks.reason": { $in: reason },
    })
    return user
  }

  async updateMultipleByIdPush({ id, updatedField, updatedValue }) {
    const update = {}
    update[updatedField] = updatedValue
    const updatedUser = await Service.findByIdAndUpdate(id, { $push: update }, { new: true }).exec()
    return updatedUser
  }
}
module.exports = new BlockRepository()
