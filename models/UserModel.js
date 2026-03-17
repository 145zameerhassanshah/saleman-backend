const mongoose = require("mongoose");
const USER_ROLES=require("./userEnum");

const userSchema = new mongoose.Schema({
businessId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "IndustryModel" ,
  default:null
},
  name: {
    type: String,
    required: true,
    trim: true
  },

  profile_image: {
    type: String,
    default: null
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone_number: {
    type: String,
    default: null
  },

  whatsapp_number: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  user_type: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true
  },

  password: {
    type: String,
    required: true
  },

  otp:{
    type:String,
    default:null
  },

  otpExpiry:{
    type:Number,
    default:null
  },
  email_verified_at: {
    type: Date,
    default: null
  },
  status:{
    type:String,
    enum:["Active","Left"],
    default:"Active"
  },

  email_verification_token: {
    type: String,
    default: null
  },

  blocked_until: {
    type: Date,
    default: null
  },

  block_reason: {
    type: String,
    default: null
  },

  reject_reason: {
    type: String,
    default: null
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("UserModel", userSchema);