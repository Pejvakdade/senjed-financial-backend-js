const { v4: uuidv4 } = require("uuid")
const axios = require("axios").default
const StatusCodes = require("../Values/StatusCodes")
const ErrorHandler = require("../Handler/ErrorHandler")

class UtilService {
  constructor() {}
  async uuidv4() {
    return uuidv4()
  }

  async escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
  }

  async axiosInstance({ url, data = {}, token, type }) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      let result
      if (type === "post") {
        result = await axios.post(url, data, config)
        return result.data.result
      } else if (type === "put") {
        result = await axios.put(url, data, config)
        return result.data.result
      } else if (type === "get") {
        result = await axios.get(url, data, config)
        return result.data.result
      }
    } catch (e) {
      console.log(e)
      return false
    }
  }

  axiosInstanceV2 = async ({ url, data = {}, token, method = "get", type = "PASSENGER", params }) => {
    try {
      const result = await axios({
        method,
        headers: { Authorization: `Bearer ${token}`, type },
        url: params ? url + "?" + params.join("&") : url,
        data,
      })
      return result.data.result
    } catch (error) {
      if (error.response) {
        console.error({
          responseError: error.response.data,
          url,
          type,
          data: error.response.config.data,
        })
        return false
      } else if (error.request) {
        console.error({ type, url, axiosRequestError: error.request })
        return Promise.reject(error.request)
      } else {
      }
      console.error({ type, url, error })
      return false
    }
  }

  async calculateOneWayPrice({ distance, duration, DTO }) {
    const { leastDist, costForExtraKm, formulaRatio, ratioConstant, startCost } = DTO
    const distanceTimeRatio = duration - distance * formulaRatio
    const distanceDivideByTime = duration / distance
    const extraKmDivideByThree = costForExtraKm / 3
    const distanceMinusLeastDist = distance - leastDist < 0 ? 0 : distance - leastDist
    let price
    if (distance <= leastDist && distanceTimeRatio < 0) {
      price = startCost
    } else if (distance <= leastDist && distanceTimeRatio > 0) {
      price = startCost + distanceTimeRatio * extraKmDivideByThree
    } else if (distanceDivideByTime < formulaRatio) {
      price = startCost + distanceMinusLeastDist * costForExtraKm
    } else {
      price = startCost + ((distanceDivideByTime - formulaRatio) * ratioConstant + costForExtraKm) * distanceMinusLeastDist
    }
    return price
  }

  async calcShare(share, amount) {
    const calcShare = {}
    const result = Object.keys(share).map((key, index) => {
      calcShare[key] = ((share[key] / 100) * amount).toFixed(2)
    })
    return calcShare
  }
}
module.exports = new UtilService()
