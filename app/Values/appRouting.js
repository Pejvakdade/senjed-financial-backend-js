const REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_PROFILE = ({ userId, amount, target, Authority }) =>
  `https://ajansro.com/api/v1/payment/payment-page?authority=${Authority}&link=https://dlpassenger.com?status=success&ownerType=PASSENGER&target=${target}&amount=${amount}&ownerId=${userId}&Authority=${Authority}`

const REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD = ({ userId, amount, target, Authority }) =>
  `https://ajansro.com/api/v1/payment/payment-page?authority=${Authority}&link=https://${process.env.BASE_DASHBOARD_URL}/getway?status=success&target=${target}&amount=${amount}&ownerId=${userId}&Authority=${Authority}`

const REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD = ({ userId, amount, target, Authority }) =>
  `https://ajansro.com/api/v1/payment/failed-payment-page?authority=${Authority}&link=https://${process.env.BASE_DASHBOARD_URL}/gateway?status=failed&target=${target}&amount=${amount}&ownerId=${userId}&Authority=${Authority}`

const REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_PROFILE = ({ userId, amount, target, Authority }) =>
  `https://ajansro.com/api/v1/payment/failed-payment-page?authority=${Authority}&link=https://dlpassenger.com?status=failed&ownerType=PASSENGER&target=${target}&amount=${amount}&ownerId=${userId}&Authority=${Authority}`

const REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_MAIN_TRAVEL = ({ userId, amount, target, Authority }) =>
  `https://ajansro.com/api/v1/payment/payment-page?authority=${Authority}&link=https://dlpassenger.com?status=success&ownerType=PASSENGER&target=${target}&amount=${amount}&ownerId=${userId}&Authority=${Authority}`

const REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_MAIN_TRAVEL = ({ userId, amount, target, Authority }) =>
  `https://ajansro.com/api/v1/payment/failed-payment-page?authority=${Authority}&link=https://dlpassenger.com?status=failed&ownerType=PASSENGER&target=${target}&amount=${amount}&ownerId=${userId}&Authority=${Authority}`

const REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER = ({ userId, amount, target, Authority }) =>
  `https://ajansro.com/api/v1/payment/payment-page?authority=${Authority}&link=https://dloperator.com?status=success&ownerType=AGENT&target=${target}&amount=${amount}&ownerId=${userId}&Authority=${Authority}`

const REDIRECT_TO_PAY_DEPTS = ({ driverId, totalDebts, Authority }) =>
  `https://ajansro.com/api/v1/financial/pay-driver-debt-continues?driverId=${driverId}&totalDebts=${totalDebts}&Authority=${Authority}`

const REDIRECT_TO_SADERAT_GETWAY = ({ token }) => `https://ajansro.com/api/v1/payment/redirect-saderat?token=${token}`

const PAY_FAILD = "http://pikaap.com"

const REDIRECT_DEPOSIT_SUCCESS_PAY_TO_DRIVER_APP_WALLET = ({ driverId, amount, Authority }) =>
  `https://ajansro.com/api/v1/payment/payment-page?authority=${Authority}&link=https://dldriver.com?status=success&reason=CHARGE_WALLET&amount=${amount}&ownerId=${driverId}&Authority=${Authority}`

const REDIRECT_DEPOSIT_FAILED_PAY_TO_DRIVER_APP_WALLET = ({ driverId, amount, Authority }) =>
  `https://ajansro.com/api/v1/payment/failed-payment-page?authority=${Authority}&link=https://dldriver.com?status=failed&reason=CHARGE_WALLET&amount=${amount}&ownerId=${driverId}&Authority=${Authority}`

const REDIRECT_TO_PAY_SUBSCRIPTION_CONTINUE = ({ driverId, amount, Authority }) =>
  `https://ajansro.com/api/v1/financial/pay-driver-subscription-continues?driverId=${driverId}&amount=${amount}&Authority=${Authority}`

const REDIRECT_SUBSCRIPTION_SUCCESS_PAY_TO_DRIVER_APP_WALLET = ({ Authority, driverId, amount, daysLeft }) =>
  `https://ajansro.com/api/v1/payment/payment-page?authority=${Authority}&link=https://dldriver.com?status=success&amount=${amount}&ownerId=${driverId}&daysLeft=${daysLeft}&Authority=${Authority}`

const REDIRECT_SUBSCRIPTION_FAILED_PAY_TO_DRIVER_APP_WALLET = ({ driverId, amount, Authority }) =>
  `https://ajansro.com/api/v1/payment/failed-payment-page?authority=${Authority}&link=https://dldriver.com?status=failed&reason=SUBSCRIPTION&amount=${amount}&ownerId=${driverId}&Authority=${Authority}`

module.exports = {
  REDIRECT_DEPOSIT_SUCCESS_PAY_TO_DRIVER_APP_WALLET,
  REDIRECT_DEPOSIT_FAILED_PAY_TO_DRIVER_APP_WALLET,
  REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_PROFILE,
  REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_PROFILE,
  REDIRECT_DEPOSIT_SUCCESS_PAY_TO_PASSENGER_APP_MAIN_TRAVEL,
  REDIRECT_DEPOSIT_FAILED_PAY_TO_PASSENGER_APP_MAIN_TRAVEL,
  REDIRECT_TO_SADERAT_GETWAY,
  REDIRECT_TO_OPERATOR_AAP_CHARGE_DRIVER,
  REDIRECT_TO_PAY_DEPTS,
  PAY_FAILD,
  REDIRECT_SUBSCRIPTION_SUCCESS_PAY_TO_DRIVER_APP_WALLET,
  REDIRECT_TO_PAY_SUBSCRIPTION_CONTINUE,
  REDIRECT_SUBSCRIPTION_FAILED_PAY_TO_DRIVER_APP_WALLET,
  REDIRECT_DEPOSIT_SUCCESS_TO_DASHBOARD,
  REDIRECT_DEPOSIT_FAILED_TO_DASHBOARD,
}
