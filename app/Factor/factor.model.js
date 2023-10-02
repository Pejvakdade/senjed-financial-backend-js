const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")

const factorModel = new mongoose.Schema(
  {
    price: { type: Number, default: 0 },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    secondParent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["PAID", "UN_PAID"],
      default: "UN_PAID",
    },
    oldSubscriptionDate: { type: Date },
    newSubscriptionDate: { type: Date },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paidDate: { type: Date },
  },
  { timestamps: true }
)
factorModel.plugin(mongoosePaginate)
module.exports = mongoose.model("Factor", factorModel)
