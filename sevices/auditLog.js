// services/auditLog.js

const AuditLog = require("../models/AuditLogModel");
const getDiff = require("../utils/getDiff");
const sanitizeAuditData = require("../utils/sanitizeAuditData");

const getUserId = (req) => {
  return (
    req?.user?._id ||
    req?.user?.id ||
    req?.user?.userId ||
    req?.user?.user_id ||
    null
  );
};

const getUserName = (req) => {
  return req?.user?.name || req?.user?.full_name || null;
};

const getUserRole = (req) => {
  return req?.user?.user_type || req?.user?.role || null;
};

const getObjectIdValue = (value) => {
  if (!value) return null;

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return value;
};

const getBusinessId = ({ req, before, after, businessId }) => {
  if (businessId) return getObjectIdValue(businessId);

  if (after?.businessId) return getObjectIdValue(after.businessId);
  if (before?.businessId) return getObjectIdValue(before.businessId);

  if (after?.industry) return getObjectIdValue(after.industry);
  if (before?.industry) return getObjectIdValue(before.industry);

  if (req?.user?.industry) return getObjectIdValue(req.user.industry);
  if (req?.user?.businessId) return getObjectIdValue(req.user.businessId);

  return null;
};

const createAuditLog = async ({
  req,
  businessId = null,
  module,
  entityId,
  entityModel = null,
  entityLabel = null,
  action,
  description,
  before = null,
  after = null,
  changes = null,
  status = "SUCCESS",
  reason = null,
  meta = null,
}) => {
  try {
    const cleanBefore = sanitizeAuditData(before);
    const cleanAfter = sanitizeAuditData(after);

    const finalChanges =
      changes ||
      (cleanBefore || cleanAfter ? getDiff(cleanBefore || {}, cleanAfter || {}) : null);

    const finalBusinessId = getBusinessId({
      req,
      before: cleanBefore,
      after: cleanAfter,
      businessId,
    });

    const userId = getUserId(req);

    await AuditLog.create({
      businessId: finalBusinessId,

      module,
      entityId,
      entityModel,
      entityLabel,

      action,
      description,

      performedBy: userId,
      performedByName: getUserName(req),
      performedByRole: getUserRole(req),

      before: cleanBefore,
      after: cleanAfter,
      changes: finalChanges,

      request: {
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.["user-agent"] || null,
        method: req?.method || null,
        path: req?.originalUrl || null,
      },

      status,
      reason,
      meta,
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
};

module.exports = {
  createAuditLog,
};