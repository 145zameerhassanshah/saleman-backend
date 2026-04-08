
// const router = require("express").Router();
// const upload = require("../middleware/multer");

// const {
//   createDealer,
//   getDealers,
//   getDealerById,
//   updateDealer,
//   deleteDealer
// } = require("../controllers/DealerController");

// router.post("/create/:businessId", upload.single("business_logo"), createDealer);

// router.get("/business/:businessId", getDealers);

// router.get("/:dealerId", getDealerById);

// router.put("/:dealerId", upload.single("business_logo"), updateDealer);

// router.delete("/:dealerId", deleteDealer);

// module.exports = router;




const router = require("express").Router();
const upload = require("../middleware/multer");

const {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  updateDealerStatus,
  unapproveDealer,
  reassignDealer,
  deleteDealer
} = require("../controllers/DealerController");

/* CREATE */
router.post("/create/:businessId", upload.single("business_logo"), createDealer);

/* GET */
router.get("/business/:businessId", getDealers);
router.get("/:dealerId", getDealerById);

/* UPDATE */
router.put("/:dealerId", upload.single("business_logo"), updateDealer);

/* ✅ NEW ROUTES */
router.patch("/status/:id", updateDealerStatus);   // approve / reject
router.patch("/unapprove/:id", unapproveDealer);   // unapprove
router.patch("/reassign/:id", reassignDealer);     // reassign

/* DELETE */
router.delete("/:dealerId", deleteDealer);

module.exports = router;