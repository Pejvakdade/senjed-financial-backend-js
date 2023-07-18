const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const schoolTransactionModel = new mongoose.Schema(
  {
    reason: {
      type: String,
      enum: ['SERVICE_SUBSCRIPTION', 'SERVICE_SUBSCRIPTION_COMMISSION']
    },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payerType: { type: String },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiverType: { type: String },
    superAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    secondParent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    superAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    subscribe: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolTransaction' },
    amount: { type: Number },
    isDeposit: { type: Boolean },
    isCallBack: { type: Boolean, default: false },
    isForClient: { type: Boolean, default: false },
    withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Withdrawal' },
    isOnline: { type: Boolean, default: false },
    trackingCode: { type: String },
    count: { type: Number },
    factorsList: [{ type: String }],
    authority: { type: String },
    target: { type: String },
    gateway: { type: String },
    description: { type: String }, // PAY_CHARGE_WALLET_INTERNAL_BY_PARENT , PAY_DEBTS_INTERNAL_BY_PARENT ,WITHDRAWAL
    transactionStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], default: 'SUCCESS' },
    city: { type: String }
  },
  { timestamps: true }
)
schoolTransactionModel.plugin(mongoosePaginate)
module.exports = mongoose.model('SchoolTransaction', schoolTransactionModel)
