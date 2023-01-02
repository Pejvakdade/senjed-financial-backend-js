const StatusCodes = require('../Values/StatusCodes')
class ResponseHandler {
  constructor (
    res,
    httpCode = 200,
    statusCode = StatusCodes.RESPONSE_SUCCESSFUL,
    result = null
  ) {
    this.res = res
    this.httpCode = httpCode
    this.statusCode = statusCode
    this.result = result
  }

  send ({ res, httpCode, statusCode, result = {}, xls = false }) {
    if (xls) {
      res.xls(result)
    } else {
      res.status(httpCode).json({ CODE: statusCode, result })
    }
  }
}
module.exports = new ResponseHandler()
