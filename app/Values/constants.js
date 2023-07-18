const SADERAT_CALLBACK_URL = 'http://localhost:8457/api/v1/payment/saderat/verify'
const TERMINAL_ID = 69002403
const SADERAT_SERVICE_TOKEN = 'https://mabna.shaparak.ir:8081/V1/PeymentApi/GetToken'
const WALLET_CHARGE = 1000
const SUBSCRIPTION = 2000
const REDIRECT_TO_APP_URL = 'https://google.com'
const SUBSCRIPTION_SERVICE_URL = 'http://localhost:8451/api/v1/wallet/subscription'
const ZARINPAL_API = 'd6bf06fa-756b-46de-bbf0-55dee2989872'
const NESHAN_API_KEY = 'service.wF0qrlzXzYAAdhI9EzVXwC4zq95LqMGrUQnf0JmE'
const SADERAT_PAY = 'https://sepehr.shaparak.ir:8080/Pay'
const getUserInfoUrl = 'http://localhost:8451/api/v1/archivist/user-by-token'
const getUserByIdUrl = 'http://localhost:8451/api/v1/archivist/user-by-id'
const SEND_MESSAGE_CHAPAR_RAYGAN = 'http://localhost:8455/api/v1/chapar/sms/template/message2'
const accountantById = 'http://localhost:8451/api/v1/accountant/charge-wallet_by_id'
const accountantCheckWalletById = 'http://localhost:8451/api/v1/accountant/check-wallet-by-id'
const findAdminById = 'http://localhost:8451/api/v1/administrator/find-admin-id'
const getAllCity = 'http://localhost:8451/api/v1/province/get-all-city'
const sendSmsSubscriptionSubmit = 'http://localhost:8455/api/v1/chapar/sms/template/subscription-submit'
const sendSmsDebt = 'http://localhost:8455/api/v1/chapar/sms/template/debt'
const sendSmsPayDebt = 'http://localhost:8455/api/v1/chapar/sms/template/pay-debt'
const findTaxById = 'http://localhost:8451/api/v1/administrator/find-tax-id'
const accountantByToken = 'http://localhost:8451/api/v1/accountant/charge-wallet_by_token'
const getMultipleDriverById = 'http://localhost:8451/api/v1/archivist/driver/multiple'
const financialIsUsed = 'http://localhost:8451/api/v1/archivist/check-use/financial-group'
const travelGroupIsUsed = 'http://localhost:8451/api/v1/archivist/check-use/travel-group'
const findTravelById = 'http://localhost:8453/api/v1/travel/by-id'
const unblockByBlockId = 'http://localhost:8451/api/v1/block/unblock-by-block-id'
const unblockByReasonById = 'http://localhost:8451/api/v1/block/unblock-by-reason-by-id'
const unblockByReasonByToken = 'http://localhost:8451/api/v1/block/unblock-by-reason-b-token'
const blockDriverByIdForDebt = 'http://localhost:8451/api/v1/block/debt-by-id'
const updateSmsFlagAfterPay = 'http://localhost:8451/api/v1/driver/sms-flag-after-pay'
const calculateDriverDebt = 'http://localhost:8451/api/v1/driver/calculate-amount-of-debts'
const deleteAllDebts = 'http://localhost:8451/api/v1/driver/delete-all-debt'
const createNewInvoice = 'http://localhost:8451/api/v1/invoice'
const findInvoiceById = 'http://localhost:8451/api/v1/invoice/find-by-id'
const updateInvoiceStatus = 'http://localhost:8451/api/v1/invoice/status'
const searchUserByName = 'http://localhost:8451/api/v1/user/search-user-by-Name'
const searchUserByNationalCode = 'http://localhost:8451/api/v1/user/search-user-by-nationalCode'
const searchUserByCode = 'http://localhost:8451/api/v1/user/search-user-by-code'
const searchUserByPhoneNumber = 'http://localhost:8451/api/v1/user/search-user-by-phoneNumber'
const getAllUsers = 'http://localhost:8451/api/v1/user/get-all-users'
const heimdall = 'http://localhost:8451/api/v1/heimdall/authenticate'
const RECENT_TRAVEL_UPDATE = 'http://localhost:8453/api/v1/travel/update-payment'
const TRAVEL_URL = 'http://localhost:8453/api/v1/travel'
const SADERAT_TERMINAL_ID = 98071263
const SADERAT_GET_TOKEN = 'https://sepehr.shaparak.ir:8081/V1/PeymentApi/GetToken'
const SADERAT_ADVICE_API = 'https://sepehr.shaparak.ir:8081/V1/PeymentApi/Advice'

const SADERAT_GETWAY_POST = 'https://sepehr.shaparak.ir:8080/Pay'
const addSubscriptionDays = 'http://localhost:8451/api/v1/driver/subscription'
const createDebtForDriver = 'http://localhost:8451/api/v1/driver/create-debt'
const morningTime = process.env.MORNING_TIME
const nightTime = process.env.NIGHT_TIME

module.exports = {
  addSubscriptionDays,
  deleteAllDebts,
  SADERAT_GET_TOKEN,
  searchUserByName,
  SADERAT_TERMINAL_ID,
  SADERAT_GETWAY_POST,
  findInvoiceById,
  SADERAT_ADVICE_API,
  RECENT_TRAVEL_UPDATE,
  heimdall,
  TRAVEL_URL,
  searchUserByNationalCode,
  updateSmsFlagAfterPay,
  searchUserByPhoneNumber,
  SEND_MESSAGE_CHAPAR_RAYGAN,
  getAllUsers,
  unblockByBlockId,
  updateInvoiceStatus,
  unblockByReasonById,
  sendSmsDebt,
  sendSmsPayDebt,
  searchUserByCode,
  getAllCity,
  unblockByReasonByToken,
  calculateDriverDebt,
  createNewInvoice,
  blockDriverByIdForDebt,
  travelGroupIsUsed,
  createDebtForDriver,
  financialIsUsed,
  getMultipleDriverById,
  getUserInfoUrl,
  findTravelById,
  accountantCheckWalletById,
  SADERAT_CALLBACK_URL,
  findAdminById,
  findTaxById,
  TERMINAL_ID,
  sendSmsSubscriptionSubmit,
  SADERAT_SERVICE_TOKEN,
  WALLET_CHARGE,
  SUBSCRIPTION,
  REDIRECT_TO_APP_URL,
  getUserByIdUrl,
  accountantById,
  accountantByToken,
  SUBSCRIPTION_SERVICE_URL,
  ZARINPAL_API,
  NESHAN_API_KEY,
  SADERAT_PAY,
  nightTime,
  morningTime
}
