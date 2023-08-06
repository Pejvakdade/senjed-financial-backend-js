const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")

const Service = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    secondParent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    superAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    absents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Absent" }],

    schoolFinancialGroup: { type: mongoose.Schema.Types.ObjectId, ref: "FinancialGroupSchool" },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool" },
    province: { type: mongoose.Schema.Types.ObjectId, ref: "ProvinceSchool" },
    price: { type: Number },
    gender: { type: String },
    field: { type: String },
    grade: { type: String },
    approve: {
      superAgentApprove: {
        isApprroved: { type: Boolean, default: false },
        approvedDate: { type: Date },
      },
      companyApprove: {
        isApprroved: { type: Boolean, default: false },
        approvedDate: { type: Date },
      },
      parrentApprove: {
        isApprroved: { type: Boolean, default: false },
        approvedDate: { type: Date },
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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expire: { type: Date },
    blocks: [
      {
        reason: { type: Number },
        description: { type: String },
        blocker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        blockerUserType: { type: String },
        blockDate: { type: Date },
        userType: { type: String },
        managerComment: { type: String },
      },
    ],
  },
  { timestamps: true, versionKey: false }
)
Service.plugin(mongoosePaginate)
module.exports = mongoose.model("Service", Service)
