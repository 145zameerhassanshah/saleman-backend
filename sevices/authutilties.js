const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userModel=require('../models/UserModel');


class AuthService{
/* ================================
   PASSWORD HASH
================================ */

async hashPassword(password){
  return await bcrypt.hash(password, 10);
};

  generateOTP(){
    return Math.floor(100000 + Math.random()*9000000).toString();
  }

/* ================================
   PASSWORD COMPARE
================================ */

async comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
};

async findUser(email){
  return await userModel.findOne({email});
}


/* ================================
   GENERATE JWT TOKEN
================================ */

generateToken (user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.user_type,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY
    }
  );
};


/* ================================
   VERIFY / DECODE TOKEN
================================ */

verifyToken (token) {
  return jwt.verify(token, process.env.JWT_SECRET);
};


/* ================================
   EMAIL VERIFICATION TOKEN
================================ */

generateVerificationToken (){
  return crypto.randomBytes(32).toString("hex");
};


/* ================================
   PASSWORD RESET TOKEN
================================ */

generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
};
}


module.exports = new AuthService();