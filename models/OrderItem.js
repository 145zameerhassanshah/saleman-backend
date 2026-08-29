const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },

    item_name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: null,
    },

    unit_price: {
      type: Number,
      required: true,
      default: 0,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
    },

    discount_percent: {
      type: Number,
      default: 0,
    },

    discount_type: {
      type: String,
      enum: ["amount", "percent"],
      default: "percent",
    },

    total: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

orderItemSchema.index({ order_id: 1, createdAt: 1 });
orderItemSchema.index({ order_id: 1, product_id: 1 });
orderItemSchema.index({ order_id: 1, category_id: 1 });
orderItemSchema.index({ category_id: 1, product_id: 1 });

module.exports =
  mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);