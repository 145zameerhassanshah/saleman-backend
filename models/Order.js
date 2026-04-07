const mongoose = require("mongoose");

const ORDER_STATUS = {
  PENDING:"pending",
  UNPAID: "unpaid",
  UNAPPROVED:"unapproved",
  APPROVED:"approved",
  ACTIVE:"active",
  PARTIAL: "partial",
  PAID: "paid",
  POSTED:"posted",
  REJECTED:"rejected",
  DISPATCHED:"dispatched"
};

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IndustryModel" ,
    required:true
  },
payment_term: {
    type: String,
    enum: ["advance", "cash", "periodical"],
    default: "cash"

  },
  dealer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dealer",
    required: true
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"UserModel",
    required:true
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

  updatedBy:{
     type:mongoose.Schema.Types.ObjectId,
    ref:"UserModel",
    default:null
  },

  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.UNAPPROVED
  },

  notes: {
    type: String,
    default: null
  },
  deliveryNotes:{
    type:String,
    default:null
  },
  rejectReason:{
    type:String,
    default:null
  }

}, {
  timestamps: true
});

module.exports=mongoose.model("Order",orderSchema);