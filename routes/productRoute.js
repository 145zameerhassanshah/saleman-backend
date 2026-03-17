const router = require("express").Router();
const upload = require("../middleware/multer"); // ✅ ADD THIS

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/ProductController");


router.post(
  "/create",
  upload.single("image"), 
  createProduct
);


router.get("/", getProducts);
router.get("/:id", getProductById);


router.put(
  "/:id",
  upload.single("image"), 
  updateProduct
);


router.delete("/:id", deleteProduct);

module.exports = router;