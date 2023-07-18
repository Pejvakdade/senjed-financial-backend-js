// const ZarinpalCheckout = require('zarinpal-checkout')
// const zarinpal = ZarinpalCheckout.create('d6bf06fa-756b-46de-bbf0-55dee2989872', false)
// const ErrorHandler = require('../Handler/ErrorHandler')
// const TransactionService = require('../Transaction/transaction.service')
// const StatusCodes = require('../Values/StatusCodes')
// const FinancialService = require('../Financial/financial.service')
// const Constant = require('../Values/constants')
// const Redis = require('../Redis/redis.service')
// const Api = require('../Api')
// const { appRouting } = require('../Values')

// const axios = require('axios').default
// class PaymentService {
//   constructor (transactionService, financialService) {
//     this.transactionService = transactionService
//     this.financialService = financialService
//   }

//   async createGetwayLink ({ getway , amount, isForClient, userId, description , reason, target, payerType }, res) {
//     const invoiceID = Math.floor(Math.random() * 10000000000)
//     if (getway === 'zarinpal') {
//       const response = await zarinpal.PaymentRequest({
//         Amount: amount,
//         CallbackURL: `https://ajansro.com/api/v1/payment/zarinpal/verify?reason=${reason}&target=${target}`,
//         Description: description
//       })

//       if (response.status === 100) {
//         await this.transactionService.deposit({
//           reason,
//           transactionStatus: 'PENDING',
//           payerType,
//           payerId: userId,
//           receiverType: payerType,
//           receiverId: userId,
//           amount,
//           gateway: 'ZARINPAL',
//           authority: response.authority,
//           description,
//           target,
//           isOnline: true,
//           isDeposit: true,
//           isForClient
//         })
//         res.redirect(response.url)
//       }
//     } else if (getway === 'saderat') {
//       const foundedToken = await Api.getTokenSaderat({
//         terminalID: Constant.SADERAT_TERMINAL_ID,
//         Amount: Number(amount) * 10,
//         callbackURL: `https://ajansro.com/api/v1/payment/zarinpal/verify?reason=${reason}&target=${target}&getway=saderat`,
//         invoiceID,
//         Payload: description
//       })

//       if (foundedToken.Status !== 0) {
//         throw new ErrorHandler({
//           statusCode: StatusCodes.ERROR_SADERAT_TOKEN,
//           httpCode: 400
//         })
//       } else {
//         await this.transactionService.deposit({
//           reason,
//           transactionStatus: 'PENDING',
//           payerType,
//           payerId: userId,
//           receiverType: payerType,
//           receiverId: userId,
//           amount,
//           gateway: 'SADERAT',
//           authority: invoiceID,
//           description,
//           target,
//           isOnline: true,
//           isDeposit: true,
//           isForClient
//         })

//         await Redis.saveEx(invoiceID, {}, 660)
//         return res.redirect(
//           appRouting.REDIRECT_TO_SADERAT_GETWAY({
//             token: foundedToken.Accesstoken
//           })
//         )
//       }
//     }
//   }
// }
// module.exports = new PaymentService(TransactionService, FinancialService)
