const Api = require("../Api");
const Redis = require("../Redis/redis.service");
const UserModel = require("../models/user.model")
const factorService = require("../Factor/factor.service");
const ZarinpalService = require("../Zarinpal/zarinpal.service");
const ResponseHandler = require("../Handler/ResponseHandler");
const FinancialService = require("./financial.service");
const TransactionService = require("../Transaction/transaction.service");

const {StatusCodes, Constant, appRouting} = require("../Values");


const moment = require("moment");

class FinancialController {
  constructor() {
    this.UserModel = UserModel;
    this.ZarinpalService = ZarinpalService;
    this.FinancialService = FinancialService;
    this.TransactionService = TransactionService;
  }

  /**
   * - function for calculate Price use Service._id
   *    - COMPANY - Panel
   *    - DRIVER  - Application.Driver
   *    - PARENT  - Application.Parent
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async priceToPay(req, res) {
    const {serviceId} = req.query;
    const foundedService = await this.FinancialService.findServiceById(serviceId);
    const foundedFinancialGroup = foundedService.financialGroupSchool;
    const foundedDriver = await this.UserModel.findById(foundedService.driver)
    const DriverDeposit = foundedDriver?.schoolDriverInformation?.deposit ? foundedDriver?.schoolDriverInformation?.deposit : 0;

    /**
     * @type {{
     *    municipality: {default: number, type: Number | NumberConstructor},
     *    superAgent: {default: number, type: Number | NumberConstructor},
     *    company: {default: number, type: Number | NumberConstructor},
     *    driver: {default: number, type: Number | NumberConstructor},
     *    admin: {default: number, type: Number | NumberConstructor},
     *    tax: {default: number, type: Number | NumberConstructor}
     *  }}
     */
    const shares = foundedFinancialGroup.subscriptionStudent.share;
    let {price, count, factorsList} = await factorService.factorPriceByServiceId(serviceId);

    /** @type {number} */
    const calculatePresent = (price / 100)
    if (req.type === "DRIVER") price = price - calculatePresent * shares.driver;
    if (req.type === "COMPANY") price = price - (calculatePresent * shares.company + calculatePresent * shares.driver);

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: {price, count, factorsList, DriverDeposit},
    });
  }

  /**
   * - function for calculate Price use Driver._id
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async priceToPayDriver(req, res) {
    const {driverId} = req.query;
    const driverFactors = await factorService.factorByDriverId(driverId);
    const foundedDriver = await this.UserModel.findById(driverId)
    const DriverDeposit = foundedDriver?.schoolDriverInformation?.deposit ? foundedDriver?.schoolDriverInformation?.deposit : 0;

    let sumOfPrice = 0;
    let sumOfCount = 0;

    for (let key in driverFactors) {
      const foundedService = await this.FinancialService.findServiceById(driverFactors[key].serviceId);
      const foundedFinancialGroup = foundedService.financialGroupSchool;
      /**
       * @type {{
       *    superAgent: {default: number, type: Number | NumberConstructor},
       *    company: {default: number, type: Number | NumberConstructor}
       *    driver: {default: number, type: Number | NumberConstructor},
       *    admin: {default: number, type: Number | NumberConstructor},
       *    tax: {default: number, type: Number | NumberConstructor},
       *  }}
       */
      const shares = foundedFinancialGroup.subscriptionStudent.share;

      sumOfCount += Number(foundedService?.count);
      const price = foundedService?.price;

      if (req.type === "DRIVER") sumOfPrice += price - (price / 100) * shares.driver;
      if (req.type === "COMPANY") sumOfPrice += price - ((price / 100) * shares.company + (price / 100) * shares.driver);
    }

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: {price: sumOfPrice, count: sumOfCount, factorsList: driverFactors, DriverDeposit},
    });
  }

  /**
   * @param {{
   *   body: {
   *     serviceId: string,
   *     getway: string,
   *     target: string,
   *   },
   *   type: string,
   * }} req
   * @param {any} res
   * @returns {Promise<any|void>}
   */
  async payServiceSubscription(req, res) {
    const {serviceId, getway, target} = req.body;

    let {price, count, factorsList} = await factorService.factorPriceByServiceId(serviceId);
    let transactionPrice = Number(price);
z
    const foundedService = await this.FinancialService.findServiceById(serviceId);
    const foundedFinancialGroup = foundedService.financialGroupSchool;
    const foundedDriver = await this.UserModel.findById(foundedService.driver)
    let driverDeposit = foundedDriver?.schoolDriverInformation?.deposit ? foundedDriver?.schoolDriverInformation?.deposit : 0;

    /**
     * @type {{
     *    superAgent: {default: number, type: Number | NumberConstructor},
     *    company: {default: number, type: Number | NumberConstructor},
     *    driver: {default: number, type: Number | NumberConstructor},
     *    admin: {default: number, type: Number | NumberConstructor},
     *    tax: {default: number, type: Number | NumberConstructor}
     *  }}
     */
    const shares = foundedFinancialGroup.subscriptionStudent.share;
    let newFactorsList = [];

    for (const i in factorsList) {
      newFactorsList.push(factorsList[i]._id);
    }

    if (req.type === "DRIVER") {
      transactionPrice = Number(price);
      price = price - (price / 100) * shares.driver;

    }
    if (req.type === "COMPANY") {
      transactionPrice = Number(price);
      price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);
    }

    if (driverDeposit > 0) {
      let calculator = price - driverDeposit
      if (calculator < 0) calculator = 0;
      price = calculator;
    }

    const authority = Math.floor(Math.random() * 10000000000);
    const description = `هزینه ${count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`;
    const reason = "SERVICE_SUBSCRIPTION";
    const targetGetway = "REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE";
    let payLink;

    const createdTransaction = await this.TransactionService.createTransaction({
      amount: transactionPrice,
      transactionStatus: "PENDING",
      payerId: req.userId,
      payerType: req.type,
      parent: foundedService?.parent?._id,
      secondParent: foundedService?.secondParent,
      school: foundedService?.school,
      driver: foundedService?.driver,
      student: foundedService?.student?._id,
      company: foundedService?.company._id,
      superAgent: foundedService?.superAgent,
      schoolFinancialGroup: foundedFinancialGroup._id,
      service: serviceId,
      reason,
      target,
      count,
      factorsList: newFactorsList,
      isForClient: true,
      authority,
      description: `هزینه ${count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName} `,
      getway,
      city: String(foundedService?.city),
      isOnline: true,
      isDeposit: true,
    });

    await this.FinancialService.updateDepositForDriver(foundedService.driver, driverDeposit);

    if (getway === "saderat") {
      const foundedToken = await Api.getTokenSaderat({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(price) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/pay-service-continues?reason=${reason}&target=${target}&getway=saderat&transaction=${createdTransaction._id}&authority2=${authority}`,
        invoiceID: authority,
        Payload: description,
      });
      if (foundedToken.Status !== 0) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_SADERAT_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://certificateir.ir/api/v1/financial/payment/redirect-saderat?token=${foundedToken.Accesstoken}`;

    }

    if (getway === "zarinpal") {
      const foundedToken = await this.ZarinpalService.request({
        amount: Number(price) * 10,
        callback_url: `${process.env.BASE_URL}/api/v1/financial/financial/pay-service-continues?reason=${reason}&target=${targetGetway}&getway=zarinpal&transaction=${createdTransaction._id}&authority2=${authority}`,
        description,
        trackingCode: authority,
      });

      if (!foundedToken) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://www.zarinpal.com/pg/StartPay/${foundedToken}`;
    }

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: {payLink},
    });
  }

  async payServiceSubscriptionContinues(req, res) {
    const {
      reason,
      target,
      getway,
      respcode,
      transaction,
      authority2,
      authority,
      digitalreceipt,
      Authority,
      Status
    } = req.query;
    let foundedTransaction;
    let status;

    //* ================== check frist time to call =====================
    if (await Redis.get(authority2)) {
      await Redis.del(authority2);
      foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2);

      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        });
        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS";
        else status = "FAILED";
      } else if (getway === "zarinpal") {
        if (Status === "OK") status = "SUCCESS";
        else status = "FAILED";
      }

      if (status === "SUCCESS") {
        await FinancialService.updateHasFactorFlag({id: foundedTransaction.service, hasFactor: false});
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        });

        await this.FinancialService.chargeWallet({
          id: foundedTransaction.payerId,
          amount: foundedTransaction.amount,
        });

        // TODO :: PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
        await this.FinancialService.paySubscriptionSuccess({foundedTransaction});

        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                serviceId: foundedTransaction.service,
                payerId: foundedTransaction.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                authority: authority2,
              })
            );
            break;

          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      } else {
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        });
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                serviceId: foundedTransaction.service,
                payerId: foundedTransaction.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                authority: authority2,
              })
            );
            break;

          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      }
    } else {
      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2);
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        });
        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS";
        else status = "FAILED";
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        });
        if (status === "SUCCESS") {
          switch (foundedTransaction.target) {
            case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority: authority2,
                })
              );
              break;
            case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                  authority: authority2,
                })
              );
              break;

            case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                  authority: authority2,
                })
              );
              break;

            default:
              return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
          }
        } else {
          switch (foundedTransaction.target) {
            case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                  serviceId: foundedTransaction.service,
                  payerId: foundedTransaction.payerId,
                  amount: foundedTransaction.amount,
                  target: foundedTransaction.target,
                  authority: authority2,
                })
              );
              break;
            case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                  authority: authority2,
                })
              );
              break;

            case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                  authority: authority2,
                })
              );
              break;

            default:
              return res.status(403).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
          }
        }
      }
    }
  }

  async deposit(req, res) {
    const {amount, getway, target} = req.body;
    const authority = Math.floor(Math.random() * 10000000000);
    const reason = "DEPOSIT";
    const targetGetway = "REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE";
    let payLink;
    const foundedUser = await this.FinancialService.findUserById(req.userId);
    const description = `شارژ حساب 0${req.phoneNumber} ${foundedUser?.firstName} ${foundedUser?.lastName}`;
    let parent, driver, company, superAgent, province, city;
    switch (req.type) {
      case "PARENT":
        parent = req.userId;
        province = foundedUser?.parentInformation?.province;
        city = foundedUser?.parentInformation?.city;
        break;

      case "DRIVER":
        driver = req?.userId;
        company = foundedUser?.schoolDriverInformation?.company;
        superAgent = foundedUser?.schoolDriverInformation?.superAgent;
        province = foundedUser?.schoolDriverInformation?.province;
        city = foundedUser?.schoolDriverInformation?.city;
        break;

      case "COMPANY":
        company = req?.userId;
        superAgent = foundedUser?.companyInformation?.superAgent;
        province = foundedUser?.companyInformation?.province;
        city = foundedUser?.companyInformation?.city;
        break;

      case "SUPER_AGENT_SCHOOL":
        superAgent = req?.userId;
        province = foundedUser?.superAgentSchoolInformation?.province;
        city = foundedUser?.superAgentSchoolInformation?.city;
        break;
    }

    const createdTransaction = await this.TransactionService.createTransaction({
      amount,
      transactionStatus: "PENDING",
      payerId: req.userId,
      payerType: req.type,
      parent,
      driver,
      company,
      superAgent,
      province,
      city,
      reason,
      target,
      isForClient: true,
      authority,
      description,
      getway,
      isOnline: true,
      isDeposit: true,
    });

    if (getway === "saderat") {
      const foundedToken = await Api.getTokenSaderat({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(amount) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/deposit-continues?reason=${reason}&target=${targetGetway}&getway=saderat&transaction=${createdTransaction._id}&authority2=${authority}`,
        invoiceID: authority,
        Payload: description,
      });
      if (foundedToken.Status !== 0) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_SADERAT_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://certificateir.ir/api/v1/financial/payment/redirect-saderat?token=${foundedToken.Accesstoken}`;
    }

    if (getway === "zarinpal") {
      const foundedToken = await this.ZarinpalService.request({
        amount: Number(amount) * 10,
        callback_url: `${process.env.BASE_URL}/api/v1/financial/financial/deposit-continues?reason=${reason}&target=${targetGetway}&getway=zarinpal&transaction=${createdTransaction._id}&authority2=${authority}`,
        description,
        trackingCode: authority,
      });

      if (!foundedToken) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://www.zarinpal.com/pg/StartPay/${foundedToken}`;
    }

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: {payLink},
    });
  }

  async depositContinues(req, res) {
    const {
      reason,
      target,
      getway,
      respcode,
      transaction,
      authority2,
      authority,
      digitalreceipt,
      Authority,
      Status
    } = req.query;
    let foundedTransaction;
    let status;

    //* ================== check frist time to call =====================
    if (await Redis.get(authority2)) {
      await Redis.del(authority2);
      foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2);

      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        });
        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS";
        else status = "FAILED";
      } else if (getway === "zarinpal") {
        if (Status === "OK") status = "SUCCESS";
        else status = "FAILED";
      }

      if (status === "SUCCESS") {
        await this.TransactionService.updateTransaction({
          authority: authority2,
          status,
        });
        await Api.accountantChargeWalletById({
          id: foundedTransaction.payerId,
          amount: foundedTransaction.amount,
          Authority: authority2,
        });

        //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                serviceId: foundedTransaction?.service,
                payerId: foundedTransaction?.payerId,
                amount: foundedTransaction?.amount,
                target: foundedTransaction?.target,
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                authority: authority2,
              })
            );
            break;

          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      } else {
        await this.TransactionService.updateTransaction({
          authority: authority2,
          reason,
          status,
        });
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                serviceId: foundedTransaction?.service,
                payerId: foundedTransaction?.payerId,
                amount: foundedTransaction?.amount,
                target: foundedTransaction?.target,
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                authority: authority2,
              })
            );
            break;

          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      }
    } else {
      foundedTransaction = await this.TransactionService.findTransactionByAuthority(authority2);

      if (status === "SUCCESS") {
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                serviceId: foundedTransaction?.service,
                payerId: foundedTransaction?.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            );
            break;
          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                authority: authority2,
              })
            );
            break;

          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      } else {
        switch (foundedTransaction.target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                serviceId: foundedTransaction.service,
                payerId: foundedTransaction.payerId,
                amount: foundedTransaction.amount,
                target: foundedTransaction.target,
                authority: authority2,
              })
            );
            break;
          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                authority: authority2,
              })
            );
            break;

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                authority: authority2,
              })
            );
            break;

          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      }
    }
  }

  /**
   * Company pay service for Driver OR Parent Offline
   *
   * @param {{
   *  type: string,
   *  userId: string,
   *  body: {
   *     serviceId: string, payerType: string, fishId: string, offlinePayType: string
   *  }
   * }} req
   * @param {any} res
   * @returns {Promise<any>}
   */
  async payServiceSubscriptionFromWalletForCompany(req, res) {
    const {serviceId, payerType, fishId, offlinePayType} = req.body;

    const foundedService = await this.FinancialService.findServiceById(serviceId);
    const foundedFinancialGroup = foundedService.financialGroupSchool;

    let {price, count, factorsList} = await factorService.factorPriceByServiceId(serviceId);

    /**
     * @type {{
     *    superAgent: {default: number, type: Number | NumberConstructor},
     *    company: {default: number, type: Number | NumberConstructor},
     *    driver: {default: number, type: Number | NumberConstructor},
     *    admin: {default: number, type: Number | NumberConstructor},
     *    tax: {default: number, type: Number | NumberConstructor}
     *  }}
     */
    const shares = foundedFinancialGroup.subscriptionStudent.share;

    if (factorsList.length <= 0 || price <= 0)
      return res.status(400).json({statusCode: StatusCodes.ERROR_FACTOR_NOT_FOUND});

    if (req.type === "DRIVER") price = price - (price / 100) * shares.driver;
    if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);

    /** @type {number} */
    const authority = Math.floor(Math.random() * 10000000000);
    const reason = "SERVICE_SUBSCRIPTION_FROM_WALLET";

    if (req.type !== "COMPANY")
      return res.status(400).json({statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_BALANCE});

    let newFactorsList = [];

    for (const i in factorsList) {
      newFactorsList.push(factorsList[i]._id);
    }

    const description = `هزینه ${count} ماه ماهیانه سرویس مدارس از موجودی 0${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName} `;

    const createdTransaction = await this.TransactionService.createTransaction({
      city: String(foundedService?.city),
      count,
      fishId,
      reason,
      amount: price,
      parent: foundedService?.parent?._id,
      school: foundedService?.school,
      driver: foundedService?.driver,
      student: foundedService?.student?._id,
      company: foundedService?.company._id,
      payerId: req.userId,
      service: serviceId,
      isOnline: false,
      authority,
      isDeposit: true,
      payerType: req.type,
      superAgent: foundedService?.superAgent,
      description,
      factorsList: newFactorsList,
      isForClient: true,
      secondParent: foundedService?.secondParent,
      offlinePayType,
      payerOriginType: payerType,
      transactionStatus: "SUCCESS",
      schoolFinancialGroup: foundedFinancialGroup._id,
    });

    await FinancialService.updateHasFactorFlag({id: serviceId, hasFactor: false});

    //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
    await this.FinancialService.paySubscriptionSuccess({foundedTransaction: createdTransaction});
    return ResponseHandler.send({
      res,
      result: createdTransaction,
      httpCode: 200,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
    });
  }

  /**
   * Company pay service for Driver OR Parent Offline
   *
   * @param {{
   *  type: string,
   *  userId: string,
   *  body: {
   *     factorList: Array<string>, fishId: string, offlinePayType: string
   *  }
   * }} req
   * @param {any} res
   * @returns {Promise<any>}
   */
  async payFactorsByIdOffline(req, res) {
    if (req.type !== "COMPANY") {
      return res.status(403).json({statusCode: StatusCodes.AUTH_FAILED});
    }

    const {factorList, fishId, payerType, offlinePayType} = req.body;

    if (factorList.length <= 0) {
      return res.status(400).json({statusCode: StatusCodes.ERROR_FACTOR_NOT_FOUND});
    }

    let newFactorsList = [];
    let createdTransaction = [];

    for (let i in factorList) {
      newFactorsList.push(factorList[i]);
      const foundedFactor = await factorService.findById(factorList[i]);
      const foundedService = await this.FinancialService.findServiceById(foundedFactor.serviceId);
      const foundedFinancialGroup = foundedService.financialGroupSchool;
      /**
       * @type {{
       *    superAgent: {default: number, type: Number | NumberConstructor},
       *    company: {default: number, type: Number | NumberConstructor},
       *    driver: {default: number, type: Number | NumberConstructor},
       *    admin: {default: number, type: Number | NumberConstructor},
       *    tax: {default: number, type: Number | NumberConstructor}
       *  }}
       */
      const shares = foundedFinancialGroup.subscriptionStudent.share;

      let {price, count, factorsList} = await factorService.factorPriceByServiceId(foundedFactor.serviceId);

      price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);

      /** @type {number} */
      const authority = Math.floor(Math.random() * 10000000000);
      const reason = "SERVICE_SUBSCRIPTION_FROM_WALLET";

      const description = `هزینه ${count} ماه ماهیانه سرویس مدارس از موجودی 0${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName} `;

      const transaction = await this.TransactionService.createTransaction({
        city: String(foundedService?.city),
        count,
        fishId,
        reason,
        amount: price,
        parent: foundedService?.parent?._id,
        school: foundedService?.school,
        driver: foundedService?.driver,
        student: foundedService?.student?._id,
        company: foundedService?.company._id,
        payerId: req.userId,
        service: foundedFactor.serviceId,
        isOnline: false,
        authority,
        isDeposit: true,
        payerType: "COMPANY",
        superAgent: foundedService?.superAgent,
        description,
        factorsList: newFactorsList,
        isForClient: true,
        secondParent: foundedService?.secondParent,
        offlinePayType,
        payerOriginType: payerType,
        transactionStatus: "SUCCESS",
        schoolFinancialGroup: foundedFinancialGroup._id,
      });

      createdTransaction.push(transaction);

      if (factorsList?.length <= 0) {
        await FinancialService.updateHasFactorFlag({id: foundedFactor.serviceId, hasFactor: false});
      }

      await this.FinancialService.findServiceAndUpdateExpaire(foundedFactor.serviceId, foundedService.expire, newFactorsList, foundedService.cycle);

      await this.FinancialService.paySubscriptionSuccess({foundedTransaction: transaction});
    }

    //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
    return ResponseHandler.send({
      res,
      result: createdTransaction,
      httpCode: 200,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
    });
  }

  /**
   *
   * @param {{
   *  type: "DRIVER" | "COMPANY",
   *  userId: string,
   *  body: {
   *    driverId: string,
   *    getway: string,
   *    target: string
   *  }
   * }} req
   *
   * @param {any} res
   *
   * @returns {Promise<any>}
   */
  async payDriverSubscription(req, res) {
    const {driverId, getway, target} = req.body;
    const driverFactors = await factorService.factorByDriverId(driverId);

    if (driverFactors.length <= 0) {
      return res.status(400).json({statusCode: StatusCodes.ERROR_SERVICE_NOT_FOUND});
    }

    let sumOfPrice = 0;
    const reason = "SERVICE_SUBSCRIPTION";
    const targetGetway = "REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE";
    const authority = Math.floor(Math.random() * 10000000000);
    const description = "pay all"; //todo driver name and all sudent name

    let payLink;

    for (let key in driverFactors) {
      let price = driverFactors[key].price;

      const foundedService = await this.FinancialService.findServiceById(driverFactors[key].serviceId);
      const foundedFinancialGroup = foundedService.financialGroupSchool;
      const foundedDriver = await this.UserModel.findById(driverId)
      let driverDeposit = foundedDriver?.schoolDriverInformation?.deposit ? foundedDriver?.schoolDriverInformation?.deposit : 0;

      /**
       * @type {{
       *  superAgent: number,
       *  company: number,
       *  driver: number,
       *  admin: number,
       *  tax: number
       * }}
       */
      const shares = foundedFinancialGroup.subscriptionStudent.share;

      if (req.type === "DRIVER") price = price - (price / 100) * shares.driver;
      if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);
      sumOfPrice += price;
      const description = `هزینه ${foundedService?.count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`;

      if (driverDeposit > 0) {
        let calculator = price - driverDeposit
        if (calculator < 0) calculator = 0;
        driverDeposit = driverDeposit - price;
        sumOfPrice += calculator;
      } else {
        sumOfPrice += price;
      }

      await this.TransactionService.createTransaction({
        city: String(foundedService?.city),
        count: foundedService?.count,
        amount: price,
        parent: foundedService?.parent?._id,
        school: foundedService?.school,
        driver: driverId,
        getway,
        reason,
        target,
        payerId: req.userId,
        student: foundedService?.student?._id,
        company: foundedService?.company._id,
        service: driverFactors[key].serviceId,
        isOnline: true,
        isDeposit: true,
        authority,
        payerType: req.type,
        superAgent: foundedService?.superAgent,
        factorsList: [String(driverFactors[key]._id)],
        isForClient: true,
        description: description,
        secondParent: foundedService?.secondParent,
        transactionStatus: "PENDING",
        schoolFinancialGroup: foundedFinancialGroup._id,
      });
    }

    await this.FinancialService.updateDepositForDriver(driverId, driverDeposit)

    if (getway === "saderat") {
      const foundedToken = await Api.getTokenSaderat({
        Amount: Number(sumOfPrice) * 10,
        Payload: description,
        invoiceID: authority,
        terminalID: Constant.SADERAT_TERMINAL_ID,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/pay-driver-continues?reason=${reason}&target=${target}&getway=saderat&authority2=${authority}`,
      });
      if (foundedToken.Status !== 0) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_SADERAT_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://certificateir.ir/api/v1/financial/payment/redirect-saderat?token=${foundedToken.Accesstoken}`;

      // appRouting.REDIRECT_TO_SADERAT_GETWAY({
      //   token: foundedToken.Accesstoken,
      // })
    }

    if (getway === "zarinpal") {
      const foundedToken = await this.ZarinpalService.request({
        amount: Number(sumOfPrice) * 10,
        description,
        trackingCode: authority,
        callback_url: `${process.env.BASE_URL}/api/v1/financial/financial/pay-driver-continues?reason=${reason}&target=${targetGetway}&getway=zarinpal&authority2=${authority}`,
      });

      if (!foundedToken) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://www.zarinpal.com/pg/StartPay/${foundedToken}`;
    }

    return ResponseHandler.send({
      res,
      result: {payLink},
      httpCode: 200,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
    });
  }

  /**
   *
   * @param {{
   *  type: "DRIVER" | "COMPANY",
   *  userId: string,
   *  body: {
   *    driverFactores: Array<string>
   *    driverId: string,
   *    getway: string,
   *    target: string
   *  }
   * }} req
   *
   * @param {any} res
   *
   * @returns {Promise<any>}
   */
  async payDriverSubscriptionByFactorIds(req, res) {
    const {driverId, getway, target, driverFactores} = req.body;

    if (driverFactores.length <= 0) {
      return res.status(400).json({statusCode: StatusCodes.ERROR_SERVICE_NOT_FOUND});
    }

    let sumOfPrice = 0;
    const reason = "SERVICE_SUBSCRIPTION";
    const authority = Math.floor(Math.random() * 10000000000);
    const description = "pay factor";
    const foundedDriver = await this.UserModel.findById(driverId)
    let driverDeposit = foundedDriver?.schoolDriverInformation?.deposit ? foundedDriver?.schoolDriverInformation?.deposit : 0;

    let payLink;

    for (let key in driverFactores) {
      const foundedFactor = await factorService.findById(driverFactores[key]);

      if (!foundedFactor || foundedFactor.status === "PAID") {
        return res.status(400).json({statusCode: StatusCodes.ERROR_FACTOR_NOT_FOUND});
      }

      let price = foundedFactor.price;

      const foundedService = await this.FinancialService.findServiceById(foundedFactor.serviceId);

      const foundedFinancialGroup = foundedService.financialGroupSchool;

      /**
       * @type {{
       *  superAgent: number,
       *  company: number,
       *  driver: number,
       *  admin: number,
       *  tax: number
       * }}
       */
      const shares = foundedFinancialGroup.subscriptionStudent.share;

      if (req.type === "DRIVER") price = price - (price / 100) * shares.driver;
      if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);

      if (driverDeposit > 0) {
        let calculator = price - driverDeposit
        if (calculator < 0) calculator = 0;
        driverDeposit = driverDeposit - price;
        sumOfPrice += calculator;
      } else {
        sumOfPrice += price;
      }

      const description = `هزینه ${foundedService?.count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`;

      await this.TransactionService.createTransaction({
        city: String(foundedService?.city),
        count: foundedService?.count,
        amount: price,
        parent: foundedService?.parent?._id,
        school: foundedService?.school,
        driver: driverId,
        getway,
        reason,
        target,
        payerId: req.userId,
        student: foundedService?.student?._id,
        company: foundedService?.company._id,
        service: foundedFactor.serviceId,
        isOnline: true,
        isDeposit: true,
        authority,
        payerType: req.type,
        superAgent: foundedService?.superAgent,
        factorsList: [String(foundedFactor._id)],
        isForClient: true,
        description: description,
        secondParent: foundedService?.secondParent,
        transactionStatus: "PENDING",
        schoolFinancialGroup: foundedFinancialGroup._id,
      });
    }

    await this.FinancialService.updateDepositForDriver(driverId, driverDeposit);

    if (getway === "saderat") {
      const foundedToken = await Api.getTokenSaderat({
        Amount: Number(sumOfPrice) * 10,
        Payload: description,
        invoiceID: authority,
        terminalID: Constant.SADERAT_TERMINAL_ID,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/pay-driver-continues?reason=${reason}&target=${target}&getway=saderat&authority2=${authority}`,
      });
      if (foundedToken.Status !== 0) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_SADERAT_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://certificateir.ir/api/v1/financial/payment/redirect-saderat?token=${foundedToken.Accesstoken}`;
    }

    if (getway === "zarinpal") {
      const foundedToken = await this.ZarinpalService.request({
        amount: Number(sumOfPrice) * 10,
        description,
        trackingCode: authority,
        callback_url: `${process.env.BASE_URL}/api/v1/financial/financial/pay-driver-continues?reason=${reason}&target=${target}&getway=zarinpal&authority2=${authority}`,
      });

      if (!foundedToken) {
        return res.status(400).json({statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN});
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://www.zarinpal.com/pg/StartPay/${foundedToken}`;
    }

    return ResponseHandler.send({
      res,
      result: {payLink},
      httpCode: 200,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
    });
  }

  /**
   * @param {{
   *    query: {
   *      reason:string,
   *      target:string,
   *      getway:string,
   *      Status: string,
   *      respcode:string,
   *      authority:string,
   *      Authority:string,
   *      authority2:string,
   *      transaction:string,
   *      digitalreceipt:string,
   *    }
   * }} req
   * @param {any} res
   */
  async payDriverSubscriptionContinues(req, res) {
    const {
      reason,
      target,
      getway,
      respcode,
      transaction,
      authority2,
      authority,
      digitalreceipt,
      Authority,
      Status
    } = req.query;
    let foundedTransactions;
    let status;

    //* ================== check frist time to call =====================
    if (await Redis.get(authority2)) {
      await Redis.del(authority2);
      foundedTransactions = await this.TransactionService.findManyTransactionByAuthority(authority2);

      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        });

        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS";
        else status = "FAILED";
      } else if (getway === "zarinpal") {
        if (Status === "OK") status = "SUCCESS";
        else status = "FAILED";
      }

      if (status === "SUCCESS") {
        await this.TransactionService.updateManyTransaction({
          authority: authority2,
          reason,
          status,
        });

        for (let key in foundedTransactions) {
          const foundedService = await FinancialService.findServiceById(foundedTransactions[key].service);
          if (foundedService.hasFactor) {
            await FinancialService.findServiceByIdAndUpdateHasFactor(String(foundedService._id), false);
          }

          console.log({
            _id: foundedService._id,
            expire: foundedService.expire,
            factorsList: foundedTransactions[key].factorsList,
            cycle: foundedService.cycle,
          });

          // API Service Update expire Date()
          await this.FinancialService.findServiceAndUpdateExpaire(
            foundedService._id,
            foundedService.expire,
            foundedTransactions[key].factorsList,
            foundedService.cycle
          );

          await this.FinancialService.chargeWallet({
            id: foundedTransactions[key].payerId,
            amount: foundedTransactions[key].amount,
          });

          await factorService.changeFactorStatus({
            factorsList: foundedTransactions[key].factorsList,
            paidBy: foundedTransactions[key].payerId,
            paidDate: new Date(),
          });

          await this.FinancialService.paySubscriptionSuccess({foundedTransaction: foundedTransactions[key]});
        }

        //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
        switch (foundedTransactions[0].target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                authority: authority2,
                serviceId: foundedTransactions[0].service,
                payerId: foundedTransactions[0].payerId,
                amount: foundedTransactions[0].amount,
                target: foundedTransactions[0].target,
              })
            );

          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                authority: authority2,
              })
            );

          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                authority: authority2,
              })
            );

          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      } else {
        await this.TransactionService.updateManyTransaction({
          authority: authority2,
          reason,
          status,
        });
        switch (foundedTransactions[0].target) {
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
            return res.redirect(
              appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                authority: authority2,
                serviceId: foundedTransactions[0].service,
                payerId: foundedTransactions[0].payerId,
                amount: foundedTransactions[0].amount,
                target: foundedTransactions[0].target,
              })
            );
          case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                authority: authority2,
              })
            );
          case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
            return res.redirect(
              appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                authority: authority2,
              })
            );
          default:
            return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
        }
      }
    } else {
      //* ================== saderat getway ===============================
      if (getway === "saderat") {
        foundedTransactions = await this.TransactionService.findManyTransactionByAuthority(authority2);
        const adviceSaderat = await Api.postSaderatAdvice({
          digitalreceipt,
          Tid: Constant.SADERAT_TERMINAL_ID,
        });
        if (adviceSaderat.Status === "Duplicate" || adviceSaderat.Status === "Ok") status = "SUCCESS";
        else status = "FAILED";
        await this.TransactionService.updateManyTransaction({
          authority: authority2,
          reason,
          status,
        });
        if (status === "SUCCESS") {
          switch (foundedTransactions[0].target) {
            case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
                  authority: authority2,
                  serviceId: foundedTransactions[0].service,
                  payerId: foundedTransactions[0].payerId,
                  amount: foundedTransactions[0].amount,
                  target: foundedTransactions[0].target,
                })
              );

            case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS({
                  authority: authority2,
                })
              );

            case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS({
                  authority: authority2,
                })
              );

            default:
              return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
          }
        } else {
          switch (foundedTransactions[0].target) {
            case "REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD":
              return res.redirect(
                appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
                  authority: authority2,
                  serviceId: foundedTransactions[0].service,
                  payerId: foundedTransactions[0].payerId,
                  amount: foundedTransactions[0].amount,
                  target: foundedTransactions[0].target,
                })
              );

            case "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED({
                  authority: authority2,
                })
              );

            case "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER":
              return res.redirect(
                appRouting.REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED({
                  authority: authority2,
                })
              );

            default:
              return res.status(404).json({statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND});
          }
        }
      }
    }
  }
}

module.exports = new FinancialController();
