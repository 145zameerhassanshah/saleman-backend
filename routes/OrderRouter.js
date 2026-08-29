const router = require("express").Router();
const orderController = require("../controllers/OrderController");

router.get("/products/:categoryId", orderController.getProductsByCategory);
router.get("/details/:id", orderController.getOrderById);
router.get("/stats/:id", orderController.getDashboardStats);
router.patch("/update-status/:id", orderController.updateOrderStatus);
router.post("/", orderController.store);
router.patch("/:id", orderController.update);
router.delete("/:id", orderController.remove);
router.get("/pdf/:id", orderController.downloadPDF);
router.get("/:id", orderController.showAll);

module.exports = router;
