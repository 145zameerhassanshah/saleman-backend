const mongoose= require('mongoose');
const DealerSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone_number:{

        type:String,
        required:true,
        unique:true
    },
    whatsapp_number:{
        type:String,
        required:true,
        unique:true
    },
    company_name:{
        type:String,
        required:true

    },
      business_logo:{
    type:String
  },

  billing_address:{
    type:String
  },

  shipping_address:{
    type:String
  },

  city:{
    type:String
  },

  country:{
    type:String
  },

  created_by:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"admin,super_admin",
    required:true
  }

},{timestamps:true});

    

