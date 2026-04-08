const mongoose = require("mongoose");

const DealerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IndustryModel",
    default: null
  },

  phone_number: {
    type: String,
    required: true,
    unique: true
  },

  whatsapp_number: {
    type: String,
    required: true,
    unique: true
  },

  company_name: {
    type: String,
    required: true
  },

  business_logo: String,

  billing_address: String,
  shipping_address: String,
  city: String,
  country: String,

  is_active: {
    type: Boolean,
    default: true
  },

  /* 🔥 CORE LOGIC */

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true
  },

assigned_to: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "UserModel",
  required: true
},
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  rejectReason: {
    type: String,
    default: ""
  },

  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    default: null
  },

  assignment_history: [
    {
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
        default: null
      },
      to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel"
      },
      changed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel"
      },
      date: {
        type: Date,
        default: Date.now
      },
      note: String
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Dealer", DealerSchema);