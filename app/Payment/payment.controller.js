const PaymentService = require('./payment.service')
const ValidatorService = require('../Handler/Validator.service')
const UtilService = require('../Utils/util.service')
const FinancialService = require('../Financial/financial.service')
const Constant = require('../Values/constants')
const TransactionService = require('../Transaction/transaction.service')
const StatusCodes = require('../Values/StatusCodes')
const ErrorHandler = require('../Handler/ErrorHandler')
const ResponseHandler = require('../Handler/ResponseHandler')
// const Redis = require("../Redis/redis.service")
const Api = require('../Api')
const { appRouting } = require('../Values')

const fs = require('fs')
const { stringify } = require('querystring')
class PaymentController {
  constructor (paymentService, validatorService, utilService, financialService, transactionService) {
    this.utilService = utilService
    this.financialService = financialService
    this.paymentService = paymentService
    this.validatorService = validatorService
    this.transactionService = transactionService
  }

  async getRedirectSaderat (req, res) {
    res.sendFile(__dirname + '/redirectSaderat.html')
  }

  // async deposit(req, res) {
  //   let { getway, userId, amount, description, reason, target, payerType } = req.query
  //   console.log({ getway, userId, amount, description, reason, target, payerType })
  //   const foundedUser = await Api.getDriverById(userId)

  //   const toEnDigit = (n) => n.replace(/[٠-٩۰-۹]/g, (n) => 15 & n.charCodeAt(0))
  //   amount = parseInt(toEnDigit(String(amount)))
  //   // await this.validatorService.zarinpalDepositInputValidation(req.query)
  //   await this.paymentService.zarinpalDeposit(
  //     {
  //       amount,
  //       userId,
  //       description,
  //       reason,
  //       target,
  //       payerType,
  //       isForClient: true,
  //       description: `افزایش موجودی ${payerType} ${foundedUser.phoneNumber} ${foundedUser.firstName} ${foundedUser.lastName}`,
  //       getway,
  //     },
  //     res
  //   )
  // }

  // async verifyZarinpalGateway(req, res) {
  //   let { Status, Authority, reason, getway, invoiceid, digitalreceipt } = req.query
  //   let foundedTransaction
  //   let status
  //   Authority = Authority || invoiceid

  //   if (await Redis.get(Authority)) {
  //     await Redis.del(Authority)
  //     foundedTransaction = await this.transactionService.findTransactionByAuthority(Authority)
  //     if (getway === "saderat") {
  //       const res = await Api.postSaderatAdvice({
  //         digitalreceipt,
  //         Tid: Constant.SADERAT_TERMINAL_ID,
  //       })
  //       if (res.Status === "Duplicate" || res.Status === "Ok") {
  //         status = "SUCCESS"
  //         Status = "OK"
  //       } else {
  //         status = "FAILED"
  //         Status = "NOK"
  //       }
  //     }
  //     if (Status === "OK") {
  //       await Api.accountantChargeWalletById({
  //         id: foundedTransaction.receiverId,
  //         amount: foundedTransaction.amount,
  //         Authority,
  //       })
  //     }
  //     await this.transactionService.updateTransaction({
  //       Authority,
  //       reason,
  //       status,
  //     })

  //     if (Status === "OK") {
  //       //* success callBack controll  :
  //       switch (foundedTransaction.target) {
  //         case "REDIRECT_TO_PASSENGER_APP_PROFILE":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_PROFILE({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_PASSENGER_APP_PROFILE",
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PASSENGER_APP_MAIN_TRAVEL": {
  //           await UtilService.axiosInstanceV2({
  //             url: Constant.RECENT_TRAVEL_UPDATE,
  //             method: "put",
  //             data: { passengerId: foundedTransaction.receiverId },
  //           })
  //           console.log("tahaaaaaaaaaaaaaaaaaaaaaaaaaaaaaahaaa  ok")
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_MAIN_TRAVEL({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_PASSENGER_APP_MAIN_TRAVEL",
  //               Authority,
  //             })
  //           )
  //           break
  //         }

  //         case "REDIRECT_TO_DASHBOARD":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_DASHBOARD",
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DRIVER_APP_WALLET":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER":
  //           res.redirect(
  //             appRouting.REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER",
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_DEPTS":
  //           await FinancialService.payDriverDebts({
  //             driverId: String(foundedTransaction.receiverId),
  //             totalDebts: foundedTransaction.amount,
  //           })
  //           return res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_SUBSCRIPTION_CONTINUE":
  //           const daysLeft = await FinancialService.payDriverSubscriptionContinues({
  //             driverId: String(foundedTransaction.receiverId),
  //             amount: foundedTransaction.amount,
  //             Authority,
  //           })
  //           res.redirect(
  //             appRouting.REDIRECT_SUBSCRIPTION_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //               daysLeft,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS":
  //           // TODO SERVICE PAYDEBT SEDA ZADE SHAVAD

  //           res.redirect(
  //             appRouting.REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS +
  //               "?status=" +
  //               status +
  //               "&amount=" +
  //               foundedTransaction.amount +
  //               "&receiverId=" +
  //               foundedTransaction.receiverId
  //           )
  //           break

  //         default:
  //           throw new ErrorHandler({
  //             statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
  //             httpCode: 404,
  //           })
  //           break
  //       }
  //     } else {
  //       //* failed callBack controll  :
  //       switch (foundedTransaction.target) {
  //         case "REDIRECT_TO_DRIVER_APP_WALLET":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PASSENGER_APP_PROFILE":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_PROFILE({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DASHBOARD":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_DASHBOARD",
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PASSENGER_APP_MAIN_TRAVEL":
  //           console.log("tahaaaaaaaaaaaaaaaaaaaaaaaaaaaaaahaaa  nok")

  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_MAIN_TRAVEL({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )

  //           break

  //         case "REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER":
  //           res.redirect(
  //             appRouting.REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER +
  //               "?status=" +
  //               status +
  //               "&amount=" +
  //               foundedTransaction.amount +
  //               "&receiverId=" +
  //               foundedTransaction.receiverId
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_DEPTS":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_SUBSCRIPTION_CONTINUE":
  //           res.redirect(
  //             appRouting.REDIRECT_SUBSCRIPTION_FAILED_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS":
  //           // TODO SERVICE PAYDEBT SEDA ZADE SHAVAD

  //           res.redirect(
  //             appRouting.REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS +
  //               "?status=" +
  //               status +
  //               "&amount=" +
  //               foundedTransaction.amount +
  //               "&receiverId=" +
  //               foundedTransaction.receiverId
  //           )
  //           break

  //         default:
  //           throw new ErrorHandler({
  //             statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
  //             httpCode: 404,
  //           })
  //           break
  //       }
  //     }
  //   } else {
  //     if (getway === "saderat") {
  //       const res = await Api.postSaderatAdvice({
  //         digitalreceipt,
  //         Tid: Constant.SADERAT_TERMINAL_ID,
  //       })
  //       if (res.Status === "Duplicate" || res.Status === "Ok") {
  //         status = "SUCCESS"
  //         Status = "OK"
  //       } else {
  //         status = "FAILED"
  //         Status = "NOK"
  //       }
  //     }
  //     foundedTransaction = await this.transactionService.findTransactionByAuthority(Authority)

  //     await this.transactionService.updateTransaction({
  //       Authority,
  //       reason,
  //       status,
  //     })

  //     if (Status === "OK") {
  //       //* success callBack controll  :
  //       switch (foundedTransaction.target) {
  //         case "REDIRECT_TO_PASSENGER_APP_PROFILE":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_PROFILE({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_PASSENGER_APP_PROFILE",
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PASSENGER_APP_MAIN_TRAVEL": {
  //           await UtilService.axiosInstanceV2({
  //             url: Constant.RECENT_TRAVEL_UPDATE,
  //             method: "put",
  //             data: { passengerId: foundedTransaction.receiverId },
  //           })
  //           console.log("tahaaaaaaaaaaaaaaaaaaaaaaaaaaaaaahaaa  ok")
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_MAIN_TRAVEL({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_PASSENGER_APP_MAIN_TRAVEL",
  //               Authority,
  //             })
  //           )
  //           break
  //         }

  //         case "REDIRECT_TO_DASHBOARD":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_DASHBOARD",
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DRIVER_APP_WALLET":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER":
  //           res.redirect(
  //             appRouting.REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER",
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_DEPTS":
  //           return res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_SUBSCRIPTION_CONTINUE":
  //           res.redirect(
  //             appRouting.REDIRECT_SUBSCRIPTION_SUCCESS_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS":
  //           // TODO SERVICE PAYDEBT SEDA ZADE SHAVAD

  //           res.redirect(
  //             appRouting.REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS +
  //               "?status=" +
  //               status +
  //               "&amount=" +
  //               foundedTransaction.amount +
  //               "&receiverId=" +
  //               foundedTransaction.receiverId
  //           )
  //           break

  //         default:
  //           throw new ErrorHandler({
  //             statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
  //             httpCode: 404,
  //           })
  //           break
  //       }
  //     } else {
  //       //* failed callBack controll  :
  //       switch (foundedTransaction.target) {
  //         case "REDIRECT_TO_DRIVER_APP_WALLET":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PASSENGER_APP_PROFILE":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_PROFILE({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DASHBOARD":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               target: "REDIRECT_TO_DASHBOARD",
  //               Authority,
  //             })
  //           )
  //           break
  //         case "REDIRECT_TO_PASSENGER_APP_MAIN_TRAVEL":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_MAIN_TRAVEL({
  //               userId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )

  //           break

  //         case "REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER":
  //           res.redirect(
  //             appRouting.REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER +
  //               "?status=" +
  //               status +
  //               "&amount=" +
  //               foundedTransaction.amount +
  //               "&receiverId=" +
  //               foundedTransaction.receiverId
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_DEPTS":
  //           res.redirect(
  //             appRouting.REDIRECT_DEPOSIT_FAILED_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_PAY_SUBSCRIPTION_CONTINUE":
  //           res.redirect(
  //             appRouting.REDIRECT_SUBSCRIPTION_FAILED_PAY_TO_DRIVER_APP_WALLET({
  //               driverId: foundedTransaction.receiverId,
  //               amount: foundedTransaction.amount,
  //               Authority,
  //             })
  //           )
  //           break

  //         case "REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS":
  //           // TODO SERVICE PAYDEBT SEDA ZADE SHAVAD

  //           res.redirect(
  //             appRouting.REDIRECT_TO_DRIVER_APP_HOME_FOR_PAY_DEBTS +
  //               "?status=" +
  //               status +
  //               "&amount=" +
  //               foundedTransaction.amount +
  //               "&receiverId=" +
  //               foundedTransaction.receiverId
  //           )
  //           break

  //         default:
  //           throw new ErrorHandler({
  //             statusCode: StatusCodes.ERROR_TARGET_NOT_FOUND,
  //             httpCode: 404,
  //           })
  //           break
  //       }
  //     }
  //   }
  // }

  // async saderatGateway(req, res) {
  //   const { amount } = req.query

  //   await this.validatorService.saderatGatewayInputValidation(req.query)
  //   const saderatServiceTokenUrl = Constant.SADERAT_SERVICE_TOKEN
  //   const formData = {
  //     Amount: parseInt(amount),
  //     callbackURL: Constant.SADERAT_CALLBACK_URL,
  //     invoiceID: await this.utilService.uuidv4(),
  //     terminalID: Constant.TERMINAL_ID,
  //     Payload: "",
  //   }
  //   const result = await this.paymentService.saderatAccessToken({
  //     formData,
  //     saderatServiceTokenUrl,
  //   })
  //   const formDataPay = {
  //     TerminalID: `${Constant.TERMINAL_ID}`,
  //     token: result.Accesstoken,
  //     getMethod: 0,
  //   }
  //   const saderatPayUrl = Constant.SADERAT_PAY
  //   const response = await this.paymentService.saderatPayment({
  //     formDataPay,
  //     saderatPayUrl,
  //   })
  //   const htmlContent = response
  //   //  fs.writeFileSync('/my-page.html', htmlContent);
  //   //  return res.sendFile('/my-page.html')
  // }

  async getPaymentPage (req, res) {
    res.sendFile(__dirname + '/payment.html')
  }

  async getFailedPaymentPage (req, res) {
    res.sendFile(__dirname + '/paymentFailed.html')
  }
}
module.exports = new PaymentController(PaymentService, ValidatorService, UtilService, FinancialService, TransactionService)
