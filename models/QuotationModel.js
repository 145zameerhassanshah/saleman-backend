const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryModel",
      required: true,
      index: true, 
    },

    quotation_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, 
    },

    dealer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      default: null,
      index: true, 
    },
    dealer_name: {
      type: String,
      trim: true,
      default: null,
    },

    quotation_date: {
      type: Date,
      default: Date.now,
    },

    valid_until: {
      type: Date,
      default: null,
      index: true, 
    },

    subtotal: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "fixed",
    },

    tax_type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "fixed",
    },

    total: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true, 
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },

    notes: {
      type: String,
      default: null,
    },

    deliveryNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| QUERY OPTIMIZATION INDEXES
|--------------------------------------------------------------------------
| Ye indexes showAll, search, status filter, role filter aur latest sorting ke liye hain.
*/
quotationSchema.index({ businessId: 1, status: 1, createdAt: -1 });
quotationSchema.index({ businessId: 1, created_by: 1, createdAt: -1 });
quotationSchema.index({ businessId: 1, dealer_id: 1, createdAt: -1 });
quotationSchema.index({ businessId: 1, quotation_number: 1 });
quotationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Quotation", quotationSchema);
