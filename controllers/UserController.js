
const mongoose = require("mongoose");
const AuthService = require("../sevices/authutilties");
const userModel = require("../models/UserModel");
const { sendEmail } = require("../utils/email");
const USER_ROLES = require("../models/userEnum");
const crypto = require("crypto");

const { createAuditLog } = require("../sevices/auditLog");
const { AUDIT_MODULES, AUDIT_ACTIONS } = require("../models/auditEnum");

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(String(id));
};

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId || null;
};

const getCurrentRole = (req) => {
  return String(req.user?.user_type || req.user?.role || "").toLowerCase();
};

const getCurrentBusinessId = (req) => {
  return req.user?.industry || req.user?.businessId || null;
};

const cleanObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") {
      delete obj[key];
    }
  });
  return obj;
};

const sanitizeUser = (user) => {
  const obj = user?.toObject ? user.toObject() : { ...user };

  delete obj.password;
  delete obj.__v;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  delete obj.email_verification_token;
  delete obj.email_verified_at;
  delete obj.blocked_until;
  delete obj.block_reason;
  delete obj.reject_reason;

  return obj;
};
// async function createUser(req, res) {
//   // try {
//     const { email, phone_number } = req.body;
//     /* ================= EMAIL CHECK ================= */

//     const emailExist = await userModel.findOne({ email });

//     if (emailExist) {
//       return res.status(400).json({
//         success: false,
//         message: "User with similar email already exists",
//       });
//     }

//     /* ================= PHONE CHECK ================= */

//     const phoneExist = await userModel.findOne({
//       $or: [{ phone_number }],
//     });

//     if (phoneExist) {
//       return res.status(400).json({
//         success: false,
//         message: "User with same phone number already exists",
//       });
//     }

//     /* ================= PASSWORD ================= */

//     const hashPassword = await AuthService.hashPassword(req.body.password);

//     /* ================= PROFILE IMAGE ================= */

//     let profile_image = null;

//     if (req.file) {
//       profile_image = req.file.path;
//       // OR req.file.path (if using cloud or full path)
//     }

//     /* ================= CREATE USER ================= */

//     const newUser = new userModel({
//       ...req.body,
//       password: hashPassword,
//       profile_image, 
//     });
//     await newUser.save();

//     return res.status(201).json({
//       success: true,
//       message: `${req.body.user_type} created successfully`,
//     });
//   // } catch (error) {
//   //   console.error(error);
//   //   return res.status(500).json({
//   //     success: false,
//   //     message: "Server error",
//   //   });
//   // }
// }
async function createUser(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone_number = String(req.body.phone_number || "").trim();

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (!phone_number) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await userModel.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "User with similar email already exists"
            : "User with same phone number already exists",
      });
    }

    const hashPassword = await AuthService.hashPassword(req.body.password);

    const profile_image = req.file ? req.file.path : null;

    const newUser = await userModel.create({
      ...req.body,
      email,
      phone_number,
      password: hashPassword,
      profile_image,
    });

    return res.status(201).json({
      success: true,
      message: `${req.body.user_type || "User"} created successfully`,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];

      return res.status(400).json({
        success: false,
        message: `${field === "email" ? "Email" : "Phone number"} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
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
  try {
const email = String(req.body.email || "").trim().toLowerCase();
const password = String(req.body.password || "");
    /* ================= VALIDATION ================= */

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    /* ================= FIND USER ================= */

    const user = await AuthService.findUser(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    /* ================= CHECK STATUS ================= */

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    /* ================= PASSWORD CHECK ================= */

    const isMatch = await AuthService.comparePassword(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    /* ================= OTP GENERATE ================= */

const code = String(AuthService.generateOTP()).trim();

    user.otp = code;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    /* ================= SEND EMAIL ================= */

    // await sendEmail(
    //   email,
    //   "User Verification OTP",
    //   `<h2>Your OTP is: ${code}</h2>
    //    <p>This OTP will expire in 5 minutes.</p>`
    // );
await sendEmail({
  to: email,
  subject: "Your WeOrder Verification Code",
  html: `
    <div style="font-family: Arial, sans-serif; background:#f6f7f9; padding:24px;">
      <div style="max-width:520px; margin:auto; background:#ffffff; padding:24px; border-radius:12px;">
        <h2 style="color:#111; margin-top:0;">WeOrder Verification Code</h2>

        <p style="font-size:15px; color:#333;">
          Use the verification code below to complete your login.
        </p>

        <div style="font-size:32px; letter-spacing:6px; font-weight:bold; background:#f1f1f1; padding:16px; text-align:center; border-radius:10px; color:#111;">
          ${code}
        </div>

        <p style="font-size:14px; color:#555;">
          This code will expire in 5 minutes.
        </p>

        <p style="font-size:13px; color:#777;">
          If you did not request this code, you can safely ignore this email.
        </p>

        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />

        <p style="font-size:13px; color:#777;">
          Regards,<br/>
          WeOrder Team
        </p>
      </div>
    </div>
  `,
  text: `Your WeOrder verification code is ${code}. This code will expire in 5 minutes.`,
});

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Try again later",
    });
  }
}
// async function verifyUser(req, res) {
//   const { email, otp } = req.body;
//   const user = await AuthService.findUser(email);

//   if (!user || user.otpExpiry < Date.now() || user.otp !== otp) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid or expired code",
//     });
//   }

//   const token = AuthService.generateToken(user);

//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: false,
//     sameSite: "strict",
//     maxAge: 20 * 24 * 60 * 60 * 1000,
//   });

//   user.otp = null;
//   user.otpExpiry = null;

//   await user.save();

//   delete user.password;
//   delete user.__v;
//   delete user.email_verification_token;
//   delete user.email_verified_at;
//   delete user.blocked_until;
//   delete user.block_reason;
//   delete user.reject_reason;
//   delete user.otp;
//   delete user.otpExpiry;

//   return res.status(200).json({
//     success: true,
//     message: "Login successful",
//     user,
//   });
// }
async function verifyUser(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required",
      });
    }

    const user = await AuthService.findUser(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "Please login again to request a new verification code",
      });
    }

    if (Number(user.otpExpiry) < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please login again",
      });
    }

    if (String(user.otp).trim() !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    const token = AuthService.generateToken(user);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 20 * 24 * 60 * 60 * 1000,
    });

    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    const safeUser = user.toObject();

    delete safeUser.password;
    delete safeUser.__v;
    delete safeUser.email_verification_token;
    delete safeUser.email_verified_at;
    delete safeUser.blocked_until;
    delete safeUser.block_reason;
    delete safeUser.reject_reason;
    delete safeUser.otp;
    delete safeUser.otpExpiry;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpiry;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: safeUser,
    });
  } catch (err) {
    console.error("VERIFY USER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again",
    });
  }
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

    // await sendEmail(
    //   email,
    //   "Reset Password",
    //   `<h3>Click below to reset your password:</h3>
    //    <a href="${link}">${link}</a>`
    // );
await sendEmail({
  to: email,
  subject: "Reset Your WeOrder Password",
  html: `
    <div style="font-family: Arial, sans-serif; background:#f6f7f9; padding:24px;">
      <div style="max-width:520px; margin:auto; background:#ffffff; padding:24px; border-radius:12px;">
        <h2 style="color:#111; margin-top:0;">Reset Your Password</h2>

        <p style="font-size:15px; color:#333;">
          We received a request to reset your WeOrder account password.
        </p>

        <p style="font-size:15px; color:#333;">
          Click the button below to set a new password:
        </p>

        <a href="${link}" style="display:inline-block; background:#111; color:#fff; padding:12px 18px; border-radius:8px; text-decoration:none; font-size:14px;">
          Reset Password
        </a>

        <p style="font-size:13px; color:#777; margin-top:20px;">
          This link will expire in 15 minutes.
        </p>

        <p style="font-size:13px; color:#777;">
          If you did not request this, you can safely ignore this email.
        </p>

        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />

        <p style="font-size:13px; color:#777;">
          Regards,<br/>
          WeOrder Team
        </p>
      </div>
    </div>
  `,
  text: `Reset your WeOrder password using this link: ${link}. This link will expire in 15 minutes.`,
});
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
    const industryId = req.params.industry_id || req.params.businessId;

    if (!isValidObjectId(industryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid industry id",
      });
    }

    const { page, limit, skip } = getPagination(req.query);

    const {
      search = "",
      user_type = "",
      status = "",
    } = req.query;

    const filter = {
      industry: industryId,
    };

    if (user_type) {
      filter.user_type = user_type;
    }

    if (status) {
      filter.status = status;
    }

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { phone_number: { $regex: safeSearch, $options: "i" } },
        { city: { $regex: safeSearch, $options: "i" } },
        { territory: { $regex: safeSearch, $options: "i" } },
        { designation: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      userModel
        .find(filter)
        .select(
          "-password -__v -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry -email_verified_at -email_verification_token -blocked_until -block_reason -reject_reason"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      userModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      userByIndustry: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
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

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const user = await userModel
      .findById(id)
      .select(
        "-password -__v -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry -email_verified_at -email_verification_token -blocked_until -block_reason -reject_reason"
      )
      .populate("industry", "businessName name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}





async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const currentUserId = getCurrentUserId(req);
    const currentRole = getCurrentRole(req);

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const targetUser = await userModel.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isSuperAdmin = currentRole === "super_admin";
    const isAdmin = currentRole === "admin" || isSuperAdmin;
    const isOwnProfile = String(currentUserId) === String(userId);

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own profile",
      });
    }

    if (!isAdmin) {
      const blockedFields = [
        "name",
        "email",
        "password",
        "city",
        "address",
        "phone_number",
        "status",
        "user_type",
        "industry",
        "territory",
        "designation",
      ];

      const tryingBlockedUpdate = blockedFields.some((field) => req.body[field]);

      if (tryingBlockedUpdate) {
        return res.status(403).json({
          success: false,
          message: "You can only update profile image",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image provided",
        });
      }
    }

    if (!isSuperAdmin && !isOwnProfile) {
      if (
        targetUser.user_type === "admin" ||
        targetUser.user_type === "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Admin can only edit team users",
        });
      }

      const currentBusinessId = getCurrentBusinessId(req);

      if (
        currentBusinessId &&
        targetUser.industry &&
        String(currentBusinessId) !== String(targetUser.industry)
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot edit user from another business",
        });
      }
    }

    if (req.body.name !== undefined && !req.body.name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (req.body.email && !/^\S+@\S+\.\S+$/.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    if (req.body.password && req.body.password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const duplicateConditions = [];

    if (req.body.email) {
      duplicateConditions.push({ email: req.body.email.toLowerCase().trim() });
    }

    if (req.body.phone_number) {
      duplicateConditions.push({ phone_number: req.body.phone_number.trim() });
    }


    if (duplicateConditions.length > 0) {
      const existingUser = await userModel
        .findOne({
          _id: { $ne: userId },
          $or: duplicateConditions,
        })
        .select("_id")
        .lean();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with same email or phone",
        });
      }
    }

    const before = sanitizeUser(targetUser);

    const updateData = cleanObject({
      name: req.body.name?.trim(),
      email: req.body.email?.toLowerCase().trim(),
      phone_number: req.body.phone_number?.trim(),
      city: req.body.city?.trim(),
      address: req.body.address?.trim(),
      territory: req.body.territory?.trim(),
      designation: req.body.designation?.trim(),
      status: req.body.status,
    });

    if (isSuperAdmin) {
      if (req.body.user_type) updateData.user_type = req.body.user_type;
      if (req.body.industry) updateData.industry = req.body.industry;
    }

    if (req.body.password && req.body.password.trim() !== "") {
      updateData.password = await AuthService.hashPassword(req.body.password);
    }

    if (req.file) {
      updateData.profile_image = req.file.path;
    }

    const updatedUserDoc = await userModel.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    const after = sanitizeUser(updatedUserDoc);

    await createAuditLog({
      req,
      businessId: after.industry || before.industry || getCurrentBusinessId(req),
      module: AUDIT_MODULES.USER,
      entityId: updatedUserDoc._id,
      entityModel: "UserModel",
      entityLabel: updatedUserDoc.name,
      action: AUDIT_ACTIONS.UPDATE,
      description: `User ${updatedUserDoc.name} updated`,
      before,
      after,
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      updatedUser: after,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];

      const fieldMap = {
        phone_number: "Phone number",
        email: "Email",
      };

      return res.status(400).json({
        success: false,
        message: `${fieldMap[field] || field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
}
async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const currentUserId = getCurrentUserId(req);
    const currentRole = getCurrentRole(req);

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const targetUser = await userModel.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isSuperAdmin = currentRole === "super_admin";
    const isAdmin = currentRole === "admin";

    if (String(currentUserId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete yourself",
      });
    }

    if (!isSuperAdmin && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to delete users",
      });
    }

    if (!isSuperAdmin) {
      if (
        targetUser.user_type === "admin" ||
        targetUser.user_type === "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Admin can only delete team users",
        });
      }

      const currentBusinessId = getCurrentBusinessId(req);

      if (
        currentBusinessId &&
        targetUser.industry &&
        String(currentBusinessId) !== String(targetUser.industry)
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete user from another business",
        });
      }
    }

    if (isSuperAdmin && targetUser.user_type === "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete another super admin",
      });
    }

    const before = sanitizeUser(targetUser);

    await createAuditLog({
      req,
      businessId: before.industry || getCurrentBusinessId(req),
      module: AUDIT_MODULES.USER,
      entityId: targetUser._id,
      entityModel: "UserModel",
      entityLabel: targetUser.name,
      action: AUDIT_ACTIONS.DELETE,
      description: `User ${targetUser.name} deleted`,
      before,
      after: null,
    });

    await userModel.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
}module.exports = {
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
