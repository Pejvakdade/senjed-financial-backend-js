const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const financialGroupModel = new mongoose.Schema(
  {
    hasSubscription: { type: Boolean, default: true },
    name: { type: String },
    subscription: {
      share: {
        admin: { type: Number },
        agent: { type: Number },
        superAgent: { type: Number },
        tax: { type: Number }
      },
      cycle: { type: Number },
      fee: { type: Number }
    },
    groupType: { type: String, enum: ['TRAVEL', 'FOOD', 'DELIVARY'] },
    travelShare: {
      admin: { type: Number },
      driver: { type: Number },
      agent: { type: Number },
      superAgent: { type: Number },
      tax: { type: Number }
    }
  },
  { timestamps: true }
)
financialGroupModel.plugin(mongoosePaginate)
module.exports = mongoose.model('FinancialGroup', financialGroupModel)
