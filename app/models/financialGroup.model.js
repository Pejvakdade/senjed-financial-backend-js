const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const financialGroupSchoolModel = new mongoose.Schema(
  {
    agentSubscription: { type: Number, default: 0 },
    name: { type: String },
    subscriptionStudent: {
      share: {
        admin: { type: Number, default: 0 },
        company: { type: Number, default: 0 },
        superAgent: { type: Number, default: 0 },
        driver: { type: Number, default: 0 },
        tax: { type: Number, default: 0 }
      },
      cycle: { type: Number, default: 0 }
    },
    subscriptionAgent: {
      share: {
        admin: { type: Number, default: 0 },
        superAgent: { type: Number, default: 0 },
        tax: { type: Number, default: 0 }
      },
      cycle: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
)
financialGroupSchoolModel.plugin(mongoosePaginate)
module.exports = mongoose.model('FinancialGroupSchool', financialGroupSchoolModel)
