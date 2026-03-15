const router = require("express").Router();

const USER_ROLES = require("../models/userEnum");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/ProductController");


router.post(
  "/create",
  createProduct
);

router.get(
  "/",
  getProducts
);

router.get(
  "/:id",
  getProductById
);

router.put(
  "/:id",
  updateProduct
);

router.delete(
  "/:id",
  deleteProduct
);

module.exports = router;