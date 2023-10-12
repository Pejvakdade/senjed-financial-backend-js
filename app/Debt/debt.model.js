const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")
const mongooseAggregate = require("mongoose-aggregate-paginate-v2")

const DebtModel = new mongoose.Schema(
  {
    reason: {
      type: String,
      enum: ["COMPANY_DEBT_TO_DRIVER", "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION"],
    },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    payerType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    superAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
    driverPhoneNumber: { type: String },
    studentName: { type: String },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool" },
    amount: { type: Number },
    trackingCode: { type: String },
    factorsList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Factor" }],
    description: { type: String },
    status: { type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "SUCCESS" },
    subscribe: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolTransaction" },
    paidDate: { type: String },
  },
  { timestamps: true }
)
DebtModel.plugin(mongoosePaginate)
DebtModel.plugin(mongooseAggregate)

module.exports = mongoose.model("Debt", DebtModel)
