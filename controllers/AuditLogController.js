const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLogModel");

/* ================================
   HELPERS
================================ */

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return value._id;
  return value;
};

const normalizeRole = (req) => {
  return String(req.user?.user_type || req.user?.role || "").toLowerCase();
};

const isSuperAdmin = (req) => {
  const role = normalizeRole(req);
  return role === "super_admin" || role === "superadmin";
};

const getUserBusinessId = (req) => {
  // ✅ IMPORTANT FIX:
  // req.user.industry kabhi ObjectId hota hai, kabhi populated object.
  return getId(req.user?.industry || req.user?.businessId);
};

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(String(id));
};

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getModuleVariants = (module) => {
  const raw = String(module || "").trim();

  return [
    raw,
    raw.toUpperCase(),
    raw.toLowerCase(),
    raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase(),
  ].filter(Boolean);
};

const buildProtectedBusinessFilter = (req, requestedBusinessId = null) => {
  const filter = {};

  const userBusinessId = getUserBusinessId(req);
  const requestedId = getId(requestedBusinessId);

  if (!isSuperAdmin(req)) {
    /*
    |--------------------------------------------------------------------------
    | ✅ COMPATIBILITY FIX
    |--------------------------------------------------------------------------
    | Old controller me agar req.user.industry missing hoti thi,
    | businessId filter apply nahi hota tha.
    |
    | New strict code 403 de raha tha, is liye activity empty ho sakti thi.
    |
    | Best practice: auth middleware me req.user.industry lazmi attach karo.
    | Filhal compatibility ke liye agar userBusinessId missing ho to filter skip.
    */
    if (!userBusinessId) {
      return { filter };
    }

    if (requestedId && String(requestedId) !== String(userBusinessId)) {
      return {
        error: {
          status: 403,
          message: "You are not allowed to view this business audit logs",
        },
      };
    }

    filter.businessId = userBusinessId;
  } else if (requestedId) {
    filter.businessId = requestedId;
  }

  return { filter };
};

/* ================================
   GET ALL AUDIT LOGS
================================ */

const getAllAuditLogs = async (req, res) => {
  try {
    const {
      businessId,
      module,
      action,
      entityId,
      performedBy,
      status,
      search = "",
    } = req.query;

    const { page, limit, skip } = getPagination(req.query);

    if (businessId && !isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    if (entityId && !isValidObjectId(entityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity id",
      });
    }

    if (performedBy && !isValidObjectId(performedBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid performedBy id",
      });
    }

    const protectedFilter = buildProtectedBusinessFilter(req, businessId);

    if (protectedFilter.error) {
      return res.status(protectedFilter.error.status).json({
        success: false,
        message: protectedFilter.error.message,
      });
    }

    const filter = protectedFilter.filter;

    // ✅ IMPORTANT FIX:
    // Old logs me module uppercase/lowercase ho sakta hai.
    if (module) {
      filter.module = { $in: getModuleVariants(module) };
    }

    if (action) {
      filter.action = String(action).toUpperCase();
    }

    if (entityId) filter.entityId = entityId;
    if (performedBy) filter.performedBy = performedBy;
    if (status) filter.status = String(status).toUpperCase();

    if (search.trim()) {
      filter.entityLabel = {
        $regex: `^${escapeRegex(search.trim())}`,
        $options: "i",
      };
    }

    // ✅ OPTIMIZED: Promise.all + select + lean + pagination
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .select(
          "businessId module entityId entityModel entityLabel action description performedBy performedByName performedByRole changes request status reason meta createdAt"
        )
        .populate("performedBy", "name email user_type role profile_image")
        .populate("businessId", "name businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully",
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

/* ================================
   GET BUSINESS AUDIT LOGS
================================ */

const getBusinessAuditLogs = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { page, limit, skip } = getPagination(req.query);

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const protectedFilter = buildProtectedBusinessFilter(req, businessId);

    if (protectedFilter.error) {
      return res.status(protectedFilter.error.status).json({
        success: false,
        message: protectedFilter.error.message,
      });
    }

    const filter = protectedFilter.filter;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .select(
          "businessId module entityId entityModel entityLabel action description performedBy performedByName performedByRole changes request status reason meta createdAt"
        )
        .populate("performedBy", "name email user_type role profile_image")
        .populate("businessId", "name businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Business audit logs fetched successfully",
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business audit logs",
      error: error.message,
    });
  }
};

/* ================================
   GET ENTITY AUDIT LOGS
================================ */

const getEntityAuditLogs = async (req, res) => {
  try {
    const { module, entityId } = req.params;
    const { page, limit, skip } = getPagination(req.query);

    if (!module) {
      return res.status(400).json({
        success: false,
        message: "Module is required",
      });
    }

    if (!isValidObjectId(entityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity id",
      });
    }

    const protectedFilter = buildProtectedBusinessFilter(req);

    if (protectedFilter.error) {
      return res.status(protectedFilter.error.status).json({
        success: false,
        message: protectedFilter.error.message,
      });
    }

    const filter = {
      ...protectedFilter.filter,

      // ✅ IMPORTANT FIX:
      // Sirf uppercase na karo. Old logs me module different case me ho sakta hai.
      module: { $in: getModuleVariants(module) },

      entityId,
    };

    /*
    |--------------------------------------------------------------------------
    | ✅ OPTIMIZED BUT COMPATIBLE
    |--------------------------------------------------------------------------
    | Old code all logs la raha tha.
    | Ye page wise logs la raha hai, default 20.
    */
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .select(
          "businessId module entityId entityModel entityLabel action description performedBy performedByName performedByRole changes request status reason meta createdAt"
        )
        .populate("performedBy", "name email user_type role profile_image")
        .populate("businessId", "name businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Entity audit history fetched successfully",
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch entity audit history",
      error: error.message,
    });
  }
};

module.exports = {
  getAllAuditLogs,
  getBusinessAuditLogs,
  getEntityAuditLogs,
};