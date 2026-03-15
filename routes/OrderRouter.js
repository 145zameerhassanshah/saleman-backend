const router = require("express").Router();
const orderController = require("../controllers/OrderController");
const {roleMiddleware}=require("../middleware/exporter");

router.get("/", roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), orderController.showAll);
router.post("/", orderController.store);
router.patch("/:id", orderController.update);
router.delete("/:id", orderController.remove);

router.get(
  "/products/:categoryId",
  orderController.getProductsByCategory
);

module.exports = router;