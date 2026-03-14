const router = require("express").Router();
const orderController = require("../controllers/OrderController");

router.get("/", orderController.showAll);
router.post("/", orderController.store);
router.patch("/:id", orderController.update);
router.delete("/:id", orderController.remove);

router.get(
  "/products/:categoryId",
  orderController.getProductsByCategory
);

module.exports = router;