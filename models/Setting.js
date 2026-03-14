const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({

  company_logo: {
    type: String,
    default: null
  },

  contact_logo: {
    type: String,
    default: null
  },

  phone_no: {
    type: String,
    default: null
  },

  company_email: {
    type: String,
    default: null
  },

  company_address: {
    type: String,
    default: null
  },

  notes: {
    type: String,
    default: null
  },

  company_name: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Setting", settingSchema);