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

router.post("/create/:businessId", upload.single("business_logo"), createDealer);

router.get("/business/:businessId", getDealers);

router.get("/:dealerId", getDealerById);

router.put("/:dealerId", upload.single("business_logo"), updateDealer);

router.delete("/:dealerId", deleteDealer);

module.exports = router;