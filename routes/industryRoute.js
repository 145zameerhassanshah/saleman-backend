const express = require("express");
const router = express.Router();
const {upload} = require("../bucket/config"); 

const {
  createIndustry,
  getAllIndustries,
  getIndustryById,
  updateIndustry,
  deleteIndustry
} = require("../controllers/IndustryController");

/* ================= CREATE ================= */
router.post(
  "/",
  upload.fields([
    { name: "business_logo", maxCount: 1 },
    { name: "addressLogo", maxCount: 1 }
  ]),
  createIndustry
);

/* ================= GET ALL ================= */
router.get("/", getAllIndustries);

/* ================= GET BY ID ================= */
router.get("/:id", getIndustryById);

/* ================= UPDATE ================= */
router.put(
  "/:id",
  upload.fields([
    { name: "business_logo", maxCount: 1 },
    { name: "addressLogo", maxCount: 1 }
  ]),
  updateIndustry
);

/* ================= DELETE ================= */
router.delete("/:id", deleteIndustry);

module.exports = router;