const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subcategory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      default: null,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryModel",
      required: true,
      index: true,
    },

    image: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
    },

    mrp: {
      type: Number,
      required: true,
    },

    discount_percent: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      default: null,
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },

    order_no: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/*
|-----------------------------------------
| QUERY OPTIMIZATION INDEXES
|-----------------------------------------
*/
productSchema.index({ businessId: 1, sku: 1 }, { unique: true });
productSchema.index({ businessId: 1, category_id: 1, is_active: 1, createdAt: -1 });
productSchema.index({ businessId: 1, is_active: 1, createdAt: -1 });
productSchema.index({ businessId: 1, name: 1 });
productSchema.index({ category_id: 1, is_active: 1, name: 1 });

module.exports = mongoose.model("Product", productSchema);