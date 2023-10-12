const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const ProvinceSchool = require("../models/province.model");

/**
 * Mongoose schema definition for school transactions.
 *
 * @type {mongoose.Schema}
 * @property {String} reason
 * @property {String} fishId
 * @property {String} offlinePayType
 * @property {mongoose.Schema.Types.ObjectId} payerId
 * @property {String} payerType
 * @property {mongoose.Schema.Types.ObjectId} receiverId
 * @property {String} receiverType
 * @property {String} payerOriginType
 * @property {mongoose.Schema.Types.ObjectId} superAgent
 * @property {mongoose.Schema.Types.ObjectId} parent
 * @property {mongoose.Schema.Types.ObjectId} secondParent
 * @property {mongoose.Schema.Types.ObjectId} school
 * @property {mongoose.Schema.Types.ObjectId} driver
 * @property {mongoose.Schema.Types.ObjectId} student
 * @property {mongoose.Schema.Types.ObjectId} company
 * @property {mongoose.Schema.Types.ObjectId} service
 * @property {mongoose.Schema.Types.ObjectId} subscribe
 * @property {mongoose.Schema.Types.ObjectId} city
 * @property {Number} amount
 * @property {Boolean} isDeposit
 * @property {Boolean} isCallBack
 * @property {Boolean} isForClient
 * @property {mongoose.Schema.Types.ObjectId} withdrawalId
 * @property {Boolean} isOnline
 * @property {String} trackingCode
 * @property {Number} count
 * @property {Array<mongoose.Schema.Types.ObjectId>} factorsList
 * @property {String} authority
 * @property {String} target
 * @property {String} getway
 * @property {String} description
 * @property {String} transactionStatus
 *
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const schoolTransactionModel = new mongoose.Schema(
  {
    reason: {
      type: String,
      enum: [
        "SERVICE_SUBSCRIPTION",
        "SERVICE_SUBSCRIPTION_COMMISSION",
        "WITHDRAWAL",
        "DEPOSIT",
        "SERVICE_SUBSCRIPTION_FROM_WALLET",
        "TRANSFER_PROFIT",
      ],
    },
    fishId: {type: String},
    offlinePayType: {type: String, enum: ["CASH", "POS_MACHINE", "TRANSFER"]},
    payerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    payerType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    receiverType: {
      type: String,
      enum: ["DRIVER", "PASSENGER", "COMPANY", "SUPER_AGENT_SCHOOL", "TAX", "BANK_SCHOOL", "COMMISSION_MANAGER_SCHOOL"],
    },
    payerOriginType: {type: String, enum: ["DRIVER", "PASSENGER"]},
    superAgent: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    parent: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    secondParent: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    school: {type: mongoose.Schema.Types.ObjectId, ref: "School"},
    driver: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    student: {type: mongoose.Schema.Types.ObjectId, ref: "Student"},
    company: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    service: {type: mongoose.Schema.Types.ObjectId, ref: "Service"},
    subscribe: {type: mongoose.Schema.Types.ObjectId, ref: "SchoolTransaction"},
    city: {type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool"},
    amount: {type: Number},
    isDeposit: {type: Boolean},
    isCallBack: {type: Boolean, default: false},
    isForClient: {type: Boolean, default: false},
    withdrawalId: {type: mongoose.Schema.Types.ObjectId, ref: "Withdrawal"},
    isOnline: {type: Boolean, default: false},
    trackingCode: {type: String},
    count: {type: Number},
    factorsList: [{type: mongoose.Schema.Types.ObjectId, ref: "Factor"}],
    authority: {type: String},
    target: {
      type: String,
      enum: ["REDIRECT_TO_PAY_SUBSCRIPTION_DASHBOARD", "REDIRECT_TO_PAY_SUBSCRIPTION_PARENT", "REDIRECT_TO_PAY_SUBSCRIPTION_DRIVER"],
    },
    getway: {type: String, enum: ["saderat", "zarinpal"]},
    description: {type: String},
    transactionStatus: {type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "SUCCESS"},
  },
  {timestamps: true}
);
schoolTransactionModel.plugin(mongoosePaginate);
module.exports = mongoose.model("SchoolTransaction", schoolTransactionModel);
