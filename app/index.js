const express = require("express")
const mongoose = require("mongoose")
const app = express()
const v1 = require("./Routes/v1")
//= ===== Documentation
const cron = require("node-cron")

//= ===== Documentation
const ErrorHandler = require("./Handler/ErrorHandler")
const StatusCodes = require("./Values/StatusCodes")
const factorService = require("../app/Factor/factor.service")
const morgan = require("morgan")
const json2xls = require("json2xls")
const cors = require("cors")
require("dotenv").config()
app.use(morgan("dev"))
app.use(cors())
app.use(express.json())
app.use(json2xls.middleware)

//! ExpiretionDate checker
cron.schedule("*/10 * * * * *", async function () {
  await factorService.checkExpireServices()
})
//! ExpiretionDate checker END

const MONGOOSE_USR = process.env.MONGOOSE_USR
const MONGOOSE_AUTH_USR = process.env.MONGOOSE_AUTH_USR
const MONGOOSE_PWD = process.env.MONGOOSE_PWD
const MONGOOSE_PORT = process.env.MONGOOSE_PORT
const MONGOOSE_IP = process.env.MONGOOSE_IP
const MONGOOSE_DATABASE_NAME = process.env.MONGOOSE_DATABASE_NAME
const MONGOOSE_CONNECTION_URL = `mongodb://
${MONGOOSE_USR}:
${encodeURIComponent(MONGOOSE_PWD)}@${MONGOOSE_IP}:${MONGOOSE_PORT}/${MONGOOSE_DATABASE_NAME}`
const MONGOOSE_CONFIG = {
  useNewUrlParser: true,
  authSource: MONGOOSE_AUTH_USR,
  useUnifiedTopology: true,
}

app.use("/api/v1/financial/", v1)
app.use((err, req, res, next) => {
  if (err instanceof ErrorHandler) {
    console.log({ err })
    res.status(err.httpCode).json({ httpCode: err.httpCode, statusCode: err.statusCode })
  } else {
    console.log({ err })
    res.status(500).json({ statusCode: StatusCodes.ERROR_INTERNAL })
  }
})

mongoose
  .connect(MONGOOSE_CONNECTION_URL, MONGOOSE_CONFIG)
  .then(async (result) => {
    console.log("CONNECTED")
  })
  .catch((err) => {
    console.log({ MONGO_ERROR: err })
  })
module.exports = app
