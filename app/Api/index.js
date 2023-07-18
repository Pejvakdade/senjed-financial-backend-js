const instance = require('./axios.instance')
const Constants = require('../Values/constants')
const axios = require('axios')

class Api {
  async heimdall ({ token, type }) {
    const response = await instance().get(Constants.heimdall, {
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return response.data.result
  }

  async getDriverById (id) {
    const foundedDriver = await instance().get(Constants.getUserByIdUrl, {
      params: { id }
      // headers: { Authorization: `Bearer ${token}`, type },
    })
    return foundedDriver.data.result
  }

  async accountantChargeWalletById ({ amount, id, Authority }) {
    amount: parseInt(amount)
    if (amount === 0) {
      return true
    } else {
      await instance().post(Constants.accountantById, {
        amount,
        id,
        authority: Authority
      })
    }
  }

  async accountantCheckWalletById ({ amount, id }) {
    if (amount === 0) {
      return true
    } else {
      const result = await instance().get(Constants.accountantCheckWalletById, {
        params: { amount, id }
      })
      return result.data.result.balanceSufficient
    }
  }

  async findAdminById () {
    const foundedAdmin = await instance().get(Constants.findAdminById, {
      params: { permit: '6394347801061424234234280000' }
    })
    return foundedAdmin.data.result
  }

  async findTaxById () {
    const foundedTax = await instance().get(Constants.findTaxById, {
      params: { permit: '6394347801061424234234280000' }
    })
    return foundedTax.data.result
  }

  async getAllCity () {
    const foundedAdmin = await instance().get(Constants.getAllCity, {})
    return foundedAdmin.data.result
  }

  async findTravelById ({ travelId, token, type }) {
    const foundedTax = await instance().get(Constants.findTravelById, {
      params: { travelId },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return foundedTax.data.result
  }

  async unblockForSubscriptionByToke4n ({ token, type }) {
    const result = await instance().delete(Constants.unblockByReasonByToken, {
      data: { reason: 2013 },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return result.data.result
  }

  async unblockUserForDebtByToken ({ token, type }) {
    const result = await instance().delete(Constants.unblockByReasonByToken, {
      data: { reason: 2014 },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return result.data.result
  }

  async unblockUserForReasonById ({ driverId, reason, type }) {
    const result = await instance().delete(Constants.unblockByReasonById, {
      data: { driverId, reason }
    })
    return result
  }

  async blockDriverForDebt ({ driverId, token, type }) {
    const option = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        type
      }
    }
    const foundedDriver = await instance().post(Constants.blockDriverByIdForDebt, { driverId }, option)
    return foundedDriver.data.result
  }

  async addSubscriptionDays ({ driverId, days }) {
    const result = await instance().post(Constants.addSubscriptionDays, {
      driverId,
      days
    })
    return result.data.result
  }

  async createDebtForDriver ({ reason, debtorId, payerId, payerType, receiverId, receiverType, amount, token, type, travelCode }) {
    const option = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        type
      }
    }
    const result = await instance().post(
      Constants.createDebtForDriver,
      { reason, debtorId, payerId, payerType, receiverId, receiverType, amount, travelCode },
      option
    )
    return result
  }

  async sendSmsSubscriptionSubmit ({ userId, days }) {
    const option = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
    const result = await instance().post(Constants.sendSmsSubscriptionSubmit, { userId, days }, option)
    return result
  }

  async sendSmsDebt ({ userId, token, type }) {
    const option = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        type
      }
    }
    const result = await instance().post(Constants.sendSmsDebt, { userId }, option)
    return result
  }

  async sendSmsPayDebt ({ userId }) {
    const result = await instance().post(Constants.sendSmsPayDebt, { userId })
    return result
  }

  async calculateDriverDebt ({ driverId }) {
    const foundedTax = await instance().get(Constants.calculateDriverDebt, {
      params: { id: driverId }
    })
    return foundedTax.data.result.totalDebts
  }

  async deleteAllDebts ({ driverId }) {
    await instance().delete(Constants.deleteAllDebts, {
      params: { id: driverId }
    })
  }

  async searchUserByName ({ lastName, userType, token, type }) {
    const result = await instance().get(Constants.searchUserByName, {
      params: { lastName, userType },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return result.data.result
  }

  async searchUserByNationalCode ({ nationalCode, token, type }) {
    const result = await instance().get(Constants.searchUserByNationalCode, {
      params: { nationalCode },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return result.data.result
  }

  async searchUserByCode ({ code, userType, token, type }) {
    const result = await instance().get(Constants.searchUserByCode, {
      params: { code, userType },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return result.data.result
  }

  async searchUserByPhoneNumber ({ phoneNumber, token, type }) {
    const result = await instance().get(Constants.searchUserByPhoneNumber, {
      params: { phoneNumber },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return result.data.result
  }

  async getAllUsers ({ token, type, forInvoice }) {
    const result = await instance().get(Constants.getAllUsers, {
      params: { forInvoice },
      headers: { Authorization: `Bearer ${token}`, type }
    })

    return result.data.result
  }

  async createNewInvoice ({ payType, trackingCode, createdBy, creatorType, receiverId, amount, reason, token, type, image, ownerType }) {
    const option = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        type
      }
    }
    const result = await instance().post(
      Constants.createNewInvoice,
      {
        payType,
        trackingCode,
        createdBy,
        creatorType,
        receiverId,
        amount,
        reason,
        image,
        ownerType
      },
      option
    )
    return result.data.result
  }

  async findInvoiceById ({ invoiceId, userId, token, type }) {
    const result = await instance().get(Constants.findInvoiceById, {
      params: { invoiceId, userId },
      headers: { Authorization: `Bearer ${token}`, type }
    })
    return result.data.result
  }

  async updateInvoiceStatus ({ invoiceId, userId, status, token, type }) {
    const option = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        type
      }
    }
    const result = await instance().put(Constants.updateInvoiceStatus, { invoiceId, userId, status }, option)
    return result.data.result
  }

  async updateSmsFlagAfterPay ({ driverId }) {
    const option = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
    await instance().put(Constants.updateSmsFlagAfterPay, { driverId }, option)
    return true
  }

  async getTokenSaderat ({ terminalID, Amount, callbackURL, invoiceID, Payload }) {
    const result = await instance().post(Constants.SADERAT_GET_TOKEN, {
      terminalID,
      Amount,
      callbackURL,
      invoiceID,
      Payload
    })
    return result.data
  }

  async postSaderatAdvice ({ digitalreceipt, Tid }) {
    const result = await instance().post(Constants.SADERAT_ADVICE_API, {
      digitalreceipt,
      Tid
    })
    return result.data
  }

  async sendMessageChapar ({ userId, message }) {
    // message = encodeURI(message)
    const data = JSON.stringify({
      userId,
      message
    })
    const config = {
      method: 'post',
      url: Constants.SEND_MESSAGE_CHAPAR_RAYGAN,
      headers: {
        'Content-Type': 'application/json'
      },
      data
    }
    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data))
      })
      .catch(function (error) {
        console.log(error)
      })

    return true
  }
}

module.exports = new Api()
