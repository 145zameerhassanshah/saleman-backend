const mongoose = require("mongoose");
const { productCategory } = require("../models/exporter");

const { createAuditLog } = require("../sevices/auditLog");
const { AUDIT_MODULES, AUDIT_ACTIONS } = require("../models/auditEnum");

/* =========================
   HELPERS
========================= */

const getUserBusinessId = (req) => {
  return req.user?.industry || req.user?.businessId || null;
};

const getListBusinessId = (req) => {
  return req.params.businessId || req.params.id || getUserBusinessId(req);
};

const getItemBusinessId = (req) => {
  return (
    req.params.businessId ||
    req.body.industry ||
    req.body.businessId ||
    getUserBusinessId(req)
  );
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

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return value === true || value === "true" || value === "1";
};

const cleanUpdateData = (body = {}) => {
  const updateData = {};

  if (body.name !== undefined) updateData.name = String(body.name).trim();

  if (body.order_no !== undefined) {
    updateData.order_no = Number(body.order_no) || 0;
  }

  if (body.is_active !== undefined) {
    updateData.is_active = parseBoolean(body.is_active, true);
  }

  return updateData;
};

/* =========================
   CREATE CATEGORY
========================= */

async function createCategory(req, res) {
  try {
    const businessId = getListBusinessId(req);

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const exists = await productCategory
      .findOne({
        businessId,
        name,
      })
      .collation({ locale: "en", strength: 2 })
      .select("_id")
      .lean();

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists in this business",
      });
    }

    const newCategory = await productCategory.create({
      name,
      businessId,
      order_no: Number(req.body.order_no || 0),
      is_active: parseBoolean(req.body.is_active, true),
    });

    await createAuditLog({
      req,
      businessId,
      module: AUDIT_MODULES.CATEGORY,
      entityId: newCategory._id,
      entityModel: "Category",
      entityLabel: newCategory.name,
      action: AUDIT_ACTIONS.CREATE,
      description: `Category ${newCategory.name} created`,
      after: newCategory,
    });

    return res.status(201).json({
      success: true,
      message: "Category added!",
      category: newCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
}

/* =========================
   GET BUSINESS CATEGORIES
========================= */

async function getIndustryCategory(req, res) {
  try {
    const businessId = getListBusinessId(req);

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const { page, limit, skip } = getPagination(req.query);
    const { search = "", is_active = "" } = req.query;

    const filter = { businessId };

    if (is_active !== "") {
      filter.is_active = parseBoolean(is_active, true);
    }

    if (search.trim()) {
      filter.name = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }

    const [categories, total] = await Promise.all([
      productCategory
        .find(filter)
        .select("businessId name order_no is_active createdAt updatedAt")
        .sort({ order_no: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      productCategory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      category: categories,
      categories,
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
      message: "Error fetching categories",
      error: error.message,
    });
  }
}

/* =========================
   SHOW ALL CATEGORIES
========================= */

async function showAll(req, res) {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { businessId = "", search = "", is_active = "" } = req.query;

    const filter = {};

    if (businessId) {
      if (!isValidObjectId(businessId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid business id",
        });
      }

      filter.businessId = businessId;
    }

    if (is_active !== "") {
      filter.is_active = parseBoolean(is_active, true);
    }

    if (search.trim()) {
      filter.name = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }

    const [categories, total] = await Promise.all([
      productCategory
        .find(filter)
        .select("businessId name order_no is_active createdAt updatedAt")
        .populate("businessId", "businessName name")
        .sort({ order_no: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      productCategory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      categories,
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
      message: "Something went wrong.",
      error: error.message,
    });
  }
}

/* =========================
   UPDATE CATEGORY
========================= */

async function updateCategory(req, res) {
  try {
    const id = req.params.id;
    const businessId = getItemBusinessId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const oldCategory = await productCategory
      .findOne({ _id: id, businessId })
      .lean();

    if (!oldCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const updateData = cleanUpdateData(req.body);

    if (!updateData.name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (updateData.name !== oldCategory.name) {
      const exists = await productCategory
        .findOne({
          businessId,
          name: updateData.name,
          _id: { $ne: id },
        })
        .collation({ locale: "en", strength: 2 })
        .select("_id")
        .lean();

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Category already exists in this business",
        });
      }
    }

    const updatedCategory = await productCategory
      .findOneAndUpdate({ _id: id, businessId }, updateData, {
        returnDocument: "after",
        runValidators: true,
      })
      .lean();

    await createAuditLog({
      req,
      businessId,
      module: AUDIT_MODULES.CATEGORY,
      entityId: updatedCategory._id,
      entityModel: "Category",
      entityLabel: updatedCategory.name,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Category ${updatedCategory.name} updated`,
      before: oldCategory,
      after: updatedCategory,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated!",
      category: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
}

/* =========================
   DELETE CATEGORY
========================= */

async function removeCategory(req, res) {
  try {
    const id = req.params.id;
    const businessId = getItemBusinessId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const deletedCategory = await productCategory
      .findOne({ _id: id, businessId })
      .lean();

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await createAuditLog({
      req,
      businessId,
      module: AUDIT_MODULES.CATEGORY,
      entityId: deletedCategory._id,
      entityModel: "Category",
      entityLabel: deletedCategory.name,
      action: AUDIT_ACTIONS.DELETE,
      description: `Category ${deletedCategory.name} deleted`,
      before: deletedCategory,
      after: null,
    });

    await productCategory.findOneAndDelete({ _id: id, businessId });

    return res.status(200).json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
}

module.exports = {
  createCategory,
  showAll,
  updateCategory,
  getIndustryCategory,
  removeCategory,
};