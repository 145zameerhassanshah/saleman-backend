const mongoose = require("mongoose");
const {
  quotationModel,
  quotationItem,
  dealerModel,
  productModel,
  productCategory,
} = require("../models/exporter");

const puppeteer = require("puppeteer");

const { createAuditLog } = require("../sevices/auditLog");
const { AUDIT_MODULES, AUDIT_ACTIONS } = require("../models/auditEnum");

/* ================================
   HELPERS
================================ */

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId || null;
};

const getUserRole = (req) => {
  return String(req.user?.user_type || req.user?.role || "").toLowerCase();
};

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return value._id;
  return value;
};

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(String(id));
};

const round2 = (value) => {
  return Math.round((Number(value) || 0) * 100) / 100;
};

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeAmountType = (type, defaultType = "fixed") => {
  const value = String(type || "").toLowerCase();

  if (value === "percentage" || value === "percent") return "percentage";
  if (value === "fixed" || value === "amount") return "fixed";

  return defaultType;
};

const calculateLineTotal = (item) => {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unit_price) || 0;
  const discountVal = Number(item.discount_percent) || 0;

  const gross = qty * price;
  const discountType = normalizeAmountType(item.discount_type, "percentage");

  const discountAmount =
    discountType === "fixed" ? discountVal : (gross * discountVal) / 100;

  return round2(Math.max(gross - discountAmount, 0));
};

const calculateQuotationTotals = (
  items,
  discount,
  discount_type,
  tax,
  tax_type
) => {
  const subtotal = round2(
    items.reduce((sum, item) => sum + calculateLineTotal(item), 0)
  );

  const finalDiscountType = normalizeAmountType(discount_type, "fixed");
  const finalTaxType = normalizeAmountType(tax_type, "fixed");

  const discountAmount =
    finalDiscountType === "percentage"
      ? round2((subtotal * Number(discount || 0)) / 100)
      : round2(Number(discount || 0));

  const taxable = Math.max(subtotal - discountAmount, 0);

  const taxAmount =
    finalTaxType === "percentage"
      ? round2((taxable * Number(tax || 0)) / 100)
      : round2(Number(tax || 0));

  const total = round2(taxable + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
};

const buildPreparedItems = async (items = []) => {
  const validItems = items.filter((item) => {
    return (
      (getId(item.product_id) || item.item_name) &&
      Number(item.quantity) > 0 &&
      Number(item.unit_price) >= 0
    );
  });

  if (!validItems.length) {
    return {
      success: false,
      message: "Please add at least one valid quotation item",
      items: [],
    };
  }

  /*
  |--------------------------------------------------------------------------
  | QUERY OPTIMIZATION
  |--------------------------------------------------------------------------
  | Product/category ko loop ke andar baar baar query nahi kar rahe.
  | Pehle all productIds/categoryIds collect, phir single query.
  */
  const productIds = [
    ...new Set(
      validItems
        .map((item) => getId(item.product_id))
        .filter((id) => isValidObjectId(id))
        .map(String)
    ),
  ];

  const categoryIds = [
    ...new Set(
      validItems
        .map((item) => getId(item.category_id))
        .filter((id) => isValidObjectId(id))
        .map(String)
    ),
  ];

  const [products, activeCategories] = await Promise.all([
    productIds.length
      ? productModel
          .find({ _id: { $in: productIds }, is_active: true })
          .select("_id name category_id mrp")
          .lean()
      : [],

    categoryIds.length
      ? productCategory
          .find({ _id: { $in: categoryIds }, is_active: true })
          .select("_id")
          .lean()
      : [],
  ]);

  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const activeCategorySet = new Set(
    activeCategories.map((c) => String(c._id))
  );

  const preparedItems = [];

  for (const item of validItems) {
    const productId = getId(item.product_id);
    const categoryId = getId(item.category_id);

    if (categoryId && !activeCategorySet.has(String(categoryId))) {
      return {
        success: false,
        message: "Selected category is inactive or invalid",
        items: [],
      };
    }

    let product = null;

    if (productId) {
      product = productMap.get(String(productId));

      if (!product) {
        return {
          success: false,
          message: "Product not found or inactive",
          items: [],
        };
      }

      if (
        categoryId &&
        product.category_id &&
        String(product.category_id) !== String(categoryId)
      ) {
        return {
          success: false,
          message: "Product does not belong to selected category",
          items: [],
        };
      }
    }

    const itemName = product?.name || item.item_name;

    if (!itemName) continue;

    const preparedItem = {
      product_id: productId || null,
      category_id: categoryId || null,
      item_name: itemName,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      discount_percent: Number(item.discount_percent) || 0,
      discount_type: normalizeAmountType(item.discount_type, "percentage"),
    };

    preparedItem.total = calculateLineTotal(preparedItem);

    preparedItems.push(preparedItem);
  }

  if (!preparedItems.length) {
    return {
      success: false,
      message: "Please add at least one valid quotation item",
      items: [],
    };
  }

  return {
    success: true,
    items: preparedItems,
  };
};

/* ================================
   GET PRODUCTS BY CATEGORY
================================ */

async function getProductsByCategory(req, res) {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    const products = await productModel
      .find({
        category_id: categoryId,
        is_active: true,
      })
      .select("name mrp discount_percent code category_id")
      .sort({ name: 1 })
      .lean(); // ✅ OPTIMIZATION

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================================
   LIST QUOTATIONS
================================ */

async function showAll(req, res) {
  try {
    const { businessId } = req.params;
    const userId = getUserId(req);
    const role = getUserRole(req);

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {
      businessId,
    };

    if (role === "salesman") {
      filter.created_by = userId;
    }

    if (status) {
      filter.status = String(status).toLowerCase();
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY OPTIMIZATION
    |--------------------------------------------------------------------------
    | Prefix search index-friendly hoti hai.
    | Agar contains search chahiye ho to regex me ^ remove kar sakte ho,
    | lekin wo slow ho sakti hai.
    */
    if (search.trim()) {
      filter.quotation_number = {
        $regex: `^${escapeRegex(search.trim())}`,
        $options: "i",
      };
    }

    const [quotations, total] = await Promise.all([
      quotationModel
        .find(filter)
        .select(
          "businessId quotation_number dealer_id quotation_date valid_until subtotal discount tax total discount_type tax_type status created_by updated_by deliveryNotes createdAt"
        )
        .populate("businessId", "businessName business_logo addressLogo name")
        .populate("dealer_id", "name phone_number whatsapp_number")
        .populate("created_by", "name email role user_type")
        .populate("updated_by", "name email role user_type")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(), // ✅ OPTIMIZATION

      quotationModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      quotations,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================================
   CREATE QUOTATION
================================ */

async function create(req, res) {
  try {
    const { businessId } = req.params;
    const userId = getUserId(req);
    const role = getUserRole(req);

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business id",
      });
    }

    const {
      dealer_id,
      quotation_date,
      valid_until,
      items = [],
      discount = 0,
      tax = 0,
      discount_type = "fixed",
      tax_type = "fixed",
      notes,
      deliveryNotes,
    } = req.body;

    if (!dealer_id) {
      return res.status(400).json({
        success: false,
        message: "Dealer required",
      });
    }

    const dealer = await dealerModel
      .findOne({ _id: dealer_id, businessId })
      .select("_id")
      .lean(); // ✅ OPTIMIZATION

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
      });
    }

    const preparedResult = await buildPreparedItems(items);

    if (!preparedResult.success) {
      return res.status(400).json({
        success: false,
        message: preparedResult.message,
      });
    }

    const preparedItems = preparedResult.items;

    const finalDiscountType = normalizeAmountType(discount_type, "fixed");
    const finalTaxType = normalizeAmountType(tax_type, "fixed");

    const { subtotal, discountAmount, taxAmount, total } =
      calculateQuotationTotals(
        preparedItems,
        discount,
        finalDiscountType,
        tax,
        finalTaxType
      );

    const quotationNumber = await generateQuotationNumber();

    const quotationStatus = role === "admin" ? "approved" : "pending";

    const quotation = await quotationModel.create({
      businessId,
      quotation_number: quotationNumber,
      dealer_id,
      quotation_date,
      valid_until,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      discount_type: finalDiscountType,
      tax_type: finalTaxType,
      notes,
      deliveryNotes,
      created_by: userId,
      status: quotationStatus,
    });

    /*
    |--------------------------------------------------------------------------
    | QUERY OPTIMIZATION
    |--------------------------------------------------------------------------
    | Loop ke andar create ki jagah insertMany.
    */
    const createdItems = await quotationItem.insertMany(
      preparedItems.map((item) => ({
        quotation_id: quotation._id,
        ...item,
      }))
    );

    await createAuditLog({
      req,
      businessId: quotation.businessId,
      module: AUDIT_MODULES.QUOTATION,
      entityId: quotation._id,
      entityModel: "Quotation",
      entityLabel: quotation.quotation_number,
      action: AUDIT_ACTIONS.CREATE,
      description: `Quotation ${quotation.quotation_number} created`,
      after: quotation,
      meta: {
        items: createdItems,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================================
   UPDATE QUOTATION
================================ */

async function update(req, res) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const role = getUserRole(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation id",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY OPTIMIZATION
    |--------------------------------------------------------------------------
    | Pehle old quotation lean me lao. Separate document load ki zaroorat nahi.
    */
    const oldQuotation = await quotationModel.findById(id).lean();

    if (!oldQuotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (role !== "admin") {
      if (String(oldQuotation.created_by) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: "Not your quotation",
        });
      }

      if (!["pending", "rejected"].includes(oldQuotation.status)) {
        return res.status(403).json({
          success: false,
          message: "Cannot update quotation with current status",
        });
      }
    }

    if (role === "admin") {
      if (!["pending", "approved", "rejected"].includes(oldQuotation.status)) {
        return res.status(403).json({
          success: false,
          message: "Cannot update quotation with current status",
        });
      }
    }

    const oldItems = await quotationItem
      .find({ quotation_id: id })
      .lean(); // ✅ OPTIMIZATION

    const preparedResult = await buildPreparedItems(req.body.items || []);

    if (!preparedResult.success) {
      return res.status(400).json({
        success: false,
        message: preparedResult.message,
      });
    }

    const preparedItems = preparedResult.items;

    const discountInput = Number(req.body.discount) || 0;
    const taxInput = Number(req.body.tax) || 0;

    const finalDiscountType = normalizeAmountType(
      req.body.discount_type,
      "fixed"
    );
    const finalTaxType = normalizeAmountType(req.body.tax_type, "fixed");

    const { subtotal, discountAmount, taxAmount, total } =
      calculateQuotationTotals(
        preparedItems,
        discountInput,
        finalDiscountType,
        taxInput,
        finalTaxType
      );

    const updatePayload = {
      valid_until: req.body.valid_until || null,
      deliveryNotes: req.body.deliveryNotes || null,
      notes: req.body.notes || null,
      discount_type: finalDiscountType,
      tax_type: finalTaxType,
      dealer_id: req.body.dealer_id,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      updated_by: userId,
    };

    /*
    |--------------------------------------------------------------------------
    | MONGOOSE WARNING FIX
    |--------------------------------------------------------------------------
    | new: true deprecated warning avoid karne ke liye returnDocument: "after"
    */
    const updatedQuotation = await quotationModel
      .findByIdAndUpdate(id, updatePayload, {
        returnDocument: "after",
        runValidators: true,
      })
      .lean();

    await quotationItem.deleteMany({ quotation_id: id });

    const newItems = await quotationItem.insertMany(
      preparedItems.map((item) => ({
        quotation_id: id,
        ...item,
      }))
    );

    await createAuditLog({
      req,
      businessId: updatedQuotation.businessId,
      module: AUDIT_MODULES.QUOTATION,
      entityId: updatedQuotation._id,
      entityModel: "Quotation",
      entityLabel: updatedQuotation.quotation_number,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Quotation ${updatedQuotation.quotation_number} updated`,
      before: oldQuotation,
      after: updatedQuotation,
      meta: {
        oldItems,
        newItems,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: updatedQuotation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================================
   DELETE QUOTATION
================================ */

async function remove(req, res) {
  try {
    const role = getUserRole(req);
    const { id } = req.params;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete quotation",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation id",
      });
    }

    const quotation = await quotationModel.findById(id).lean();

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const oldItems = await quotationItem.find({ quotation_id: id }).lean();

    await createAuditLog({
      req,
      businessId: quotation.businessId,
      module: AUDIT_MODULES.QUOTATION,
      entityId: quotation._id,
      entityModel: "Quotation",
      entityLabel: quotation.quotation_number,
      action: AUDIT_ACTIONS.DELETE,
      description: `Quotation ${quotation.quotation_number} deleted`,
      before: quotation,
      after: null,
      meta: {
        deletedItems: oldItems,
      },
    });

    await Promise.all([
      quotationItem.deleteMany({ quotation_id: id }),
      quotationModel.findByIdAndDelete(id),
    ]);

    return res.status(200).json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================================
   GET QUOTATION BY ID
================================ */

async function getQuotationById(req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation id",
      });
    }

    const quotation = await quotationModel
      .findById(id)
      .select(
        "businessId quotation_number dealer_id quotation_date valid_until subtotal discount tax total discount_type tax_type status created_by updated_by notes deliveryNotes createdAt"
      )
      .populate("businessId", "businessName business_logo addressLogo name")
.populate(
  "dealer_id",
  "name company_name city phone_number whatsapp_number address business_logo"
)
      .populate("created_by", "name email role user_type")
      .populate("updated_by", "name email role user_type")
      .lean(); // ✅ OPTIMIZATION

    if (!quotation?.businessId) {
      return res.status(400).json({
        success: false,
        message: "Business data missing",
      });
    }

    const items = await quotationItem
      .find({ quotation_id: id })
      .select(
        "quotation_id category_id product_id item_name description quantity unit_price discount_percent discount_type total"
      )
      .populate("product_id", "name mrp code")
      .populate("category_id", "_id name")
      .sort({ createdAt: 1 })
      .lean(); // ✅ OPTIMIZATION

    const formattedItems = items.map((item) => ({
      _id: item._id,
      category_id: item.category_id?._id || item.category_id || "",
      category_name: item.category_id?.name || "",
      product_id: item.product_id?._id || item.product_id || null,
      product_name: item.product_id?.name || "",
      item_name: item.item_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      discount_type: item.discount_type || "percentage",
      total: item.total,
    }));

    return res.status(200).json({
      success: true,
      quotation,
      items: formattedItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

/* ================================
   UPDATE QUOTATION STATUS
================================ */

async function updateQuotationStatus(req, res) {
  try {
    const id = req.params.id;
    const status = String(req.body.status || "").toLowerCase();

    const validStatuses = ["approved", "rejected", "pending"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation id",
      });
    }

    const oldQuotation = await quotationModel.findById(id).lean();

    if (!oldQuotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const updatedQuotation = await quotationModel
      .findByIdAndUpdate(
        id,
        {
          status,
          updated_by: getUserId(req),
        },
        {
          returnDocument: "after",
          runValidators: true,
        }
      )
      .lean();

    let action = AUDIT_ACTIONS.STATUS_CHANGE;

    if (status === "approved") action = AUDIT_ACTIONS.APPROVE;
    if (status === "rejected") action = AUDIT_ACTIONS.REJECT;

    await createAuditLog({
      req,
      businessId: updatedQuotation.businessId,
      module: AUDIT_MODULES.QUOTATION,
      entityId: updatedQuotation._id,
      entityModel: "Quotation",
      entityLabel: updatedQuotation.quotation_number,
      action,
      description: `Quotation ${updatedQuotation.quotation_number} status changed from ${oldQuotation.status} to ${updatedQuotation.status}`,
      before: oldQuotation,
      after: updatedQuotation,
    });

    return res.status(200).json({
      success: true,
      message: `Quotation ${status} successfully`,
      data: updatedQuotation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

/* ================================
   DOWNLOAD PDF
================================ */

async function downloadPDF(req, res) {
  let browser;

  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation id",
      });
    }

    const quotation = await quotationModel
      .findById(id)
      .select("quotation_number")
      .lean();

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const url = `${process.env.CLIENT_URL}/quotation/print/${id}`;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    if (req.headers.cookie) {
      await page.setExtraHTTPHeaders({
        Cookie: req.headers.cookie,
      });
    }

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    await page.waitForSelector("#invoice", {
      timeout: 10000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=quotation-${quotation.quotation_number}.pdf`,
    });

    return res.send(pdf);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/* ================================
   GENERATE QUOTATION NUMBER
================================ */

async function generateQuotationNumber() {
  /*
  |--------------------------------------------------------------------------
  | QUERY OPTIMIZATION
  |--------------------------------------------------------------------------
  | Sirf quotation_number select kar rahe hain, full document nahi.
  */
  const last = await quotationModel
    .findOne()
    .select("quotation_number")
    .sort({ createdAt: -1 })
    .lean();

  let serial = 1;

  if (last?.quotation_number) {
    const match = last.quotation_number.match(/QTN-(\d+)-/);
    if (match) serial = parseInt(match[1], 10) + 1;
  }

  const serialFormatted = String(serial).padStart(4, "0");

  const today = new Date();
  const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today
    .getFullYear()
    .toString()
    .slice(-2)}`;

  return `QTN-${serialFormatted}-${formattedDate}`;
}

/* ================================
   EXPORTS
================================ */

module.exports = {
  showAll,
  create,
  update,
  remove,
  getProductsByCategory,
  updateQuotationStatus,
  getQuotationById,
  downloadPDF,
};