const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema(
  {
    quotation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unit_price: {
      type: Number,
      required: true,
    },

    discount_percent: {
      type: Number,
      default: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT FIX
    |--------------------------------------------------------------------------
    | Ye pehle missing tha. Isi wajah se item discount ka amount/percent record
    | view, edit aur audit trail me properly maintain nahi ho raha tha.
    */
    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },

    total: {
      type: Number,
      required: true,
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
*/
quotationItemSchema.index({ quotation_id: 1, createdAt: 1 });
quotationItemSchema.index({ quotation_id: 1, product_id: 1 });
quotationItemSchema.index({ quotation_id: 1, category_id: 1 });

module.exports = mongoose.model("QuotationItem", quotationItemSchema);