const mongoose=require("mongoose");


const industrySchema=new mongoose.Schema({
    industry:{
        type:String,
        required:true,
    },
    business_logo:{
        type:String,
        default:null,
    },
addresLogo:{
        type:String,
        default:null,
    },
    businessName:{
        type:String,
        required:true,
        unique:true
    },
bussinesEmail:{
        type:String,
default:null,    },
    registrationNo:{
        type:String,
        required:true,
    },
    taxId:{
        type:String,
        default:null,
    },
    address:{
        type:String,
        default:null,
    },
    startDate:{
        type:Date,
        default:null,
    },
    city:{
        type:String,
        required:true
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users",
        required:true,
    }

},{timestamps:true});

const industryModel=mongoose.model("IndustryModel",industrySchema);

module.exports=industryModel;