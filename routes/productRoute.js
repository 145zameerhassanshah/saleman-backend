const router = require("express").Router();
const {upload} = require("../bucket/config"); 

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
router.get("/single/:id", getProductById);


router.patch(
  "/:id",
  upload.single("image"), 
  updateProduct
);


router.delete("/:id", deleteProduct);

module.exports = router;