const axios = require("axios")

class ZarinpalService {
  constructor() {}

  async request({ amount, callback_url, description, trackingCode }) {
    const merchantId = process.env.MERCHANT_ID_ZARINPAL
    console.log({ merchantId })
    const data = JSON.stringify({
      merchant_id: merchantId,
      amount: String(amount),
      callback_url,
      description,
    })
    console.log({ data })
    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.zarinpal.com/pg/v4/payment/request.json",
      headers: {
        "Content-Type": "application/json",
      },
      data,
    }
    const response = await axios(config)
    console.log({ taha: response.data })

    if (response.data.data.code === 100) {
      return response.data.data.authority.toUpperCase()
    } else {
      console.log({ resErr: response.data.data })
      return false
    }
  }

  async verify({ amount, authority }) {
    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.zarinpal.com/pg/v4/payment/verify.json",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        merchant_id: process.env.MERCHANT_ID_ZARINPAL,
        amount,
        authority,
      }),
    }
    const response = await axios(config)
    if (response.data.data.code === 100 || 101) return response.data.data.card_pan
    else return false
  }
}
module.exports = new ZarinpalService()
