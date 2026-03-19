const router = require("express").Router();
const quotationController = require("../controllers/QuotationController");

router.get("/Quotation/:businessId", quotationController.showAll);
router.post("/create/:businessId", quotationController.create);
router.patch("/:id", quotationController.update);
router.delete("/:id", quotationController.remove);
router.get("/products/:categoryId", quotationController.getProductsByCategory);

module.exports = router;