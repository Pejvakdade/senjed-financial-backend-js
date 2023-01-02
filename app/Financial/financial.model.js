const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const financialModel = new mongoose.Schema(
  {
    name: { type: String }
  },
  { timestamps: true }
)
module.exports = mongoose.model('Financial', financialModel)
