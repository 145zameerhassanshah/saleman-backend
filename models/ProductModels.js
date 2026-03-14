const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

  category_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  subcategory_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    default: null
  },

  name:{
    type:String
  },

  code:{
    type:String,
    unique:true
  },

  mrp:{
    type:Number,
    required:true
  },

  discount_percent:{
    type:Number,
    default:0
  },

  description:{
    type:String
  },

  is_active:{
    type:Boolean,
    default:true
  },

  order_no:{
    type:Number,
    default:0
  }

},{timestamps:true});

module.exports = mongoose.model("Product",productSchema);