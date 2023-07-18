const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const moment = require('moment')

const userSchema = new mongoose.Schema(
  {
    userTypes: [{ type: String }],
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phoneNumber: { type: String, required: true },
    subLogin: { type: String },
    balance: { type: Number, default: 0 },
    currency: { type: String },
    language: { type: String },
    avatar: { type: String },
    countryCode: { type: String },
    tokens: [{ token: { type: String }, userType: { type: String }, ip: { type: String }, date: { type: Date } }],
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String },
    financial: {
      shabaNumber: { type: String },
      kartNumber: { type: String }
    },

    blocks: [
      {
        reason: { type: Number },
        description: { type: String },
        blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        blockerUserType: { type: String },
        blockDate: { type: Date },
        userType: { type: String },
        managerComment: { type: String },
        changed: [{ type: String }]
      }
    ],

    driverInformation: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vin: { type: String },
      pushId: { type: String },
      subscriptionCount: { type: String },
      insuranceNumber: { type: String },
      insuranceExpiryDate: { type: String },
      carModel: { type: String },
      nationalCode: { type: String },
      debt: [
        {
          debtorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          reason: { type: String },
          payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          payerType: { type: String },
          receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          receiverType: { type: String },
          amount: { type: Number },
          travelCode: { type: String },
          date: { type: Date }
        }
      ],
      carBrand: { type: String },
      carColor: { type: String },
      carSystem: { type: String },

      travelGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelGroup' },
      uniqueCodeThirdPartyInsurance: { type: String },
      plateNumber: {
        twoDigit: { type: Number },
        letter: { type: String },
        threeDigit: { type: Number },
        iran: { type: Number }
      },
      motorPlateNumber: {
        fiveDigit: { type: Number },
        threeDigit: { type: Number },
        letter: { type: String }
      },
      isCompleteRegistration: { type: Boolean, default: false },
      agentCode: { type: String },
      agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      company: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date },
      agentName: { type: String },
      superAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      city: { type: String },
      province: { type: String },
      townCode: { type: String },
      address: { type: String },
      driverLicenseNumber: { type: String },
      status: {
        type: String,
        enum: ['NO_SERVICE', 'REACHING_TO_PASSENGER', 'IN_SERVICE'],
        default: 'NO_SERVICE'
      },
      isOnline: { type: Boolean, default: false },
      driverApp: { type: Boolean, default: false },
      approved: {
        isApproved: { type: Boolean, default: false },
        isApprovedByAgent: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date }
      },
      comments: [
        {
          rate: { type: Number },
          text: { type: String },
          travelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Travel'
          },
          deliveryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Delivery'
          },
          passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          date: { type: Date }
        }
      ],
      averageRate: { type: Number },
      before7DaySms: { type: Boolean, default: false },
      before1DaySms: { type: Boolean, default: false },
      subscriptionExpireAt: { type: Date, default: moment().add(1, 'm').format() },
      createdAt: { type: Date },
      documents: [
        {
          name: { type: String },
          link: { type: String },
          uploadBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          uploadDate: { type: Date }
        }
      ],
      logDocuments: [
        {
          name: { type: String },
          link: { type: String },
          uploadBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          uploadDate: { type: Date }
        }
      ],
      type: { type: String, enum: ['AGENCY', 'DELIVERY', 'VIP', 'WOMEN', 'TAXI_BISIM'] },
      deliveryType: { type: String, enum: ['COLD', 'HOT'] }
    },

    schoolDriverInformation: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      financialGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinancialGroup'
      },
      isCompleteRegistration: { type: Boolean, default: false },
      company: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date },
      companyName: { type: String },
      marital: { type: String },
      superAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      city: { type: String },
      province: { type: String },
      address: { type: String },
      inApp: { type: Boolean, default: false },
      approved: {
        isApproved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date }
      },
      averageRate: { type: Number },
      createdAt: { type: Date }
    },

    passengerInformation: {
      approved: {
        isApproved: { type: Boolean },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date }
      },
      pushId: { type: String },
      isCompleteRegistration: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['NO_SERVICE', 'IN_SERVICE'],
        default: 'NO_SERVICE'
      },
      city: { type: String },
      province: { type: String },
      townCode: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
      type: { type: String },
      ip: { type: String },
      link: { type: String },
      lat: { type: String },
      lng: { type: String },
      api: { type: Boolean, default: false },
      openTimes: {
        saturday: {
          openHour: { type: Number },
          closeHour: { type: Number },
          open: { type: Boolean }
        },
        sunday: {
          openHour: { type: Number },
          closeHour: { type: Number },
          open: { type: Boolean }
        },
        monday: {
          openHour: { type: Number },
          closeHour: { type: Number },
          open: { type: Boolean }
        },
        tuesday: {
          openHour: { type: Number },
          closeHour: { type: Number },
          open: { type: Boolean }
        },
        wednesday: {
          openHour: { type: Number },
          closeHour: { type: Number },
          open: { type: Boolean }
        },
        thursday: {
          openHour: { type: Number },
          closeHour: { type: Number },
          open: { type: Boolean }
        },
        friday: {
          openHour: { type: Number },
          closeHour: { type: Number },
          open: { type: Boolean }
        }
      }
    },

    parentInformation: {
      isCompleteRegistration: { type: Boolean, default: false },
      inApp: { type: Boolean, default: false },
      city: { type: String },
      province: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
      updatedAt: { type: Date },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      childrens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
    },
    agentInformation: {
      pushId: { type: String },
      code: { type: String },
      agentName: { type: String },
      type: { type: String },
      superAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nationalCode: { type: String },
      averageRate: { type: Number },
      financialGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinancialGroup'
      },
      travelGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelGroup' },
      city: { type: String },
      province: { type: String },
      address: { type: String },
      townCode: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date },
      approved: {
        isApproved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date }
      }
    },

    companyInformation: {
      pushId: { type: String },
      companyName: { type: String },
      superAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nationalCode: { type: String },
      averageRate: { type: Number },
      financialGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinancialGroup'
      },
      city: { type: String },
      province: { type: String },
      address: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date },
      approved: {
        isApproved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date }
      }
    },

    superAgentInformation: {
      superAgentName: { type: String },
      averageRate: { type: Number },
      approved: {
        isApproved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date }
      },
      code: { type: String },
      nationalCode: { type: String },
      financialGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinancialGroup'
      },
      travelGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelGroup' },
      city: { type: String },
      province: { type: String },
      address: { type: String },
      townCode: { type: String },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date }
    },

    addressInformation: [
      {
        city: { type: String },
        address: { type: String },
        province: { type: String },
        TownCode: { type: Number }
      }
    ],

    favoriteAddresses: [
      {
        city: { type: String },
        address: { type: String },
        province: { type: String },
        name: String,
        lng: String,
        lat: String
      }
    ],

    favoriteTravels: [
      {
        source: {
          city: { type: String },
          address: { type: String },
          province: { type: String },
          name: String,
          lng: String,
          lat: String
        },
        destination: {
          city: { type: String },
          address: { type: String },
          province: { type: String },
          name: String,
          lng: String,
          lat: String
        }
      }
    ]
  },
  { timestamps: true }
)

userSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('User', userSchema)
