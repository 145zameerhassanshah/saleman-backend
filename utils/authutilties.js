const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


/* ================================
   PASSWORD HASH
================================ */

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};


/* ================================
   PASSWORD COMPARE
================================ */

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};


/* ================================
   GENERATE JWT TOKEN
================================ */

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.user_type,
      industry: user.industry
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};


/* ================================
   VERIFY / DECODE TOKEN
================================ */

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};


/* ================================
   EMAIL VERIFICATION TOKEN
================================ */

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};


/* ================================
   PASSWORD RESET TOKEN
================================ */

const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};


module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateVerificationToken,
  generateResetToken
};