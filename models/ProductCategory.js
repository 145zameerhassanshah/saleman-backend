const mongoose=require("mongoose");


const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryModel" ,
      default:null
    },
    
    order_no:{
        type:Number,
        default:null
    },
    is_active:{
        type:Boolean,
        default:true,
    }

},{timestamps:true});

const productCategory=mongoose.model("Category",categorySchema);

module.exports=productCategory;



// const mongoose=require("mongoose");


// const categorySchema=new mongoose.Schema({
//     name:{
//         type:String,
//         required:true
//     },
//     order_no:{
//         type:Number,
//         default:null
//     },
//     is_active:{
//         type:Boolean,
//         default:true,
//     },
//   businessId:{
//     type: Schema.Types.ObjectId,
//     ref: "IndustryModel",
//     required:true
//   }
// },{timestamps:true});

// const productCategory=mongoose.model("Category",categorySchema);

// module.exports=productCategory;