const userModel = require("../models/UserModel");
const industryModel = require("../models/IndustryModel");
const AuthService=require("../sevices/authutilties");

async function super_admin_seed(){
    const hashPassword=await AuthService.hashPassword("Admin@123");
    const superAdmin={
    name:"Sohaib",
    email:"zameerhassanshah69@gmail.com",
    phone_number:"03060624288",
    whatsapp_number:"03060624288",
    city:"Gujranwala",
    address:"Wapda Town, House 421",
    user_type:"super_admin",
    password:hashPassword
};
    const super_admin=await new userModel(superAdmin);
    if(!super_admin) return false;
    await super_admin.save();

    return true;
}

async function admin_seed() {
  try {

    const existing = await userModel.findOne({
      email: "zameerhassanshah69@gmail.com"
    });

    if (existing) {
      console.log("Admin already exists");
      return true;
    }

    const business = await industryModel.findOne({
      businessName: "ABC Pvt Ltd" 
    });

    if (!business) {
      console.log("Business not found, create business first");
      return false;
    }

    const hashPassword = await AuthService.hashPassword("Admin@123");

    const admin = new userModel({
      name: "Admin User",
      email: "zameerhassanshah69@gmail.com",
      phone_number: "03001234567",
      whatsapp_number: "03001234567",
      city: "Lahore",
      address: "Johar Town",
      user_type: "admin",
      password: hashPassword,
      businessId: business._id 
    });

    await admin.save();

    console.log("Admin created with businessId");

    return true;

  } catch (error) {
    console.error("Admin seed error:", error);
    return false;
  }
}
module.exports = { super_admin_seed, admin_seed };
