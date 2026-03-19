const router = require("express").Router();
const orderController = require("../controllers/OrderController");
const {roleMiddleware}=require("../middleware/exporter");
const USER_ROLES=require("../models/userEnum")

router.get("/:id", roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN,USER_ROLES.SUPER_ADMIN), orderController.showAll);
router.post("/",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN), orderController.store);
router.patch("/:id",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN), orderController.update);
router.delete("/:id",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN), orderController.remove);

router.get(
  "/products/:categoryId",
  orderController.getProductsByCategory
);

module.exports = router;