const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const mongooseAggregate = require('mongoose-aggregate-paginate-v2')
const Schema = mongoose.Schema

const Student = new Schema(
  {
    avatar: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'User' },
    secondParent: { type: Schema.Types.ObjectId, ref: 'User' },
    gender: { type: String },
    nationalCode: { type: String },
    nationality: { type: String },
    disability: { type: Boolean },
    province: { type: String },
    city: { type: String },
    state: { type: String },
    lat: { type: String },
    lng: { type: String },
    school: { type: Schema.Types.ObjectId, ref: 'School' },
    grade: { type: String },
    sanadCode: { type: String },
    birthDate: { type: Date },
    timing: {
      saturday: {
        close: { type: Boolean },
        entranceTime: { type: Date },
        departTime: { type: Date },
        pickupTime: { type: Date }
      },
      sunday: {
        close: { type: Boolean },
        entranceTime: { type: Date },
        departTime: { type: Date },
        pickupTime: { type: Date }
      },
      monday: {
        close: { type: Boolean },
        entranceTime: { type: Date },
        departTime: { type: Date },
        pickupTime: { type: Date }
      },
      tuesday: {
        close: { type: Boolean },
        entranceTime: { type: Date },
        departTime: { type: Date },
        pickupTime: { type: Date }
      },
      wednesday: {
        close: { type: Boolean },
        entranceTime: { type: Date },
        departTime: { type: Date },
        pickupTime: { type: Date }
      },
      thursday: {
        close: { type: Boolean },
        entranceTime: { type: Date },
        departTime: { type: Date },
        pickupTime: { type: Date }
      },
      friday: {
        close: { type: Boolean },
        entranceTime: { type: Date },
        departTime: { type: Date },
        pickupTime: { type: Date }
      }
    },
    absentTime: [{ shift: { type: String, enum: ['FULL', 'NOON', 'MORNING'] }, date: { type: Date } }],
    approved: {
      isApproved: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date }
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date }
  },
  { timestamps: true, versionKey: false }
)
Student.plugin(mongoosePaginate)
Student.plugin(mongooseAggregate)
module.exports = mongoose.model('Student', Student)
