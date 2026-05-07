// const mongoose = require("mongoose");

// const orderItemSchema = new mongoose.Schema(
//   {
//     order_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Order",
//       required: true,
//       index: true,
//     },

//     category_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       default: null,
//       index: true,
//     },

//     product_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       default: null,
//       index: true,
//     },

//     item_name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     description: {
//       type: String,
//       default: null,
//     },

//     unit_price: {
//       type: Number,
//       required: true,
//       default: 0,
//     },

//     quantity: {
//       type: Number,
//       required: true,
//       default: 1,
//     },

//     discount_percent: {
//       type: Number,
//       default: 0,
//     },

//     // ✅ IMPORTANT FIX
//     // Controller calculation me discount_type use ho raha tha,
//     // lekin schema me save nahi ho raha tha.
//     discount_type: {
//       type: String,
//       enum: ["amount", "percent"],
//       default: "percent",
//     },

//     total: {
//       type: Number,
//       default: 0,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /*
// |--------------------------------------------------------------------------
// | ✅ QUERY OPTIMIZATION INDEXES
// |--------------------------------------------------------------------------
// */
// orderItemSchema.index({ order_id: 1, createdAt: 1 });
// orderItemSchema.index({ order_id: 1, product_id: 1 });
// orderItemSchema.index({ order_id: 1, category_id: 1 });
// orderItemSchema.index({ category_id: 1, product_id: 1 });

// module.exports = mongoose.model("OrderItem", orderItemSchema);


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

created_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "UserModel",
  required: true
},

updated_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "UserModel",
  default: null
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