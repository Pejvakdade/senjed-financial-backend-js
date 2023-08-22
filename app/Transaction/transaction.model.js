const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")
const ProvinceSchool = require("../models/province.model")

const schoolTransactionModel = new mongoose.Schema(
  {
    reason: {
      type: String,
      enum: ["SERVICE_SUBSCRIPTION", "SERVICE_SUBSCRIPTION_COMMISSION", "WITHDRAWAL", "DEPOSIT", "SERVICE_SUBSCRIPTION_FROM_WALLET"],
    },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    payerType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    superAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    secondParent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    subscribe: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolTransaction" },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool" },
    amount: { type: Number },
    isDeposit: { type: Boolean },
    isCallBack: { type: Boolean, default: false },
    isForClient: { type: Boolean, default: false },
    withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: "Withdrawal" },
    isOnline: { type: Boolean, default: false },
    trackingCode: { type: String },
    count: { type: Number },
    factorsList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Factor" }],
    authority: { type: String },
    target: {
      type: String,
      enum: ["REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD", "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT", "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER"],
    },
    getway: { type: String, enum: ["saderat", "zarinpal"] },
    description: { type: String },
    transactionStatus: { type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "SUCCESS" },
  },
  { timestamps: true }
)
schoolTransactionModel.plugin(mongoosePaginate)
module.exports = mongoose.model("SchoolTransaction", schoolTransactionModel)
