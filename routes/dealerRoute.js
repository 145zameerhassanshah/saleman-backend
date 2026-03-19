// const router = require("express").Router();
// const upload = require("../middleware/multer"); 
// const {
//   createDealer,
//   getDealers,
//   getDealerById,
//   updateDealer,
//   deleteDealer
// } = require("../controllers/DealerController");

// router.post(
//   "/create/:id",
//   upload.single("business_logo"), 
//   createDealer
// );


// router.get("/:id", getDealers);
// router.get("/:id", getDealerById);


// router.put(
//   "/:id",
//   upload.single("business_logo"), 
//   updateDealer
// );


// router.delete("/:id", deleteDealer);

// module.exports = router;


const router = require("express").Router();
const upload = require("../middleware/multer");

const {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer
} = require("../controllers/DealerController");

/* CREATE */
router.post("/create/:businessId", upload.single("business_logo"), createDealer);

/* GET ALL (BY BUSINESS) */
router.get("/business/:businessId", getDealers);

/* GET SINGLE */
router.get("/:dealerId", getDealerById);

/* UPDATE */
router.put("/:dealerId", upload.single("business_logo"), updateDealer);

/* DELETE */
router.delete("/:dealerId", deleteDealer);

module.exports = router;