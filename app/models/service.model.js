const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

/**
 * @typedef Service
 * @property {Date} expire - Expiry date
 * @property {Date} approve.companyApprove.approvedDate - Date of company approval
 * @property {Date} approve.parrentApprove.approvedDate - Date of parent approval
 * @property {Date} approve.superAgentApprove.approvedDate - Date of super agent approval
 * @property {number} cycle - The cycle number (default: 30)
 * @property {number} price - Price number
 * @property {string} field - Field information
 * @property {string} gender - Gender information
 * @property {string} status - Status information
 * @property {string} statusInService - Status information in service
 * @property {Object} approve - Approval details
 * @property {Object} approve.companyApprove - Company approval details
 * @property {Object} approve.parrentApprove - Parent approval details
 * @property {Object} approve.superAgentApprove - Super agent approval details
 * @property {boolean} hasFactor - Indicates whether there is a factor (default: false)
 * @property {boolean} approve.companyApprove.isApprroved - Indicates if company approval is given (default: false)
 * @property {boolean} approve.parrentApprove.isApprroved - Indicates if parent approval is given (default: false)
 * @property {boolean} approve.superAgentApprove.isApprroved - Indicates if super agent approval is given (default: false)
 * @property {mongoose.Schema.Types.ObjectId} city - City's ID referencing the "ProvinceSchool" collection
 * @property {mongoose.Schema.Types.ObjectId} parent - Parent's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} school - School's ID referencing the "School" collection
 * @property {mongoose.Schema.Types.ObjectId} driver - Driver's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} student - Student's ID referencing the "Student" collection
 * @property {mongoose.Schema.Types.ObjectId} company - Company's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} province - Province's ID referencing the "ProvinceSchool" collection
 * @property {mongoose.Schema.Types.ObjectId} createdBy - Created by user's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} updatedBy - Updated by user's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} superAgent - Super agent's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} secondParent - Second parent's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} municipality - Municipality's ID referencing the "User" collection
 * @property {mongoose.Schema.Types.ObjectId} financialGroupSchool - Financial group school's ID referencing the "FinancialGroupSchool" collection
 * @property {mongoose.Schema.Types.ObjectId[]} absents - Array of absents' IDs referencing the "Absent" collection
 */

const Service = new mongoose.Schema(
  {
    cycle: {type: Number, default: 30},
    parent: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    secondParent: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    school: {type: mongoose.Schema.Types.ObjectId, ref: "School"},
    driver: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    student: {type: mongoose.Schema.Types.ObjectId, ref: "Student"},
    company: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    superAgent: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    municipality: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    absents: [{type: mongoose.Schema.Types.ObjectId, ref: "Absent"}],

    financialGroupSchool: {type: mongoose.Schema.Types.ObjectId, ref: "FinancialGroupSchool"},
    city: {type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool"},
    province: {type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool"},
    price: {type: Number},
    hasFactor: {type: Boolean, default: false},
    gender: {type: String},
    field: {type: String},
    approve: {
      superAgentApprove: {
        isApprroved: {type: Boolean, default: false},
        approvedDate: {type: Date},
      },
      companyApprove: {
        isApprroved: {type: Boolean, default: false},
        approvedDate: {type: Date},
      },
      parrentApprove: {
        isApprroved: {type: Boolean, default: false},
        approvedDate: {type: Date},
      },
    },
    status: {
      type: String,
      enum: ["PARENT_CREATED", "COMPANY_REJECTED", "PARENT_REJECTED", "COPANY_ACCEPTED", "EXPIRED", "PROGRESSING", "COMPANY_REJECTED"],
    },
    statusInService: {
      type: String,
      enum: [
        "WITHOUT_SERVICE",
        "DRIVER_START_SERVICE",
        "DRIVER_ARIVED_STUDENT_HOME",
        "STUDENT_PICKEDUP_FROM_HOME",
        "STUDENT_AT_SCHOOL",
        "DRIVER_START_PICKUP_STUDENT_FROM_SCHOOL",
        "STUDENT_PICKEDUP_FROM_SCHOOL",
        "STUDENT_ARIVED_STUDENT_HOME",
        "STUDENT_ABSENT",
        "DRIVER_ABSENT",
      ],
      default: "WITHOUT_SERVICE",
    },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    expire: {type: Date},
  },
  {timestamps: true, versionKey: false}
);
Service.plugin(mongoosePaginate);
module.exports = mongoose.model("Service", Service);
