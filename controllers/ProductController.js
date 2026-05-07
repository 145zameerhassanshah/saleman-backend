const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const { productCategory } = require("../models/exporter");

const { createAuditLog } = require("../sevices/auditLog");
const { AUDIT_MODULES, AUDIT_ACTIONS } = require("../models/auditEnum");

/* =========================
   HELPERS
========================= */

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId || null;
};

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

const cleanObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) delete obj[key];
  });

  return obj;
};

/* =========================
   CREATE PRODUCT
========================= */

const createProduct = async (req, res) => {
  try {
    const businessId = getListBusinessId(req);

    const {
      name,
      sku,
      mrp,
      discount_percent,
      order_no,
      description,
      category_id,
      is_active,
    } = req.body;

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!sku || !sku.trim()) {
      return res.status(400).json({
        success: false,
        message: "SKU is required",
      });
    }

    if (!mrp || Number(mrp) <= 0) {
      return res.status(400).json({
        success: false,
        message: "MRP must be greater than 0",
      });
    }

    if (!isValidObjectId(category_id)) {
      return res.status(400).json({
        success: false,
        message: "Valid category is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    const category = await productCategory
      .findOne({
        _id: category_id,
        businessId,
        is_active: true,
      })
      .select("_id name")
      .lean();

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    const existProduct = await Product.findOne({
      businessId,
      sku: sku.trim(),
    })
      .select("_id")
      .lean();

    if (existProduct) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists in your business",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim(),
      mrp: Number(mrp),
      discount_percent: Number(discount_percent || 0),
      order_no: Number(order_no || 0),
      description: description || null,
      category_id,
      is_active: parseBoolean(is_active, true),
      businessId,
      image: req.file.path,
    });

    await createAuditLog({
      req,
      businessId,
      module: AUDIT_MODULES.PRODUCT,
      entityId: product._id,
      entityModel: "Product",
      entityLabel: product.name,
      action: AUDIT_ACTIONS.CREATE,
      description: `Product ${product.name} created`,
      after: product,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   GET PRODUCTS WITH PAGINATION
========================= */

const getProducts = async (req, res) => {
  try {
    const businessId = getListBusinessId(req);

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const { page, limit, skip } = getPagination(req.query);

    const {
      search = "",
      category_id = "",
      status = "",
      is_active = "",
    } = req.query;

    const filter = {
      businessId,
    };

    /* =========================
       CATEGORY FILTER
    ========================= */

    if (category_id) {
      if (!isValidObjectId(category_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category id",
        });
      }

      filter.category_id = category_id;
    }

    /* =========================
       ACTIVE / INACTIVE FILTER
       Frontend sends: status=active / inactive
    ========================= */

    if (status === "active") {
      filter.is_active = true;
    }

    if (status === "inactive") {
      filter.is_active = false;
    }

    // Also support old query: is_active=true/false
    if (is_active !== "") {
      filter.is_active = parseBoolean(is_active, true);
    }

    /* =========================
       SEARCH FILTER
       Product name, SKU, description, category name
    ========================= */

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      const matchedCategories = await productCategory
        .find({
          businessId,
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        })
        .select("_id")
        .lean();

      const categoryIds = matchedCategories.map((cat) => cat._id);

      filter.$or = [
        {
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          sku: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];

      if (categoryIds.length > 0) {
        filter.$or.push({
          category_id: {
            $in: categoryIds,
          },
        });
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(
          "businessId category_id image name sku mrp discount_percent description is_active order_no createdAt updatedAt"
        )
        .populate("category_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: total,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: err.message,
    });
  }
};
/* =========================
   GET PRODUCT BY ID
========================= */

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = getItemBusinessId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const filter = { _id: id };

    if (businessId && isValidObjectId(businessId)) {
      filter.businessId = businessId;
    }

    const product = await Product.findOne(filter)
      .populate("category_id", "_id name is_active")
      .populate("businessId", "_id businessName name business_logo")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const discountAmount =
      Number(product.mrp || 0) * (Number(product.discount_percent || 0) / 100);

    const salePrice = Number(product.mrp || 0) - discountAmount;

    return res.status(200).json({
      success: true,
      product: {
        ...product,
        discountAmount,
        salePrice,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: err.message,
    });
  }
};
/* =========================
   UPDATE PRODUCT
========================= */

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = getItemBusinessId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    // ✅ old product populated, so history mein category name aaye
    const oldProduct = await Product.findOne({
      _id: id,
      businessId,
    })
      .populate("category_id", "_id name")
      .populate("businessId", "_id businessName name")
      .lean();

    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (req.body.sku && req.body.sku.trim() !== oldProduct.sku) {
      const existing = await Product.findOne({
        sku: req.body.sku.trim(),
        businessId,
        _id: { $ne: id },
      })
        .select("_id")
        .lean();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "SKU already used",
        });
      }
    }

    if (req.body.category_id) {
      if (!isValidObjectId(req.body.category_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category id",
        });
      }

      const category = await productCategory
        .findOne({
          _id: req.body.category_id,
          businessId,
        })
        .select("_id name is_active")
        .lean();

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
    }

    const updateData = cleanObject({
      name: req.body.name?.trim(),
      sku: req.body.sku?.trim(),
      mrp: req.body.mrp !== undefined ? Number(req.body.mrp) : undefined,
      discount_percent:
        req.body.discount_percent !== undefined
          ? Number(req.body.discount_percent)
          : undefined,
      order_no:
        req.body.order_no !== undefined ? Number(req.body.order_no) : undefined,
      description:
        req.body.description !== undefined ? req.body.description : undefined,
      category_id: req.body.category_id || undefined,
      is_active:
        req.body.is_active !== undefined
          ? parseBoolean(req.body.is_active, oldProduct.is_active)
          : undefined,
    });

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: id,
        businessId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("category_id", "_id name")
      .populate("businessId", "_id businessName name")
      .lean();

    await createAuditLog({
      req,
      businessId,
      module: AUDIT_MODULES.PRODUCT,
      entityId: updatedProduct._id,
      entityModel: "Product",
      entityLabel: updatedProduct.name,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Product ${updatedProduct.name} updated`,
      before: oldProduct,
      after: updatedProduct,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};/* =========================
   DELETE PRODUCT
========================= */

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = getItemBusinessId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const product = await Product.findOne({
      _id: id,
      businessId,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await createAuditLog({
      req,
      businessId,
      module: AUDIT_MODULES.PRODUCT,
      entityId: product._id,
      entityModel: "Product",
      entityLabel: product.name,
      action: AUDIT_ACTIONS.DELETE,
      description: `Product ${product.name} deleted`,
      before: product,
      after: null,
    });

    await Product.findOneAndDelete({
      _id: id,
      businessId,
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Delete failed",
      error: err.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};