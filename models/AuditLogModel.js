// src/models/AuditLogModel.js

const mongoose = require("mongoose");
const { AUDIT_MODULES, AUDIT_ACTIONS } = require("./auditEnum");

const auditLogSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryModel",
      default: null,
      index: true,
    },

    module: {
      type: String,
      enum: Object.values(AUDIT_MODULES),
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    entityModel: {
      type: String,
      default: null,
    },

    entityLabel: {
      type: String,
      default: null,
      index: true, // ✅ OPTIMIZATION: search/filter ke liye useful
    },

    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
      index: true,
    },

    performedByName: {
      type: String,
      default: null,
    },

    performedByRole: {
      type: String,
      default: null,
    },

    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    request: {
      ipAddress: {
        type: String,
        default: null,
      },
      userAgent: {
        type: String,
        default: null,
      },
      method: {
        type: String,
        default: null,
      },
      path: {
        type: String,
        default: null,
      },
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
      index: true,
    },

    reason: {
      type: String,
      default: null,
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| ✅ QUERY OPTIMIZATION INDEXES
|--------------------------------------------------------------------------
| View modal / entity history ke liye sab se important index:
| businessId + module + entityId + createdAt
*/
auditLogSchema.index({ businessId: 1, module: 1, entityId: 1, createdAt: -1 });

/*
|--------------------------------------------------------------------------
| ✅ Business level logs ke liye
|--------------------------------------------------------------------------
*/
auditLogSchema.index({ businessId: 1, createdAt: -1 });

/*
|--------------------------------------------------------------------------
| ✅ Module/action filter ke liye
|--------------------------------------------------------------------------
*/
auditLogSchema.index({ businessId: 1, module: 1, createdAt: -1 });
auditLogSchema.index({ businessId: 1, action: 1, createdAt: -1 });

/*
|--------------------------------------------------------------------------
| ✅ User activity logs ke liye
|--------------------------------------------------------------------------
*/
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);