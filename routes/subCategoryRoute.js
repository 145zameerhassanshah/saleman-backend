const { Router } = require("express");
const {
  createSubCategory,
  showAllSubCategories,
  updateSubCategory,
  removeSubCategory
} = require("../controllers/subCategoryController");

const { roleMiddleware } = require("../middleware/exporter");
const USER_ROLES = require("../models/userEnum");

const router = Router();

/* GET ALL */

router.get("/", showAllSubCategories);

/* CREATE */

router.post(
  "/",
  roleMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  createSubCategory
);

/* UPDATE */

router.patch(
  "/:id",
  roleMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  updateSubCategory
);

/* DELETE */

router.delete(
  "/:id",
  roleMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  removeSubCategory
);

module.exports = router;