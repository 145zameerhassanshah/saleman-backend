const express = require("express");
const router = express.Router();
import upload from "../middleware/multer";
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
  "/",upload.single("business_logo"),
  createDealer
);

router.get(
  "/:id",
  getDealers
);

router.get(
  "/:id",
  getDealerById
);

router.put(
  "/:id",
  upload.single("business_logo"),
  updateDealer
);

router.delete(
  "/:id",
  roleMiddleware(USER_ROLES.ADMIN),
  deleteDealer
);

module.exports = router;