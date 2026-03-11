const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  industry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IndustryModel",
    default: null
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
    enum: ["super_admin", "admin", "salesman", "dispatcher", "accountant"],
    required: true
  },

  password: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: [
      "pending",
      "active",
      "inactive",
      "rejected",
      "temp_blocked",
      "permanent_blocked"
    ],
    default: "pending"
  },

  email_verified_at: {
    type: Date,
    default: null
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

  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("UserModel", userSchema);