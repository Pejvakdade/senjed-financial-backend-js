// const StatusCodes = require('../Values/StatusCodes')
// const ErrorHandler = require('../Handler/ErrorHandler')
// const TransactionService = require('../Transaction/transaction.service')

// module.exports = async (req, res, next) => {
//   try {
//     const { Authority, invoiceid } = req.query
//     foundedTransaction = await TransactionService.findTransactionByAuthority(Authority || invoiceid)
//     console.log({ isCallBackkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk: foundedTransaction.isCallBack === true })
//     if (foundedTransaction.isCallBack === true) {
//       throw new ErrorHandler({
//         statusCode: StatusCodes.ERROR_TRANSACTION_NOT_FOUND,
//         httpCode: 404
//       })
//     }
//     await TransactionService.updateTransaction({
//       isCallBack: true
//     })
//     next()
//   } catch (e) {
//     console.log({ e })
//     res.status(403).json({ CODE: StatusCodes.AUTH_FAILED })
//   }
// }
