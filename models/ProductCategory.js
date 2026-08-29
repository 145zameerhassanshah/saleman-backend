// const mongoose=require("mongoose");


// const categorySchema=new mongoose.Schema({
//     name:{
//         type:String,
//         required:true
//     },
//     businessId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "IndustryModel" ,
//       default:null
//     },
    
//     order_no:{
//         type:Number,
//         default:null
//     },
//     is_active:{
//         type:Boolean,
//         default:true,
//     }

// },{timestamps:true});

// const productCategory=mongoose.model("Category",categorySchema);

// module.exports=productCategory;


const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryModel",
      required: true,
      index: true,
    },

    order_no: {
      type: Number,
      default: 0,
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index(
  { businessId: 1, name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);

categorySchema.index({ businessId: 1, is_active: 1, createdAt: -1 });
categorySchema.index({ businessId: 1, order_no: 1, createdAt: -1 });
categorySchema.index({ businessId: 1, createdAt: -1 });

const productCategory =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

module.exports = productCategory;