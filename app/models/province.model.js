const mongoose = require("mongoose")

const provinceSchoolSchema = new mongoose.Schema(
  {
    Code: { type: Number },
    Name: { type: String },
    Level: { type: Number },
    IsCapital: { type: Boolean },
    Population: { type: Number },
    CityCode: { type: Number },
    CityName: { type: String },
    ProvinceCode: { type: Number },
    ProvinceName: { type: String },
    CountryCode: { type: Number },
    CountryName: { type: String },
    SectionCode: { type: Number },
    SectionName: { type: String },
    TownCode: { type: Number },
    TownName: { type: String },
  },
  { timestamps: false, versionKey: false }
)

module.exports = mongoose.model("ProvinceSchool", provinceSchoolSchema)
