const util = require("util")
const redisObject = require("redis")
const { ErrorHandler } = require("../Handler")

const redis = redisObject.createClient({ url: "redis://localhost:7302" })

redis.on("connect", function () {
  console.log("Redis Connected")
})

redis.on("error", function (err) {
  console.log({ REDIS_ERROR: err })
  throw new ErrorHandler({ statusCode: statusCodes.ERROR_REDIS, httpCode: 500 })
})
class RedisService {
  async saveEx(id, data, exDate = 120) {
    redis.setex = util.promisify(redis.setex)
    const taha = await redis.setex(id, exDate, JSON.stringify(data))
  }

  async saveExFinancialGroup(id, data, exDate = 2) {
    redis.setex = util.promisify(redis.setex)
    await redis.setex(id, exDate, JSON.stringify(data))
  }

  async get(phoneNumber) {
    redis.get = util.promisify(redis.get)
    const value = await redis.get(phoneNumber)
    return value
  }

  async del(id, data, exDate = 120) {
    redis.del = util.promisify(redis.del)
    await redis.del(id)
  }
}
module.exports = new RedisService()
