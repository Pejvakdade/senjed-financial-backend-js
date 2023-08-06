const statusCodes = require("../Values/StatusCodes")
const Api = require("../Api")

module.exports = async (req, res, next) => {
  let token
  let response
  let type
  if (!req.headers.authorization) return res.status(403).json({ CODE: statusCodes.AUTH_FAILED })
  else {
    token = req.headers.authorization.split(" ")[1] || req.query.token
  }
  if (req.headers.type) {
    type = req.headers.type || req.query.type
  }
  try {
    // const decodeToken = jwt.decode(token)
    response = await Api.heimdall({ token, type })
    req.phoneNumber = response.phoneNumber
    req.userId = response.userId
    req.token = token
    req.type = type
    next()
  } catch (e) {
    console.log({ e })
    return res.status(403).json(e.response?.data)
  }
}
