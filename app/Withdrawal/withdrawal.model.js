const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")
const ProvinceSchool = require("../models/province.model")

const WithdrawalModel = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    phoneNumber: { type: String },
    type: {
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
    city: { type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool" },
    province: { type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool" },
    amount: { type: Number },
    trackingCode: { type: String },
    description: { type: String, default: "" },
    status: { type: String, enum: ["SUCCESS", "REJECT", "PENDING"], default: "PENDING" },
    shabaId: { type: String },
    bankId: { type: String },
    bankName: { type: String },
  },
  { timestamps: true }
)
WithdrawalModel.plugin(mongoosePaginate)
module.exports = mongoose.model("Withdrawal", WithdrawalModel)
