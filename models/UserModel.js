
const mongoose = require("mongoose");
const USER_ROLES = require("./userEnum");

const userSchema = new mongoose.Schema(
  {
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryModel",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    profile_image: {
      type: String,
      default: null,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpiry: {
      type: Date,
      default: null,
    },

    phone_number: {
      type: String,
      default: null,
      index: true,
    },

    city: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    user_type: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
      index: true,
    },

    territory: {
      type: String,
      default: null,
    },

    designation: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      required: true,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpiry: {
      type: Number,
      default: null,
    },

    email_verified_at: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Left"],
      default: "Active",
      index: true,
    },

    email_verification_token: {
      type: String,
      default: null,
    },

    blocked_until: {
      type: Date,
      default: null,
    },

    block_reason: {
      type: String,
      default: null,
    },

    reject_reason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/* QUERY OPTIMIZATION */
userSchema.index({ industry: 1, user_type: 1, status: 1, createdAt: -1 });
userSchema.index({ industry: 1, name: 1 });
userSchema.index({ industry: 1, email: 1 });
userSchema.index({ industry: 1, phone_number: 1 });
userSchema.index({ industry: 1, createdAt: -1 });

module.exports =
  mongoose.models.UserModel || mongoose.model("UserModel", userSchema);