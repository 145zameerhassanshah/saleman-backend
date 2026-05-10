const mongoose = require("mongoose");

const industrySchema = new mongoose.Schema(
  {
    industry: {
      type: String,
      required: true,
      trim: true,
    },

    business_logo: {
      type: String,
      default: null,
    },

    addressLogo: {
      type: String,
      default: null,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    bussinesEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    registrationNo: {
      type: String,
      required: true,
      trim: true,
    },

    taxId: {
      type: String,
      default: null,
      trim: true,
    },

    address: {
      type: String,
      default: null,
    },

    startDate: {
      type: Date,
      default: null,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },
  },
  { timestamps: true }
);

/* QUERY OPTIMIZATION INDEXES */
industrySchema.index({ businessName: 1 }, { unique: true });
industrySchema.index({ registrationNo: 1 });
industrySchema.index({ bussinesEmail: 1 }, { sparse: true });
industrySchema.index({ city: 1 });
industrySchema.index({ is_active: 1 });
industrySchema.index({ createdAt: -1 });

industrySchema.index({
  industry: "text",
  businessName: "text",
  registrationNo: "text",
  bussinesEmail: "text",
  city: "text",
});

module.exports = mongoose.model("IndustryModel", industrySchema);