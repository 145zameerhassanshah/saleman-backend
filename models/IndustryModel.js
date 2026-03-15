const mongoose=require("mongoose");


const industrySchema=new mongoose.Schema({
    industry:{
        type:String,
        required:true,
    },
    logo:{
        type:String,
        default:null,
    },
    businessName:{
        type:String,
        required:true,
        unique:true
    },

    registrationNo:{
        type:String,
        required:true,
    },
    taxId:{
        type:String,
        default:null,
    },
    addrss:{
        type:String,
        required:true,
    },
    startDate:{
        type:Date,
        default:null,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users",
        required:true,
    }

},{timestamps:true});

const industryModel=mongoose.model("IndustryModel",industrySchema);

module.exports=industryModel;