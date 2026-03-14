const userModel = require("../models/UserModel");
const AuthService = require("../sevices/authutilties");

const authMiddleware = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token required"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid token format"
      });
    }

    const decoded = AuthService.verifyToken(token);

    const user = await userModel
      .findById(decoded.id)
      .select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    /* OPTIONAL STATUS CHECK */

    // if (user.status === "inactive") {
    //   return res.status(403).json({
    //     message: "Account inactive"
    //   });
    // }

    // if (user.status === "permanent_blocked") {
    //   return res.status(403).json({
    //     message: "Account permanently blocked"
    //   });
    // }

    // if (user.status === "temp_blocked" && user.blocked_until > new Date()) {
    //   return res.status(403).json({
    //     message: "Account temporarily blocked"
    //   });
    // }

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      message: "Invalid or expired token"
    });

  }
};

module.exports = authMiddleware;