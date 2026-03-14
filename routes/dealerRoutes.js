const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

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
  roleMiddleware("admin","super_admin"),
  createDealer
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin","super_admin"),
  getDealers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin","super_admin"),
  getDealerById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin","super_admin"),
  updateDealer
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin","super_admin"),
  deleteDealer
);

module.exports = router;