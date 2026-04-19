const AuthService = require("../sevices/authutilties");
const userModel = require("../models/UserModel");
const { sendEmail } = require("../utils/email");
const USER_ROLES = require("../models/userEnum");
const crypto = require("crypto");

async function createUser(req, res) {
  // try {
    const { email, phone_number, whatsapp_number } = req.body;
    /* ================= EMAIL CHECK ================= */

    const emailExist = await userModel.findOne({ email });

    if (emailExist) {
      return res.status(400).json({
        success: false,
        message: "User with similar email already exists",
      });
    }

    /* ================= PHONE CHECK ================= */

    const phoneExist = await userModel.findOne({
      $or: [{ phone_number }, { whatsapp_number }],
    });

    if (phoneExist) {
      return res.status(400).json({
        success: false,
        message: "User with same phone number already exists",
      });
    }

    /* ================= PASSWORD ================= */

    const hashPassword = await AuthService.hashPassword(req.body.password);

    /* ================= PROFILE IMAGE ================= */

    let profile_image = null;

    if (req.file) {
      profile_image = req.file.path;
      // OR req.file.path (if using cloud or full path)
    }

    /* ================= CREATE USER ================= */

    const newUser = new userModel({
      ...req.body,
      password: hashPassword,
      profile_image, // ✅ added
    });
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: `${req.body.user_type} created successfully`,
    });
  // } catch (error) {
  //   console.error(error);
  //   return res.status(500).json({
  //     success: false,
  //     message: "Server error",
  //   });
  // }
}

const getSalesmen = async (req, res) => {
  try {
    const salesmen = await userModel
      .find({
        industry: req.params.businessId,
        user_type: USER_ROLES.SALESMAN,
        status: "Active",
      })
      .select("_id name email");

    res.status(200).json({
      success: true,
      salesmen,
    });
  } catch (err) {
    console.error("GET SALESMEN ERROR:", err); // 🔥 IMPORTANT
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
async function login(req, res) {
  try{
  const { email, password } = req.body;
    const isUser = await AuthService.findUser(email);

    if (!isUser) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email",
      });
    }

    const comparePassword = await AuthService.comparePassword(
      password,
      isUser.password,
    );

    if (!comparePassword) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Password",
      });
    }

    const code = AuthService.generateOTP();
    isUser.otp = code;
    isUser.otpExpiry = Date.now() + 5 * 60 * 1000;

    await isUser.save();

    await sendEmail(
      email,
      "User Verification OTP",
      `<h2>Your OTP is: ${code}</h2>
           <p>This OTP will expire in 5 minutes.</p>`,
    );

    return res.status(200).json({
      success: true,
      message: "We have sent a verification code to your email.",
      isUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Try again later",
    });
  }
}

async function verifyUser(req, res) {
  const { email, otp } = req.body;
  const user = await AuthService.findUser(email);

  if (!user || user.otpExpiry < Date.now() || user.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired code",
    });
  }

  const token = AuthService.generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 20 * 24 * 60 * 60 * 1000,
  });

  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  delete user.password;
  delete user.__v;
  delete user.email_verification_token;
  delete user.email_verified_at;
  delete user.blocked_until;
  delete user.block_reason;
  delete user.reject_reason;
  delete user.otp;
  delete user.otpExpiry;

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user,
  });
}

async function getLoggedInUser(req, res) {
  try {
    const user = req.user;
    const loggedInUser = await userModel
      .findById(user.id)
      .select(
        "-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason -reject_reason -otp -otpExpiry",
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


async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const user = await AuthService.findUser(email);

    // 🔐 security (same response always)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email exists, a reset link has been sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    await user.save();

    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await sendEmail(
      email,
      "Reset Password",
      `<h3>Click below to reset your password:</h3>
       <a href="${link}">${link}</a>`
    );

    return res.status(200).json({
      success: true,
      message: "Reset link sent",
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}async function verifyOTP(req, res) {
  try {
    const user = await AuthService.findUser(req.body.email);

    if (
      !user ||
      user.otp !== req.body.otp ||
      !user.otpExpiry ||
      user.otpExpiry < Date.now()
    ) {
      return res.status(401).json({ message: "Invalid or expired otp" });
    }

    return res.status(200).json({ message: "Otp verified" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong. Try again" });
  }
}

async function resetPassword(req, res) {
  const { token, password } = req.body;

  try {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired link",
      });
    }

    user.password = await AuthService.hashPassword(password);

    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
async function changePassword(req, res) {
  try {
    const userId = req.user.id;

    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(401).json({ success:false, message: "User not found" });
    }

    const isMatch = await AuthService.comparePassword(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success:false,
        message: "Current password is incorrect"
      });
    }

    user.password = await AuthService.hashPassword(newPassword);
    await user.save();

    return res.status(200).json({
      success:true,
      message: "Password changed successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success:false,
      message: "Something went wrong"
    });
  }
}
async function getUsersByIndustry(req, res) {
  try {
    const industryId = req.params.industry_id;
    const userByIndustry = await userModel
      .find({ industry: industryId })
      .select(
        "-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason -reject_reason -approved_by",
      );

    if (!userByIndustry)
      return res
        .status(400)
        .json({ success: false, message: "Industry doesn't exist" });

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
    const user = await userModel
      .findById(id)
      .select(
        "-password -__v -email_verified_at -email_verification_token -blocked_until -block_reason reject_reason -approved_by",
      );
    if (!user)
      return res.status(400).json({ message: "Error retrieving user" });

    return res
      .status(200)
      .json({ user, message: "User retrieved successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}




// async function updateUser(req, res) {
//   try {
//     const userId = req.params.id;
//     const currentUser = req.user;

//     const user = await userModel.findById(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const isAdmin =
//       currentUser.role === "admin" ||
//       currentUser.role === "super_admin";

//     const isOwnProfile = String(currentUser.id) === String(userId);

//     /* ================= ACCESS CONTROL ================= */

//     // ❌ non-admin cannot edit others
//     if (!isAdmin && !isOwnProfile) {
//       return res.status(403).json({
//         success: false,
//         message: "Not allowed to update this user",
//       });
//     }

//     /* ================= NON ADMIN RESTRICTION ================= */

//     if (!isAdmin) {
//       // 🔒 ONLY PROFILE IMAGE ALLOWED
//       if (
//         req.body.name ||
//         req.body.email ||
//         req.body.password ||
//         req.body.status ||
//         req.body.designation ||
//         req.body.address ||
//         req.body.city ||
//         req.body.phone_number ||
//         req.body.whatsapp_number ||
//         req.body.territory
//       ) {
//         return res.status(200).json({
//           success: true,
//           message: "You can only update profile image",
//         });
//       }
//     }

//     /* ================= EMAIL CHECK ================= */

//     if (req.body.email && req.body.email !== user.email) {
//       const emailExist = await userModel.findOne({
//         email: req.body.email,
//         _id: { $ne: userId },
//       });

//       if (emailExist) {
//         return res.status(400).json({
//           success: false,
//           message: "Email already in use",
//         });
//       }
//     }

//     /* ================= UPDATE FIELDS (ADMIN ONLY) ================= */

//     if (isAdmin) {
//       if (req.body.name) user.name = req.body.name;
//       if (req.body.email) user.email = req.body.email;

//       if (req.body.status) user.status = req.body.status;
//       if (req.body.designation) user.designation = req.body.designation;
//       if (req.body.address) user.address = req.body.address;
//       if (req.body.city) user.city = req.body.city;
//       if (req.body.phone_number) user.phone_number = req.body.phone_number;
//       if (req.body.whatsapp_number)
//         user.whatsapp_number = req.body.whatsapp_number;
//       if (req.body.territory) user.territory = req.body.territory;

//       /* 🔐 PASSWORD */
//       if (req.body.password && req.body.password.trim() !== "") {
//         user.password = await AuthService.hashPassword(req.body.password);
//       }
//     }

//     /* ================= PROFILE IMAGE (ALL USERS) ================= */

//     if (req.file) {
//       user.profile_image = req.file.path;
//     }

//     await user.save();

//     /* ================= CLEAN RESPONSE ================= */

//     const updatedUser = user.toObject();

//     delete updatedUser.password;
//     delete updatedUser.__v;
//     delete updatedUser.otp;
//     delete updatedUser.otpExpiry;
//     delete updatedUser.resetPasswordToken;
//     delete updatedUser.resetPasswordExpiry;

//     return res.status(200).json({
//       success: true,
//       message: "User updated successfully",
//       updatedUser,
//     });

//   } catch (error) {
//     console.error("UPDATE USER ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// }

async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const currentUser = req.user;
    const user = await userModel.findById({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isAdmin =
      currentUser.role === "admin" ||
      currentUser.role === "super_admin";

    const isSuperAdmin = currentUser.role === "super_admin";

    const isOwnProfile = String(currentUser.id) === String(userId);

    /* ================= TEAM USER ================= */

    if (!isAdmin) {
      if (!isOwnProfile) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own profile",
        });
      }

      // team → only image
      if (
        req.body.name ||
        req.body.email ||
        req.body.password ||
        req.body.city ||
        req.body.address ||
        req.body.phone_number ||
        req.body.whatsapp_number
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update profile image",
        });
      }

      if (req.file) {
        user.profile_image = req.file.path;
        await user.save();

        return res.status(200).json({
          success: true,
          message: "Profile image updated",
        });
      }

      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    /* ================= ADMIN / SUPER ADMIN ================= */

    // ❌ admin cannot edit other admins
    if (!isSuperAdmin && !isOwnProfile) {
      if (
        user.user_type === "admin" ||
        user.user_type === "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Admin can only edit team users",
        });
      }
    }

    // ✔ admin can edit own profile ALWAYS
    // ✔ super admin can edit everyone

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.city) user.city = req.body.city;
    if (req.body.address) user.address = req.body.address;
    if (req.body.phone_number) user.phone_number = req.body.phone_number;
    if (req.body.whatsapp_number)
      user.whatsapp_number = req.body.whatsapp_number;

    if (req.body.password && req.body.password.trim() !== "") {
      user.password = await AuthService.hashPassword(req.body.password);
    }

    if (req.file) {
      user.profile_image = req.file.path;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// async function deleteUser(req, res) {
//   try {
//     const userId = req.params.id;

//     const user = await userModel.findById(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     await userModel.findByIdAndDelete(userId);

//     return res.status(200).json({
//       success: true,
//       message: "User deleted successfully",
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// }



async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const currentUser = req.user;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isSuperAdmin = currentUser.role === "super_admin";
    const isAdmin = currentUser.role === "admin";

    /* ❌ NO ONE CAN DELETE THEMSELVES */
    if (String(currentUser.id) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete yourself",
      });
    }

    /* ================= SUPER ADMIN ================= */
    if (isSuperAdmin) {
      // ✔ can delete anyone except another super admin
      if (user.user_type === "super_admin") {
        return res.status(403).json({
          success: false,
          message: "Cannot delete another super admin",
        });
      }

      await userModel.findByIdAndDelete(userId);

      return res.status(200).json({
        success: true,
        message: "User deleted by Super Admin",
      });
    }

    /* ================= ADMIN ================= */
    if (isAdmin) {
      // ❌ admin cannot delete admin or super admin
      if (
        user.user_type === "admin" ||
        user.user_type === "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Admin can only delete team users",
        });
      }

      await userModel.findByIdAndDelete(userId);

      return res.status(200).json({
        success: true,
        message: "User deleted by Admin",
      });
    }

    /* ================= TEAM USER ================= */
    return res.status(403).json({
      success: false,
      message: "Not allowed to delete users",
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);

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
  getSalesmen,
  verifyUser,
  deleteUser,
};
