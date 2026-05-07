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
addressLogo:{
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

created_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "UserModel",
  required: true
},

updated_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "UserModel",
  default: null
}
},{timestamps:true});

const industryModel=mongoose.model("IndustryModel",industrySchema);

module.exports=industryModel;