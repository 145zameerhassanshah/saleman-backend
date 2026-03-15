const AuthService = require("../sevices/authutilties");
const userModel = require("../models/UserModel");
const { sendEmail } = require("../utils/email");


async function createUser(req, res) {

    const { email, phone_number, whatsapp_number } = req.body;

    /* CHECK EMAIL */

    const emailExist = await userModel.findOne({ email });

    if (emailExist) {
      return res.status(400).json({
        message: "User with similar email already exists"
      });
    }

    /* CHECK PHONE OR WHATSAPP */

    const phoneExist = await userModel.findOne({
      $or: [
        { phone_number },
        { whatsapp_number }
      ]
    });

    if (phoneExist) {
      return res.status(400).json({
        message: "User with same phone number already exists"
      });
    }

    /* CREATE USER */

   const hashPassword = await AuthService.hashPassword(req.body.password);

const newUser = new userModel({
  ...req.body,
  password: hashPassword
});

    await newUser.save();
    let user = newUser.toObject();

/* REMOVE PASSWORD */
delete user.password;

/* REMOVE NULL VALUES */
Object.keys(user).forEach((key) => {
  if (user[key] === null || user[key] === undefined) {
    delete user[key];
  }
});

    return res.status(201).json({
      success: true,
      message: `${req.body.user_type} created successfully`,
      user
    });
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const isUser = await AuthService.findUser(email);

    if (!isUser) {
      return res.status(400).json({ message: "Incorrect email" });
    }

    const comparePassword = await AuthService.comparePassword(
      password,
      isUser.password
    );

    if (!comparePassword) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    const token = AuthService.generateToken(isUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict",
      maxAge: 20 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: isUser._id,
        email: isUser.email,
        role: isUser.user_type,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Try again later",
    });
  }
}

  async function getLoggedInUser(req, res) {
    try {
      const user = req.user;
      const loggedInUser = await userModel
        .findById(user.id )
        .select(
          "-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason reject_reason -approved_by",
        );
      return res
        .status(200)
        .json({ loggedInUser, message: "User Retrieved Successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Something went wrong. Try again later." });
    }
  }

  async function forgotPassword(req,res){
    const {email}=req.body;
    try {
      const user=await AuthService.findUser(email);
      
          if(!user){
            return res.status(401).json({message:"User with this email doesn't exist"})
          }
          const code=AuthService.generateOTP();
          user.otp=code;
          user.otpExpiry= Date.now() + 5 * 60 * 1000;
      
          await user.save();
      
        await sendEmail(
          email,
          "Password Reset OTP",
          `<h2>Your OTP is: ${code}</h2>
           <p>This OTP will expire in 5 minutes.</p>`
        );
      
        return res.status(200).json({message:"Otp sent. Please check your gmail to verify"});
    } catch (error) {
        return res.status(500).json({message:"Something went wrong. Try again"});
    }
  }

  async function verifyOTP(req,res){
    try {
      const user=await AuthService.findUser(req.body.email);
    
    if(!user || user.otp!==req.body.otp || !user.otpExpiry || user.otpExpiry < Date.now()){
      return res.status(401).json({message:"Invalid or expired otp"});
    }

    return res.status(200).json({message:"Otp verified"});
    } catch (error) {
      return res.status(500).json({message:"Something went wrong. Try again"});
    }
  }

  async function resetPassword(req,res){
    const {email,password}=req.body;
   try {
     const user=await AuthService.findUser(email);

    if(!user){
      return res.status(401).json({message:"User not found"});
    }

    user.password=await AuthService.hashPassword(password);

    user.otp=null;
    user.otpExpiry=null;

    await user.save();

    return res.status(200).json({message:"Password reset successfully"})
   } catch (error) {
     return res.status(500).json({message:"Something went wrong. Try again"});
   }
  }

  async function getUsersByIndustry(req,res){
    try {
      const industryId=req.params.industry_id;
      const userByIndustry=await userModel.find({industry:industryId}).select("-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason reject_reason -approved_by");

      if(!userByIndustry) return res.status(400).json({success:false,message:"Industry doesn't exist"});

      res.status(201).json({
      success: true,
      userByIndustry,
    });
    } catch (error) {
      console.log(err);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
    }
  }

  async function logout(req, res) {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      });

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  }
  async function getUser(req, res) {
    try {
      const id = req.params.id;
      const user = await userModel.findById(id).select("-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason reject_reason -approved_by");
      if (!user)
        return res.status(400).json({ message: "Error retrieving user" });

      return res
        .status(200)
        .json({ user, message: "User retrieved successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  }


module.exports = {
  createUser,
  login,
  getLoggedInUser,
  logout,
  getUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getUsersByIndustry
};
