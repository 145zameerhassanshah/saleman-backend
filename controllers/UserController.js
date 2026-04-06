const AuthService = require("../sevices/authutilties");
const userModel = require("../models/UserModel");
const { sendEmail } = require("../utils/email");
const USER_ROLES = require("../models/userEnum"); 



async function createUser(req, res) {
  try {
    const { email, phone_number, whatsapp_number } = req.body;
    /* ================= EMAIL CHECK ================= */

    const emailExist = await userModel.findOne({ email });

    if (emailExist) {
      return res.status(400).json({
        success: false,
        message: "User with similar email already exists"
      });
    }

    /* ================= PHONE CHECK ================= */

    const phoneExist = await userModel.findOne({
      $or: [
        { phone_number },
        { whatsapp_number }
      ]
    });

    if (phoneExist) {
      return res.status(400).json({
        success: false,
        message: "User with same phone number already exists"
      });
    }

    /* ================= PASSWORD ================= */

    const hashPassword = await AuthService.hashPassword(req.body.password);

    /* ================= PROFILE IMAGE ================= */

    let profile_image = null;

    if (req.file) {
      profile_image = req.file.filename; 
      // OR req.file.path (if using cloud or full path)
    }

    /* ================= CREATE USER ================= */

    const newUser = new userModel({
      ...req.body,
      password: hashPassword,
      profile_image // ✅ added
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: `${req.body.user_type} created successfully`,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}



const getSalesmen = async (req, res) => {
  try {

    const salesmen = await userModel.find({
      industry: req.params.businessId,
      user_type: USER_ROLES.SALESMAN,
      status: "Active"
    }).select("_id name email");


    res.status(200).json({
      success: true,
      salesmen
    });

  } catch (err) {
    console.error("GET SALESMEN ERROR:", err); // 🔥 IMPORTANT
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const isUser = await AuthService.findUser(email);

    if (!isUser) {
return res.status(400).json({
  success: false,
  message: "Incorrect email"
});    }

    const comparePassword = await AuthService.comparePassword(
      password,
      isUser.password
    );

    if (!comparePassword) {
return res.status(400).json({
  success: false,
  message: "Incorrect Password"
});    }

    const token = AuthService.generateToken(isUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, 
      sameSite: "strict",
      maxAge: 20 * 24 * 60 * 60 * 1000,
    });

    delete isUser.password;
    delete isUser.__v;
    delete isUser.email_verification_token;
    delete isUser.email_verified_at;
    delete isUser.blocked_until;
    delete isUser.block_reason;
    delete isUser.reject_reason;
    delete isUser.otp;
    delete isUser.otpExpiry;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      isUser
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
  .findById(user.id)
  .select(
    "-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason -reject_reason -otp -otpExpiry"
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
async function changePassword(req,res){
    const {email,currentPassword,newPassword}=req.body;
    try {
      const user=await AuthService.findUser(email); 
      if(!user){
        return res.status(401).json({message:"User not found"});
      }
      const isMatch=await AuthService.comparePassword(currentPassword,user.password);
      if(!isMatch){
        return res.status(401).json({message:"Current password is incorrect"});
      }
      user.password=await AuthService.hashPassword(newPassword);
      await user.save();
      return res.status(200).json({message:"Password changed successfully"});
    }
      catch (error) {
        return res.status(500).json({message:"Something went wrong. Try again"});
    }
  }
  async function getUsersByIndustry(req,res){
    try {
      const industryId=req.params.industry_id;
      const userByIndustry=await userModel.find({industry:industryId}).select("-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason -reject_reason -approved_by");

      if(!userByIndustry) return res.status(400).json({success:false,message:"Industry doesn't exist"});

      res.status(201).json({
      success: true,
      userByIndustry,
    });
    } catch (error) {
      console.log(error);
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

  async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ================= EMAIL CHECK ================= */
    if (req.body.email && req.body.email !== user.email) {
      const emailExist = await userModel.findOne({
        email: req.body.email,
        _id: { $ne: userId },
      });

      if (emailExist) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    /* ================= UPDATE FIELDS ================= */

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    if (req.body.status) user.status = req.body.status;

    if(req.body.designation) user.designation=req.body.designation;
    if(req.body.address) user.address=req.body.address;

    if(req.body.city) user.city=req.body.city;
    if(req.body.phone_number) user.phone_number=req.body.phone_number;

    if(req.body.whatsapp_number) user.whatsapp_number=req.body.whatsapp_number;
    if(req.body.territory) user.territory=req.body.territory;
    /* ================= PROFILE IMAGE ================= */

    if (req.file) {
      user.profile_image = req.file.filename;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      updatedUser: user,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


module.exports = {
  createUser,
  login,
  getLoggedInUser,
  updateUser,
  logout,
  getUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  getUsersByIndustry,
  getSalesmen
};
