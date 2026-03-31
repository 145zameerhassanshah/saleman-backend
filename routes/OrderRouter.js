// const router = require("express").Router();
// const orderController = require("../controllers/OrderController");
// const {roleMiddleware}=require("../middleware/exporter");
// const USER_ROLES=require("../models/userEnum")
// router.get("/details/:id", orderController.getOrderById);
 

// router.get("/:id", roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN,USER_ROLES.SUPER_ADMIN,USER_ROLES.DISPATCHER,USER_ROLES.ACCOUNTANT), orderController.showAll);
// router.post("/",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN), orderController.store);
// router.patch("/update-status/:id",orderController.updateOrderStatus);
// router.patch("/:id",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN,USER_ROLES.DISPATCHER,USER_ROLES.ACCOUNTANT), orderController.update);
// router.delete("/:id",roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN), orderController.remove);
// router.get(
//   "/products/:categoryId",
//   orderController.getProductsByCategory
// );
// router.get("/pdf/:id", orderController.downloadPDF);
// module.exports = router;



const router = require("express").Router();
const orderController = require("../controllers/OrderController");
const { roleMiddleware } = require("../middleware/exporter");
const USER_ROLES = require("../models/userEnum");

// Get order details
router.get("/details/:id", orderController.getOrderById);

// Get all orders by businessId with role restrictions
router.get(
  "/:id",
  roleMiddleware(
    USER_ROLES.ADMIN,
    USER_ROLES.SALESMAN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.DISPATCHER,
    USER_ROLES.ACCOUNTANT
  ),
  orderController.showAll
);

// Create order
router.post(
  "/",
  roleMiddleware(USER_ROLES.ADMIN, USER_ROLES.SALESMAN),
  orderController.store
);

// Update order status
router.patch(
  "/update-status/:id",
  roleMiddleware(USER_ROLES.ADMIN, USER_ROLES.SALESMAN, USER_ROLES.DISPATCHER, USER_ROLES.ACCOUNTANT),
  orderController.updateOrderStatus
);

// Update order
router.patch(
  "/:id",
  roleMiddleware(
    USER_ROLES.ADMIN,
    USER_ROLES.SALESMAN,
    USER_ROLES.DISPATCHER,
    USER_ROLES.ACCOUNTANT
  ),
  orderController.update
);

// Delete order
router.delete(
  "/:id",
  roleMiddleware(USER_ROLES.ADMIN, USER_ROLES.SALESMAN),
  orderController.remove
);

// Get products by category
router.get("/products/:categoryId", orderController.getProductsByCategory);

// Download PDF
router.get(
  "/pdf/:id",
  roleMiddleware(
    USER_ROLES.ADMIN,
    USER_ROLES.SALESMAN,
    USER_ROLES.DISPATCHER,
    USER_ROLES.ACCOUNTANT
  ),
  orderController.downloadPDF
);

module.exports = router;