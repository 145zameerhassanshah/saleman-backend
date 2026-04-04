const router = require("express").Router();
const quotationController = require("../controllers/QuotationController");

router.get("/products/:categoryId", quotationController.getProductsByCategory);
router.get("/details/:id", quotationController.getQuotationById);
router.get("/:businessId", quotationController.showAll);
router.patch("/update-status/:id",quotationController.updateQuotationStatus);
router.post("/create/:businessId", quotationController.create);
router.patch("/:id", quotationController.update);
router.delete("/:id", quotationController.remove);
router.get("/pdf/:id", quotationController.downloadPDF);

module.exports = router;