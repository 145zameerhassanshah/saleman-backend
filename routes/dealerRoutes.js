const express = require("express");
const router = express.Router();

const { authMiddleware,roleMiddleware } = require("../middleware/exporter");
const USER_ROLES = require("../models/userEnum");   

const {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer
} = require("../controllers/DealerController");

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),
  createDealer
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),
  getDealers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),
  getDealerById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),
  updateDealer
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),
  deleteDealer
);

module.exports = router;