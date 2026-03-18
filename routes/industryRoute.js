const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer"); 
const {
  createIndustry,
  getAllIndustries,
  getIndustryById,
  updateIndustry,
  deleteIndustry
} = require("../controllers/IndustryController");

router.post(
  "/",
  upload.single("business_logo"),
  createIndustry
);

router.get(
  "/",
  getAllIndustries
);

router.get(
  "/:id",
  getIndustryById
);

router.put(
  "/:id",
  updateIndustry
);

router.delete(
  "/:id",
  deleteIndustry
);

module.exports = router;