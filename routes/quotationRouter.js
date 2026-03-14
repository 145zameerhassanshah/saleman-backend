const router = require("express").Router();
const quotationController = require("../controllers/QuotationController");

router.get("/", quotationController.showAll);
router.post("/", quotationController.store);
router.patch("/:id", quotationController.update);
router.delete("/:id", quotationController.remove);

router.get("/products/:categoryId",
  quotationController.getProductsByCategory
);

module.exports = router;