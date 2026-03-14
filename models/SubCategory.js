const mongoose=require("mongoose");


const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    parentCategory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product_categories",
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

const subCategory=mongoose.model("SubCategory",categorySchema);

module.exports=subCategory;