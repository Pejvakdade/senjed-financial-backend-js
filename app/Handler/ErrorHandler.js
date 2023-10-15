const StatusCodes = require("../Values/StatusCodes");

class ErrorHandler extends Error {
  /**
   *
   * @param {{
   *  httpCode: number, statusCode: number | string, result?: object, message?: string
   * }} param0
   */
  constructor({httpCode = 500, statusCode = StatusCodes.ERROR_INTERNAL, result = {}, message}) {
    super("");
    this.httpCode = httpCode;
    this.statusCode = statusCode;
    this.result = result;
    this.message = message ? message : "";
  }
}
module.exports = ErrorHandler;
