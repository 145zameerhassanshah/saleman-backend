const express = require("express");
const router = express.Router();

const { roleMiddleware } = require("../middleware/exporter");
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
  roleMiddleware(USER_ROLES.ADMIN),
  createDealer
);

router.get(
  "/",
  roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),
  getDealers
);

router.get(
  "/:id",
  roleMiddleware(USER_ROLES.ADMIN),
  getDealerById
);

router.put(
  "/:id",
  roleMiddleware(USER_ROLES.ADMIN),
  updateDealer
);

router.delete(
  "/:id",
  roleMiddleware(USER_ROLES.ADMIN),
  deleteDealer
);

module.exports = router;