const router = require("express").Router();
const dashboardController = require("../controllers/dashboardController");

const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/exporter");

const USER_ROLES = require("../models/userEnum");

// ✅ ALL ROLES ALLOWED (with auth)
router.get(
  "/:businessId",
  authMiddleware, // 🔥 MUST (warna req.user undefined hoga)
  roleMiddleware(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SALESMAN,
    USER_ROLES.DISPATCHER,
    USER_ROLES.ACCOUNTANT,
    USER_ROLES.MANAGER
  ),
  dashboardController.getDashboardStats
);

module.exports = router;