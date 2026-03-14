const userModel = require("../models/UserModel");
const AuthService=require("../sevices/authutilties");

async function super_admin_seed(){
    const hashPassword=await AuthService.hashPassword("Admin@123");
    const superAdmin={
    name:"Sohaib",
    email:"sohaib123@gmail.com",
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

module.exports={super_admin_seed};