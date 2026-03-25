const router = require("express").Router();
const quotationController = require("../controllers/QuotationController");

router.get("/products/:categoryId", quotationController.getProductsByCategory);

router.get("/:businessId", quotationController.showAll);
router.post("/create/:businessId", quotationController.create);
router.patch("/:id", quotationController.update);
router.delete("/:id", quotationController.remove);
module.exports = router;