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
  createDealer
);

router.get(
  "/",
  roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),
  getDealers
);

router.get(
  "/:id",
  getDealerById
);

router.put(
  "/:id",
  updateDealer
);

router.delete(
  "/:id",
  deleteDealer
);

module.exports = router;