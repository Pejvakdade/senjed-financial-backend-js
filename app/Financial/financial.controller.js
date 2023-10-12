const FinancialService = require("./financial.service");
const FinancialGroupService = require("../FinancialGroup/financialGroup.service");
const ValidatorService = require("../Handler/Validator.service");
const UtilService = require("../Utils/util.service");
const ResponseHandler = require("../Handler/ResponseHandler");
const factorService = require("../Factor/factor.service");
const ZarinpalService = require("../Zarinpal/zarinpal.service");
const TransactionService = require("../Transaction/transaction.service");
const {StatusCodes, Constant, appRouting} = require("../Values");
const ErrorHandler = require("../Handler/ErrorHandler");
const Api = require("../Api");
const Redis = require("../Redis/redis.service");

const moment = require("moment");

class FinancialController {
  constructor() {
    this.FinancialService = FinancialService;
    this.ValidatorService = ValidatorService;
    this.UtilService = UtilService;
    this.TransactionService = TransactionService;
    this.ZarinpalService = ZarinpalService;
  }

  async priceToPay(req, res) {
    //TODO ROLE CONTROL
    const {serviceId} = req.query;
    const foundedService = await this.FinancialService.findServiceById(serviceId);
    const foundedFinancialGroup = foundedService.financialGroupSchool;
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    };
    let {price, count, factorsList} = await factorService.factorPriceByServiceId(serviceId);
    if (req.type === "DRIVER") price = price - (price / 100) * shares.driver;
    if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: {price, count, factorsList},
    });
  }

  async priceToPayDriver(req, res) {
    //TODO ROLE CONTROL
    const {driverId} = req.query;
    const driverfactores = await factorService.factorByDriverId(driverId);

    let sumOfPrice = 0;
    let sumOfCount = 0;

    for (let key in driverfactores) {
      sumOfPrice += driverfactores[key].price;

      const foundedService = await this.FinancialService.findServiceById(driverfactores[key].serviceId);
      const foundedFinancialGroup = foundedService.financialGroupSchool;
      const shares = {
        tax: foundedFinancialGroup.subscriptionStudent.share.tax,
        admin: foundedFinancialGroup.subscriptionStudent.share.admin,
        driver: foundedFinancialGroup.subscriptionStudent.share.driver,
        company: foundedFinancialGroup.subscriptionStudent.share.company,
        superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      };

      sumOfCount += Number(foundedService?.count);

      if (req.type === "DRIVER") sumOfPrice = sumOfPrice - (sumOfPrice / 100) * shares.driver;
      if (req.type === "COMPANY") sumOfPrice = sumOfPrice - ((sumOfPrice / 100) * shares.company + (sumOfPrice / 100) * shares.driver);
    }

    return ResponseHandler.send({
      res,
      statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
      httpCode: 200,
      result: {price: sumOfPrice, count: sumOfCount, factorsList: driverfactores},
    });
  }

  async payServiceSubscription(req, res) {
    const {serviceId, getway, target} = req.body;
    let {price, count, factorsList} = await factorService.factorPriceByServiceId(serviceId);
    const foundedService = await this.FinancialService.findServiceById(serviceId);
    const foundedFinancialGroup = foundedService.financialGroupSchool;
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    };
    let newFactorsList = [];

    for (const i in factorsList) {
      newFactorsList.push(factorsList[i]._id);
    }

    if (req.type === "DRIVER") price = price - (price / 100) * shares.driver;
    if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);
    const authority = Math.floor(Math.random() * 10000000000);
    const description = `هزینه ${count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`;
    const reason = "SERVICE_SUBSCRIPTION";
    const targetGetway = "REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE";
    let payLink;

    const createdTransaction = await this.TransactionService.createTransaction({
      amount: price,
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

    if (getway === "saderat") {
      const foundedToken = await Api.getTokenSaderat({
        terminalID: Constant.SADERAT_TERMINAL_ID,
        Amount: Number(price) * 10,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/pay-service-continues?reason=${reason}&target=${target}&getway=saderat&transaction=${createdTransaction._id}&authority2=${authority}`,
        invoiceID: authority,
        Payload: description,
      });
      if (foundedToken.Status !== 0) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_SADERAT_TOKEN,
          httpCode: 400,
        });
      }

      await Redis.saveEx(authority, {}, 660);

      payLink = `https://certificateir.ir/api/v1/financial/payment/redirect-saderat?token=${foundedToken.Accesstoken}`;

      // appRouting.REDIRECT_TO_SADERAT_GETWAY({
      //   token: foundedToken.Accesstoken,
      // })
    }

    if (getway === "zarinpal") {
      const foundedToken = await this.ZarinpalService.request({
        amount: Number(price) * 10,
        callback_url: `${process.env.BASE_URL}/api/v1/financial/financial/pay-service-continues?reason=${reason}&target=${targetGetway}&getway=zarinpal&transaction=${createdTransaction._id}&authority2=${authority}`,
        description,
        trackingCode: authority,
      });

      if (!foundedToken) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN,
          httpCode: 400,
        });
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
    const {reason, target, getway, respcode, transaction, authority2, authority, digitalreceipt, Authority, Status} = req.query;
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

        //* PAY OTHER COMMISSION AND ADD SUBSCRIPTION AND SED MESSAGE
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404,
              });
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
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404,
              });
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
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_SADERAT_TOKEN,
          httpCode: 400,
        });
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
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN,
          httpCode: 400,
        });
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
    const {reason, target, getway, respcode, transaction, authority2, authority, digitalreceipt, Authority, Status} = req.query;
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
     *  superAgent: number,
     *  company: number,
     *  driver: number,
     *  admin: number,
     *  tax: number
     * }}
     */
    const shares = {
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    };

    if (factorsList.length <= 0 || price <= 0)
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_FACTOR_NOT_FOUND,
        httpCode: 400,
      });

    if (req.type === "DRIVER") price = price - (price / 100) * shares.driver;
    if (req.type === "COMPANY") price = price - ((price / 100) * shares.company + (price / 100) * shares.driver);

    /** @type {number} */
    const authority = Math.floor(Math.random() * 10000000000);
    const reason = "SERVICE_SUBSCRIPTION_FROM_WALLET";

    if (req.type !== "COMPANY")
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_BALANCE,
        httpCode: 400,
      });

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
   * @returns
   */
  async payDriverSubscription(req, res) {
    const {driverId, getway, target} = req.body;
    const driverfactores = await factorService.factorByDriverId(driverId);
    // const driverServices = await this.FinancialService.findServiceByDriverId(driverId)

    if (driverfactores.length <= 0) {
      throw new ErrorHandler({
        statusCode: StatusCodes.ERROR_SERVICE_NOT_FOUND,
        httpCode: 400,
      });
    }

    let sumOfPrice = 0;
    const reason = "SERVICE_SUBSCRIPTION";
    const targetGetway = "REDIRECT_TO_PAY_SERVICE_SUBSCRIPTION_CONTINUE";
    const authority = Math.floor(Math.random() * 10000000000);
    const description = "pay all"; //todo driver name and all sudent name

    let payLink;

    for (let key in driverfactores) {
      sumOfPrice += driverfactores[key].price;

      const foundedService = await this.FinancialService.findServiceById(driverfactores[key].serviceId);
      const foundedFinancialGroup = foundedService.financialGroupSchool;
      const shares = {
        tax: foundedFinancialGroup.subscriptionStudent.share.tax,
        admin: foundedFinancialGroup.subscriptionStudent.share.admin,
        driver: foundedFinancialGroup.subscriptionStudent.share.driver,
        company: foundedFinancialGroup.subscriptionStudent.share.company,
        superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      };

      if (req.type === "DRIVER") sumOfPrice = sumOfPrice - (sumOfPrice / 100) * shares.driver;
      if (req.type === "COMPANY") sumOfPrice = sumOfPrice - ((sumOfPrice / 100) * shares.company + (sumOfPrice / 100) * shares.driver);
      const description = `هزینه ${foundedService?.count} ماه ماهیانه سرویس مدارس ${foundedService?.parent?.phoneNumber} ${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`;

      await this.TransactionService.createTransaction({
        city: String(foundedService?.city),
        count: foundedService?.count,
        amount: driverfactores[key]?.price,
        parent: foundedService?.parent?._id,
        school: foundedService?.school,
        driver: driverId,
        getway,
        reason,
        target,
        payerId: req.userId,
        student: foundedService?.student?._id,
        company: foundedService?.company._id,
        service: driverfactores[key].serviceId,
        isOnline: true,
        isDeposit: true,
        authority,
        payerType: req.type,
        superAgent: foundedService?.superAgent,
        factorsList: [String(driverfactores[key]._id)],
        isForClient: true,
        description: description,
        secondParent: foundedService?.secondParent,
        transactionStatus: "PENDING",
        schoolFinancialGroup: foundedFinancialGroup._id,
      });
    }

    if (getway === "saderat") {
      const foundedToken = await Api.getTokenSaderat({
        Amount: Number(sumOfPrice) * 10,
        Payload: description,
        invoiceID: authority,
        terminalID: Constant.SADERAT_TERMINAL_ID,
        callbackURL: `${process.env.BASE_URL}/api/v1/financial/financial/pay-driver-continues?reason=${reason}&target=${target}&getway=saderat&authority2=${authority}`,
      });
      if (foundedToken.Status !== 0) {
        throw new ErrorHandler({
          statusCode: StatusCodes.ERROR_SADERAT_TOKEN,
          httpCode: 400,
        });
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
        throw new ErrorHandler({
          httpCode: 400,
          statusCode: StatusCodes.ERROR_ZARINPAL_TOKEN,
        });
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
   *    query: {reason:string, target:string, getway:string, respcode:string, transaction:string, authority2:string, authority:string, digitalreceipt:string, Authority:string, Status: string}
   * }} req
   * @param {any} res
   */
  async payDriverSubscriptionContinues(req, res) {
    const {reason, target, getway, respcode, transaction, authority2, authority, digitalreceipt, Authority, Status} = req.query;
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
          const foundedService = await FinancialService.findServiceById(foundedTransactions.serviceId);
          if (foundedService.hasFactor) {
            await FinancialService.findServiceByIdAndUpdateHasFactor(String(foundedService._id), false);
          }

          await this.FinancialService.chargeWallet({
            id: foundedTransactions[key].payerId,
            amount: foundedTransactions[key].amount,
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
            throw new ErrorHandler({
              statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
              httpCode: 404,
            });
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
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404,
              });
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
              throw new ErrorHandler({
                statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
                httpCode: 404,
              });
          }
        }
      }
    }
  }

  // async transferToMainBalnceForCompany(req, res) {
  //   const { amount } = req.body

  //   const checkAmount = await this.FinancialService.checkProfitWallet({ amount, id: req.userId })
  //   if (!checkAmount)
  //     throw new ErrorHandler({
  //       statusCode: StatusCodes.ERROR_AMOUNT_ENTERED_IS_LESS_THAN_BALANCE,
  //       httpCode: 400,
  //     })

  //   const result = await this.FinancialService.transferToMainBalnceForCompany({ amount, id: req.userId })

  //   await this.TransactionService.createTransaction({
  //     amount,
  //     transactionStatus: "SUCCESS",
  //     payerId: req.userId,
  //     payerType: req.type,
  //     company: req.userId,
  //     superAgent: result.companyInformation?.superAgent,
  //     province: result.companyInformation?.province,
  //     city: result.companyInformation?.city,
  //     reason: "TRANSFER_PROFIT",
  //     isForClient: true,
  //     description: "انتقال از حساب سود به حساب اصلی",
  //     isOnline: false,
  //     isDeposit: true,
  //   })

  //   return ResponseHandler.send({
  //     res,
  //     statusCode: StatusCodes.RESPONSE_SUCCESSFUL,
  //     httpCode: 200,
  //     result,
  //   })
  // }
}

module.exports = new FinancialController();
