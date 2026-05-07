const router = require("express").Router();
const {
  getAllAuditLogs,
  getBusinessAuditLogs,
  getEntityAuditLogs,
} = require("../controllers/AuditLogController");
/*
|--------------------------------------------------------------------------
| AUDIT LOG ROUTES
|--------------------------------------------------------------------------
| Middleware app.js me already applied hai:
| authMiddleware + roleMiddleware(ADMIN, SUPER_ADMIN)
|--------------------------------------------------------------------------
*/

/* GET ALL AUDIT LOGS */
router.get("/", getAllAuditLogs);

/* GET BUSINESS WISE AUDIT LOGS */
router.get("/business/:businessId", getBusinessAuditLogs);

/* GET SINGLE ENTITY HISTORY */
router.get("/entity/:module/:entityId", getEntityAuditLogs);

module.exports = router;