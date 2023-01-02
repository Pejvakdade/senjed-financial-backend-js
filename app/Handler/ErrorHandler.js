const StatusCodes = require('../Values/StatusCodes')

class ErrorHandler extends Error {
  constructor ({
    httpCode = 500,
    statusCode = StatusCodes.ERROR_INTERNAL,
    result = {}
  }) {
    super('')
    this.httpCode = httpCode
    this.statusCode = statusCode
    this.result = result
  }
}
module.exports = ErrorHandler
