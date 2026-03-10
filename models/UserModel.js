const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  profile_image: {
    type: String,
    default: null
  },

  email: {
    type: String,
    required: true,
    unique: true
  },
  phone_number: {
    type: String,
    null: true,
    unique: true
  },
  whatsapp_number: {
    type: String,
    required: true,
    unique: true
  },
  city: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  
  user_type: {
    type: String,
    enum: ["super_admin","admin","salesman","dispatcher","accountant"],
    default: "admin"
  },

  password: {
    type: String,
    required: true
  },

    status: {
    type: String,
    enum: ["active","pending","dispatched","posted","partial","cancelled"],
    default: "pending"
  },


  email_verified_at: {
    type: Date,
    default: null
  }

},
{
  timestamps: true
}
);

module.exports = mongoose.model("UserModel", userSchema);