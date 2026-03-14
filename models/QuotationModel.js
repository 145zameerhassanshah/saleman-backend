const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema({

  quotation_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  dealer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dealer",
    required: true
  },

  quotation_date: {
    type: Date,
    required: true
  },

  valid_until: {
    type: Date,
    default: null
  },

  subtotal: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  },

  tax: {
    type: Number,
    default: 0
  },

  discount_type: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "fixed"
  },

  tax_type: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "fixed"
  },

  total: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["draft", "sent", "accepted", "rejected"],
    default: "draft"
  },

  notes: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Quotation", quotationSchema);