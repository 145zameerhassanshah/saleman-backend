const mongoose = require("mongoose");

const INVOICE_STATUS = {
  DRAFT: "draft",
  UNPAID: "unpaid",
  PARTIAL: "partially_paid",
  PAID: "paid",
  CANCELLED: "cancelled"
};

const invoiceSchema = new mongoose.Schema({

  order_number: {
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
  order_date: {
    type: Date,
    required: true
  },

  due_date: {
    type: Date,
    default: null
  },

  subtotal: {
    type: Number,
    default: 0
  },

  tax: {
    type: Number,
    default: 0
  },

  tax_type: {
    type: String,
    enum: ["amount", "percent"],
    default: "amount"
  },

  discount_type: {
    type: String,
    enum: ["amount", "percent"],
    default: "amount"
  },

  discount: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    default: 0
  },

  total_paid: {
    type: Number,
    default: 0
  },

  remaining_balance: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: Object.values(INVOICE_STATUS),
    default: INVOICE_STATUS.DRAFT
  },

  notes: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

module.exports=mongoose.model("Order",invoiceSchema);