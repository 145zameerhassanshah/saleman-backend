const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema({

  quotation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quotation",
    required: true
  },
   category_id: {
    type: mongoose.Schema.Types.ObjectId,  // ✅ ADD THIS
    ref: "Category",
    default: null
  },

  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null
  },

  item_name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: null
  },

  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  unit_price: {
    type: Number,
    required: true
  },

  discount_percent: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    required: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("QuotationItem", quotationItemSchema);