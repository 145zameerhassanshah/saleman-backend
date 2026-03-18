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
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IndustryModel",
    default:null
  },
image:{
      type: String,
      required:true
},
  name:{
    type:String
  },

  sku:{
    type:String,
    unique:true,
    required:true
  },

  mrp:{
    type:Number,
    required:true
  },
businessId:{
  type: mongoose.Schema.Types.ObjectId,
  ref: "IndustryModel",
  default:null
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