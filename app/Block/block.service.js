// const UserRepository = require("../User/user.repository")
const Blockepository = require("./block.repository")

const { ErrorHandler } = require("../Handler")
const statusCodes = require("../Values/StatusCodes")

class BlockService {
  constructor() {
    this.Blockepository = Blockepository
  }

  async subscription(id) {
    const isBlockSubscription = await this.Blockepository.isBlockByReason({
      id,
      reason: statusCodes.USER_BLOCK_FOR_SUBSCRIPTION,
    })
    if (isBlockSubscription) return true
    const updatedField = ["blocks"]
    const updatedValue = {
      reason: statusCodes.USER_BLOCK_FOR_SUBSCRIPTION,
      description: "SUBSCRIPTION",
      blockDate: Date.now(),
    }
    const updatedDriver = await this.userRepository.updateMultipleByIdPush({
      id,
      updatedField,
      updatedValue,
    })
    return updatedDriver
  }

  // async unblock({ id, blockId }) {
  //   const unblockUser = this.userRepository.deleteBlock({ id, blockId })
  //   return unblockUser
  // }

  // async unblockByReason({ userId, blockReason }) {
  //   const unblockUser = this.userRepository.deleteBlockByReason({
  //     userId,
  //     blockReason,
  //   })
  //   return unblockUser
  // }
}

module.exports = new BlockService()
