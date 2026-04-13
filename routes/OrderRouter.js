const router = require("express").Router();
const orderController = require("../controllers/OrderController");
const {roleMiddleware}=require("../middleware/exporter");
const USER_ROLES=require("../models/userEnum")
router.get("/details/:id", orderController.getOrderById);
 
router.get(
  "/stats/:id",
  roleMiddleware(
    USER_ROLES.ADMIN,
    USER_ROLES.SALESMAN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.DISPATCHER,
    USER_ROLES.ACCOUNTANT,
    USER_ROLES.MANAGER

  ),
  orderController.getDashboardStats
);
router.get("/:id", roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN,USER_ROLES.SUPER_ADMIN,USER_ROLES.DISPATCHER,USER_ROLES.ACCOUNTANT,USER_ROLES.MANAGER), orderController.showAll);
router.post("/",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN), orderController.store);
router.patch("/update-status/:id",orderController.updateOrderStatus);
router.patch("/:id",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN,USER_ROLES.DISPATCHER,USER_ROLES.ACCOUNTANT,USER_ROLES.MANAGER), orderController.update);
router.delete("/:id",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN), orderController.remove);
router.get(
  "/products/:categoryId",
  orderController.getProductsByCategory
);
router.get("/pdf/:id", orderController.downloadPDF);
module.exports = router;



