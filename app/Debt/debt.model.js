const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const mongooseAggregate = require("mongoose-aggregate-paginate-v2");

/**
 * Represents the DebtModel schema.
 * @typedef {Object} DebtModel
 * @property {string} name
 * @property {number} amount
 * @property {string} fishId
 * @property {string} reason
 * @property {string} status
 * @property {string} paidDate
 * @property {string} payerType
 * @property {string} studentName
 * @property {string} description
 * @property {string} trackingCode
 * @property {string} receiverType
 * @property {string} driverPhoneNumber
 * @property {mongoose.Schema.Types.ObjectId} city
 * @property {mongoose.Schema.Types.ObjectId} driver
 * @property {mongoose.Schema.Types.ObjectId} payerId
 * @property {mongoose.Schema.Types.ObjectId} student
 * @property {mongoose.Schema.Types.ObjectId} service
 * @property {mongoose.Schema.Types.ObjectId} company
 * @property {mongoose.Schema.Types.ObjectId} subscribe
 * @property {mongoose.Schema.Types.ObjectId} superAgent
 * @property {mongoose.Schema.Types.ObjectId} receiverId
 * @property {mongoose.Schema.Types.ObjectId[]} factorsList
 * @property {"CARD_BY_CARD" | "POS_MACHINE" |"TRANSFER"} paymentType
 */
const DebtModel = new mongoose.Schema(
  {
    city: {type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool"},
    name: {type: String},
    fishId: {type: String},
    driver: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    amount: {type: Number},
    student: {type: mongoose.Schema.Types.ObjectId, ref: "Student"},
    service: {type: mongoose.Schema.Types.ObjectId, ref: "Service"},
    payerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    company: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    paidDate: {type: String},
    subscribe: {type: mongoose.Schema.Types.ObjectId, ref: "SchoolTransaction"},
    superAgent: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    studentName: {type: String},
    factorsList: [{type: mongoose.Schema.Types.ObjectId, ref: "Factor"}],
    paymentType: {type: String, enum: ["CARD_BY_CARD", "POS_MACHINE", "TRANSFER"]},
    description: {type: String},
    trackingCode: {type: String},
    driverPhoneNumber: {type: String},
    status: {type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "SUCCESS"},
    reason: {
      type: String,
      enum: ["COMPANY_DEBT_TO_DRIVER", "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION"],
    },
    receiverType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    payerType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    
  },
  {timestamps: true}
);
DebtModel.plugin(mongoosePaginate);
DebtModel.plugin(mongooseAggregate);

module.exports = mongoose.model("Debt", DebtModel);
