const userModel = require("../models/UserModel");
const AuthService = require("../sevices/authutilties");

const authMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const token = req.headers["authorization"].split(" ")[1];

    const decodeRefreshToken = AuthService.verifyToken(refreshToken);
    const user = await userModel.findById({
      _id: decodeRefreshToken.id,
    }).select("-password");
    if (token) {
      const decodeAccessToken = AuthService.verifyToken(token);
      if (decodeAccessToken.id !== decodeRefreshToken.id || !user) {
        return res.status(400).json({ message: "Invalid token or user" });
      }
      req.user = decodeAccessToken;
      return next();
    }

    const newToken = AuthService.generateToken(user);
    const decodeNewToken = AuthService.verifyToken(newToken);

    /* STATUS CHECK */

    // if (user.status === "pending") {
    //   return res.status(403).json({
    //     message: "Account waiting for approval"
    //   });
    // }

    // if (user.status === "rejected") {
    //   return res.status(403).json({
    //     message: "Account rejected"
    //   });
    // }

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

    // if (user.status === "temp_blocked") {

    //   if (user.blocked_until && user.blocked_until > new Date()) {

    //     return res.status(403).json({
    //       message: "Account temporarily blocked"
    //     });

    //   }

    decodeNewToken.newToken=newToken;
    req.user = decodeNewToken;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
