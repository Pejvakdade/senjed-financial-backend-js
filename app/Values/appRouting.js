const REDIRECT_TO_SADERAT_GETWAY = ({ token }) => `${process.env.BASE_URL}/api/v1/payment/redirect-saderat?token=${token}`

const REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD = ({ serviceId, payerId, amount, target, authority }) =>
  `${process.env.BASE_URL}/api/v1/financial/payment/payment-page?authority=${authority}&link=https://${process.env.BASE_DASHBOARD_URL}/getway?status=success&target=${target}&amount=${amount}&serviceId=${serviceId}&payerId=${payerId}&authority=${authority}}`

const REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD = ({ serviceId, payerId, amount, target, authority }) =>
  `${process.env.BASE_URL}/api/v1/financial/payment/failed-payment-page?authority=${authority}&link=https://${process.env.BASE_DASHBOARD_URL}/gateway?status=failed&target=${target}&amount=${amount}&serviceId=${serviceId}&payerId=${payerId}&authority=${authority}`

const REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS = ({ authority }) =>
  `${process.env.BASE_URL}/api/v1/financial/payment/payment-page?authority=${authority}&link=appSenjedParent://some_path`

const REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED = ({ authority }) =>
  `${process.env.BASE_URL}/api/v1/financial/payment/failed-payment-page?authority=${authority}&link=appSenjedParent://some_path`

const REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS = ({ authority }) =>
  `${process.env.BASE_URL}/api/v1/financial/payment/payment-page?authority=${authority}&link=appSenjedDriver://some_path`

const REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED = ({ authority }) =>
  `${process.env.BASE_URL}/api/v1/financial/payment/failed-payment-page?authority=${authority}&link=appSenjedDriver://some_path`

module.exports = {
  REDIRECT_TO_SADERAT_GETWAY,
  REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD,
  REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD,
  REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_SUCCESS,
  REDIRECT_TO_PAY_SUBSCRIPTION_PARENT_FAILED,
  REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_SUCCESS,
  REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER_FAILED,
}
