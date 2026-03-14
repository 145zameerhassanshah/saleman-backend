const { Router } = require("express");
const {
  createSubCategory,
  showAllSubCategories,
  updateSubCategory,
  removeSubCategory
} = require("../controllers/subCategoryController");

const router = Router();

/* GET ALL */

router.get("/", showAllSubCategories);

/* CREATE */

router.post(
  "/",
  createSubCategory
);

/* UPDATE */

router.patch(
  "/:id",
  updateSubCategory
);

/* DELETE */

router.delete(
  "/:id",
  removeSubCategory
);

module.exports = router;