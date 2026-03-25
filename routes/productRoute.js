const router = require("express").Router();
const upload = require("../middleware/multer"); 

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/ProductController");


router.post(
  "/create/:id",
  upload.single("image"), 
  createProduct
);


router.get("/:id", getProducts);
router.get("/:id", getProductById);


router.patch(
  "/:id",
  upload.single("image"), 
  updateProduct
);


router.delete("/:id", deleteProduct);

module.exports = router;