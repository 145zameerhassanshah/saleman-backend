const UserModel = require("../models/UserModel");
const { verifyToken } = require("../utils/authUtils");

const authMiddleware = async (req, res, next) => {

  try {

    const token = req.cookies.erp_token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const decoded = verifyToken(token);

    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    /* EMAIL VERIFICATION CHECK */

    if (!user.email_verified_at) {
      return res.status(403).json({
        message: "Please verify your email"
      });
    }

    /* STATUS CHECK */

    if (user.status === "pending") {
      return res.status(403).json({
        message: "Account waiting for approval"
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        message: "Account rejected"
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Account inactive"
      });
    }

    if (user.status === "permanent_blocked") {
      return res.status(403).json({
        message: "Account permanently blocked"
      });
    }

    if (user.status === "temp_blocked") {

      if (user.blocked_until && user.blocked_until > new Date()) {

        return res.status(403).json({
          message: "Account temporarily blocked"
        });

      }

    }

    req.user = user;

    next();

  } catch (error) {

    return res.status(401).json({
      message: "Invalid or expired token"
    });

  }

};

module.exports = authMiddleware;