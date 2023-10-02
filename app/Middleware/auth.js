const jwt = require("jsonwebtoken")
const statusCodes = require("../Values/StatusCodes")
const Api = require("../Api")

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const type = req.headers.type
    const decodeToken = jwt.decode(token)
    const foundedUser = await Api.getDriverById(decodeToken.id)
    const userTypeExist = foundedUser.userTypes.includes(type)
    let tokenNotMatch = false
    for (let i = 0; i < foundedUser.tokens.length; i++) {
      if (foundedUser.tokens[i].userType === type) {
        if (foundedUser.tokens[i].token !== token) tokenNotMatch = true
      }
    }
    if (!foundedUser) res.status(403).json({ CODE: statusCodes.AUTH_FAILED })
    if (tokenNotMatch) return res.status(403).json({ CODE: statusCodes.AUTH_FAILED })
    if (!userTypeExist) return res.status(403).json({ CODE: statusCodes.AUTH_FAILED })
    if (!token) res.status(403).json({ CODE: statusCodes.AUTH_FAILED })
    if (!decodeToken) res.status(403).json({ CODE: statusCodes.AUTH_FAILED })
    else {
      req.phoneNumber = foundedUser.phoneNumber
      req.userId = foundedUser._id
      req.token = token
      req.type = type
      next()
    }
  } catch (e) {
    console.log({ e })
    res.status(403).json({ CODE: statusCodes.AUTH_FAILED })
  }
}
