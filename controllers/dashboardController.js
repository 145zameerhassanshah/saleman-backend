const {
  orderModel,
  quotationModel,
  userModel,
} = require("../models/exporter");

const Dealer = require("../models/DealerModel");
const USER_ROLES = require("../models/userEnum");

async function getDashboardStats(req, res) {
  try {
    const user = req.user;
    const businessId = req.params.businessId;
    const role = user.role;

    /* ================= BASE FILTER ================= */

    let baseFilter = { businessId };

    // ✅ SALESMAN → only own
    if (role === USER_ROLES.SALESMAN) {
      baseFilter.createdBy = user.id;
    }

    /* ================= ROLE STATUS FILTER ================= */

    let statusAccess = null;

    if (role === USER_ROLES.DISPATCHER || role === USER_ROLES.MANAGER) {
      statusAccess = ["approved", "dispatched", "partial"];
    }

    if (role === USER_ROLES.ACCOUNTANT) {
      statusAccess = ["dispatched", "partial", "posted"];
    }

    /* ================= COUNTS ================= */

    const totalOrders = await orderModel.countDocuments(baseFilter);

    const pendingOrders = await orderModel.countDocuments({
      ...baseFilter,
      status: "unapproved",
    });

    const approvedOrders = await orderModel.countDocuments({
      ...baseFilter,
      status: "approved",
    });

    const dispatchedOrders = await orderModel.countDocuments({
      ...baseFilter,
      status: "dispatched",
    });

    /* ================= ROLE BASE FILTER APPLY ================= */

    let visibleOrders = totalOrders;
    let visiblePending = pendingOrders;
    let visibleApproved = approvedOrders;
    let visibleDispatched = dispatchedOrders;

    if (statusAccess) {
      visibleOrders = await orderModel.countDocuments({
        ...baseFilter,
        status: { $in: statusAccess },
      });

      visiblePending = 0; // dispatcher/accountant ko pending nahi chahiye
      visibleApproved = await orderModel.countDocuments({
        ...baseFilter,
        status: "approved",
      });

      visibleDispatched = await orderModel.countDocuments({
        ...baseFilter,
        status: "dispatched",
      });
    }

    /* ================= OTHER ================= */

    const totalQuotations = await quotationModel.countDocuments(baseFilter);

    const totalDealers = await Dealer.countDocuments(baseFilter);

    const totalSalesmen =
      role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN
        ? await userModel.countDocuments({
            industry: businessId,
            user_type: USER_ROLES.SALESMAN,
            status: "Active",
          })
        : 0;

    /* ================= RESPONSE ================= */

    return res.json({
      success: true,
      stats: {
        totalOrders: visibleOrders,
        pendingOrders: visiblePending,
        approvedOrders: visibleApproved,
        dispatchedOrders: visibleDispatched,
        totalQuotations,
        totalDealers,
        totalSalesmen,
      },
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}module.exports = { getDashboardStats };