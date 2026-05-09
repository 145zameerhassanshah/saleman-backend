const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
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
  unit_price: {
    type: Number,
    required: true,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  discount_percent: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports=mongoose.model("OrderItem",invoiceItemSchema);