const DebtRepository = require("./debt.repository");
const DebtService = require("./debt.service");

const {ResponseHandler, ErrorHandler} = require("../Handler");
const {StatusCodes, userRoles} = require("../Values");
const mongoose = require("mongoose");

/**
 * Debt Controller Class
 */
class DebtController {
  constructor() {
    this.DebtService = DebtService;

    this.userRoles = userRoles;
  }

  async findDebt(req, res) {
    let {page, limit, populate, status, reason, receiverId, receiverType, superAgent, driver, student, service, company, city, amount, search} =
      req.body;

    let query = {$and: []};

    if (req.type === "DRIVER") {
      query.$and.push({driver: req.userId});
    }
    if (req.type === "COMPANY") {
      query.$and.push({company: req.userId});
    }
    if (req.type === "SUPER_AGENT_SCHOOL") {
      query.$and.push({superAgent: req.userId});
    }

    if (status) query.$and.push({status});
    if (reason) query.$and.push({reason});
    if (receiverId) query.$and.push({receiverId});
    if (receiverType) query.$and.push({receiverType});
    if (superAgent) query.$and.push({superAgent});
    if (parent) query.$and.push({parent});
    if (school) query.$and.push({school});
    if (driver) query.$and.push({driver});
    if (student) query.$and.push({student});
    if (company) query.$and.push({company});
    if (service) query.$and.push({service});
    if (amount) query.$and.push({amount});
    if (city) query.$and.push({city});

    if (search) {
      switch (search.searchMode) {
        case "description":
          query.$and.push({description: {$regex: search.searchValue}});
          break;

        case "trackingCode":
          query.$and.push({trackingCode: {$regex: search.searchValue}});
          break;

        default:
          break;
      }
    }
    query = query.$and.length < 1 ? null : query;
    const result = await this.DebtController.find({
      populate,
      query,
      limit,
      page,
    });
    return ResponseHandler.send({
      res,
      httpCode: 200,
      statusCode: StatusCodes.SUCCESS_RESPONSE,
      result,
    });
  }

  /**
   *
   * @param {{
   *  type: string,
   *  body: {
   *    status: string,
   *    reason: string,
   *    receiverId: string,
   *    receiverType: string,
   *    superAgent: string,
   *    driver: string,
   *    student: string,
   *    service: string,
   *    company: string,
   *    city: string
   *  }
   * }} req
   * @param {*} res
   * @returns
   */
  async findAllDebtPriceCompanyToDriver(req, res) {
    let {status, reason, receiverId, receiverType, superAgent, driver, student, service, company, city} = req.body;

    /** @type {any} */
    let query = {$and: []};
    query.$and.push();

    query.$and.push({reason: "COMPANY_DEBT_TO_DRIVER"});
    if (req.type === "DRIVER") {
      query.$and.push({driver: mongoose.Types.ObjectId(String(req.userId))});
    }
    if (req.type === "COMPANY") {
      query.$and.push({company: mongoose.Types.ObjectId(String(req.userId))});
    }
    if (req.type === "SUPER_AGENT_SCHOOL") {
      query.$and.push({superAgent: mongoose.Types.ObjectId(String(req.userId))});
    }

    if (status) query.$and.push({status});
    if (reason) query.$and.push({reason});
    if (receiverId) query.$and.push({receiverId: mongoose.Types.ObjectId(String(receiverId))});
    if (receiverType) query.$and.push({receiverType});
    if (superAgent) query.$and.push({superAgent: mongoose.Types.ObjectId(String(superAgent))});
    if (driver) query.$and.push({driver: mongoose.Types.ObjectId(String(driver))});
    if (student) query.$and.push({student: mongoose.Types.ObjectId(String(student))});
    if (company) query.$and.push({company: mongoose.Types.ObjectId(String(company))});
    if (service) query.$and.push({service: mongoose.Types.ObjectId(String(service))});
    if (city) query.$and.push({city: mongoose.Types.ObjectId(String(city))});

    query = query.$and.length < 1 ? null : query;
    const result = await this.DebtService.findAllDebtPrice({
      query,
    });
    return ResponseHandler.send({
      res,
      httpCode: 200,
      statusCode: StatusCodes.SUCCESS_RESPONSE,
      result,
    });
  }

  /**
   * Pay Debt For Admin
   * pay Admin Too ["Eduction", "Company", "Driver"]
   *
   * @param {{
   *    type: string,
   *    userId: string,
   *    params: {_id: string},
   *    body: {
   *      fishId: string,
   *      paidDate: string,
   *      paymentType: "CARD_BY_CARD" | "POS_MACHINE" | "TRANSFER",
   *    }
   * }} req
   * @param {Object} res
   * @returns {Promise<Object>}
   */
  async payDebtByAdmin(req, res) {
    const {_id} = req.params;
    const requestBody = req.body;

    this.DebtService.errorIfNotAdmin(req.type);
    await this.DebtService.errorIfDebtNotFound(_id);

    const result = await this.DebtService.findAndPayDebt(_id, requestBody);

    return ResponseHandler.send({
      res,
      result: {result},
      httpCode: 200,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
    });
  }

  /**
   * Pay Debt For Admin
   * pay Admin Too ["Admin", "Eduction", "Driver"]
   *
   * @param {{
   *    type: string,
   *    userId: string,
   *    params: {_id: string},
   *    body: {
   *      fishId: string,
   *      paidDate: string,
   *      paymentType: "CARD_BY_CARD" | "POS_MACHINE" | "TRANSFER",
   *    }
   * }} req
   * @param {Object} res
   * @returns {Promise<Object>}
   */
  async payDebtByCompany(req, res) {
    const {_id} = req.params;
    const requestBody = req.body;

    this.DebtService.errorIfNotComapny(req.type);
    await this.DebtService.errorIfDebtNotFound(_id);

    const result = await this.DebtService.findAndPayDebt(_id, requestBody);

    return ResponseHandler.send({
      res,
      result: {result},
      httpCode: 200,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
    });
  }
}
module.exports = new DebtController();
