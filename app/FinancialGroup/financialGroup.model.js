const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

/**
 * @typedef financialGroupSchoolModel
 * @property {string} type
 * @property {string} name
 * @property {number} agentSubscription
 * @property {Object} subscriptionStudent
 * @property {Object} subscriptionAgent
 * @property {number} subscriptionAgent.cycle
 * @property {Object} subscriptionAgent.share
 * @property {number} subscriptionAgent.share.tax
 * @property {number} subscriptionAgent.share.admin
 * @property {number} subscriptionAgent.share.superAgent
 * @property {number} subscriptionAgent.share.municipality
 * @property {Object} subscriptionStudent.share
 * @property {number} subscriptionStudent.share.tax
 * @property {number} subscriptionStudent.share.admin
 * @property {number} subscriptionStudent.share.driver
 * @property {number} subscriptionStudent.share.company
 * @property {number} subscriptionStudent.share.superAgent
 * @property {number} subscriptionStudent.share.municipality
 */

const financialGroupSchoolModel = new mongoose.Schema(
  {
    type: {type: String},
    agentSubscription: {type: Number, default: 0},
    name: {type: String},
    subscriptionStudent: {
      share: {
        admin: {type: Number, default: 0},
        company: {type: Number, default: 0},
        superAgent: {type: Number, default: 0},
        driver: {type: Number, default: 0},
        municipality: {type: Number, default: 0},
        tax: {type: Number, default: 0},
      },
    },
    subscriptionAgent: {
      share: {
        admin: {type: Number, default: 0},
        superAgent: {type: Number, default: 0},
        tax: {type: Number, default: 0},
        municipality: {type: Number, default: 0},
      },
      cycle: {type: Number, default: 0},
    },
  },
  {timestamps: true}
);
financialGroupSchoolModel.plugin(mongoosePaginate);
module.exports = mongoose.model("FinancialGroupSchool", financialGroupSchoolModel);
