// const {
//   industryModel,
//   dealerModel,
//   userModel,
//   orderModel,
//   orderItemModel,
//   quotationModel,
//   quotationItem
// } = require("../models/exporter");
// const mongoose = require("mongoose");

// /* ================= GET ALL ================= */
// async function getAllIndustries(req, res) {
//   try {
//     const industry = await industryModel.find();

//     res.status(200).json({
//       success: true,
//       count: industry.length,
//       industry,
//     });

//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// /* ================= CREATE ================= */
// async function createIndustry(req, res) {
//   try {
//     // 🔥 DEBUG LOGS
//     console.log("BODY:", req.body);
//     console.log("FILES:", req.files);
//     console.log("USER:", req.user);

//     const {
//       businessName,
//       registrationNo,
//       bussinesEmail,
//       taxId
//     } = req.body;

//     /* ===== REQUIRED VALIDATION ===== */
//     if (!businessName || !registrationNo || !taxId) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields missing",
//       });
//     }

//     /* ===== EXIST CHECK ===== */
//     if (await industryModel.findOne({ bussinesEmail })) {
//       return res.status(400).json({
//         success: false,
//         message: "Email already exists",
//       });
//     }

//     if (await industryModel.findOne({ businessName })) {
//       return res.status(400).json({
//         success: false,
//         message: "Business name already exists",
//       });
//     }

//     if (await industryModel.findOne({ registrationNo })) {
//       return res.status(400).json({
//         success: false,
//         message: "Registration number already exists",
//       });
//     }

//     /* ===== HANDLE IMAGES (FIXED) ===== */
//     let business_logo = null;
//     let addressLogo = null;

//     if (req.files) {
//       if (req.files.business_logo) {
//         business_logo = req.files.business_logo[0].path;
//       }

//       if (req.files.addressLogo) {
//         addressLogo = req.files.addressLogo[0].path;
//       }
//     }

//     /* ===== IMAGE VALIDATION ===== */
//     if (!business_logo || !addressLogo) {
//       return res.status(400).json({
//         success: false,
//         message: "Both Business Logo and Address Logo are required",
//       });
//     }

//     /* ===== CREATE ===== */
//     const industry = new industryModel({
//       ...req.body,
//       business_logo,
//       addressLogo,
//       createdBy: req.user?.id || null, 
//     });

//     await industry.save();

//     res.status(201).json({
//       success: true,
//       message: "Business created successfully",
//       industry,
//     });

//   } catch (error) {
//     console.log("❌ ERROR:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message, 
//     });
//   }
// }

// /* ================= GET BY ID ================= */
// async function getIndustryById(req, res) {
//   try {
//     const id = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Industry ID",
//       });
//     }

//     const industry = await industryModel.findById(id);

//     if (!industry) {
//       return res.status(404).json({
//         success: false,
//         message: "Industry not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       industry,
//     });

//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// /* ================= UPDATE ================= */
// const updateIndustry = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid industry ID",
//       });
//     }

//     let updateData = { ...req.body };

//     // 🔥 HANDLE IMAGES
//     if (req.files) {
//       if (req.files.business_logo) {
//         updateData.business_logo = req.files.business_logo[0].path;
//       }

//       if (req.files.addressLogo) {
//         updateData.addressLogo = req.files.addressLogo[0].path;
//       }
//     }

//     const industry = await industryModel.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!industry) {
//       return res.status(404).json({
//         success: false,
//         message: "Industry not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Industry updated successfully",
//       industry,
//     });

//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// /* ================= DELETE ================= */

// const deleteIndustry = async (req, res) => {
//   try {
//     const { id } = req.params;

//     /* ================= VALIDATION ================= */
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid industry ID",
//       });
//     }

//     const industry = await industryModel.findById(id);

//     if (!industry) {
//       return res.status(404).json({
//         success: false,
//         message: "Industry not found",
//       });
//     }

//     /* ================= CASCADE DELETE ================= */

//     // 1. Dealers
//     await dealerModel.deleteMany({ businessId: id });

//     // 2. Users (Admin, Salesman, Accountant)
//     await userModel.deleteMany({ industry: id });

//     // 3. Orders + Order Items
//     const orders = await orderModel.find({ businessId: id }).select("_id");

//     const orderIds = orders.map(o => o._id);

//     await orderItemModel.deleteMany({ order_id: { $in: orderIds } });
//     await orderModel.deleteMany({ businessId: id });

//     // 4. Quotations + Items
//     const quotations = await quotationModel.find({ businessId: id }).select("_id");

//     const quotationIds = quotations.map(q => q._id);

//     await quotationItem.deleteMany({ quotation_id: { $in: quotationIds } });
//     await quotationModel.deleteMany({ businessId: id });

//     // 5. Finally Industry
//     await industryModel.findByIdAndDelete(id);

//     /* ================= RESPONSE ================= */

//     res.status(200).json({
//       success: true,
//       message: "Industry and all related data deleted successfully",
//     });

//   } catch (error) {
//     console.log("❌ DELETE ERROR:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   createIndustry,
//   getAllIndustries,
//   deleteIndustry,
//   getIndustryById,
//   updateIndustry,
// };




const {
  industryModel,
  dealerModel,
  userModel,
  orderModel,
  orderItemModel,
  quotationModel,
  quotationItem,
} = require("../models/exporter");

const Product = require("../models/ProductModel");
const { productCategory } = require("../models/exporter");

const mongoose = require("mongoose");

const { createAuditLog } = require("../sevices/auditLog");
const { AUDIT_MODULES, AUDIT_ACTIONS } = require("../models/auditEnum");

/* =========================
   HELPERS
========================= */

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(String(id));
};

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId || null;
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
   GET ALL WITH PAGINATION
========================= */

async function getAllIndustries(req, res) {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const {
      search = "",
      status = "",
    } = req.query;

    const filter = {};

    if (status === "active") filter.is_active = true;
    if (status === "inactive") filter.is_active = false;

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      filter.$or = [
        { industry: { $regex: safeSearch, $options: "i" } },
        { businessName: { $regex: safeSearch, $options: "i" } },
        { bussinesEmail: { $regex: safeSearch, $options: "i" } },
        { registrationNo: { $regex: safeSearch, $options: "i" } },
        { taxId: { $regex: safeSearch, $options: "i" } },
        { city: { $regex: safeSearch, $options: "i" } },
        { address: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [industries, total] = await Promise.all([
      industryModel
        .find(filter)
        .populate("created_by", "name email user_type")
        .populate("updated_by", "name email user_type")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      industryModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      // old frontend compatibility
      industry: industries,

      // new clean key
      industries,

      count: industries.length,
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
      message: "Error fetching businesses",
      error: error.message,
    });
  }
}

/* =========================
   CREATE
========================= */

async function createIndustry(req, res) {
  try {
    const userId = getUserId(req);

    if (!isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Login user not found",
      });
    }

    const {
      industry,
      businessName,
      registrationNo,
      bussinesEmail,
      taxId,
      address,
      city,
      startDate,
    } = req.body;

    if (!industry?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Industry is required",
      });
    }

    if (!businessName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Business name is required",
      });
    }

    if (!registrationNo?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Registration number is required",
      });
    }

    if (!taxId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tax ID is required",
      });
    }

    if (!city?.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const email = bussinesEmail?.trim()?.toLowerCase();

    const duplicateFilter = {
      $or: [
        { businessName: businessName.trim() },
        { registrationNo: registrationNo.trim() },
      ],
    };

    if (email) {
      duplicateFilter.$or.push({ bussinesEmail: email });
    }

    const exists = await industryModel.findOne(duplicateFilter).lean();

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Business name, email or registration number already exists",
      });
    }

    let business_logo = null;
    let addressLogo = null;

    if (req.files?.business_logo?.[0]) {
      business_logo = req.files.business_logo[0].path;
    }

    if (req.files?.addressLogo?.[0]) {
      addressLogo = req.files.addressLogo[0].path;
    }

    if (!business_logo || !addressLogo) {
      return res.status(400).json({
        success: false,
        message: "Both Business Logo and Address Logo are required",
      });
    }

    const newIndustry = await industryModel.create({
      industry: industry.trim(),
      businessName: businessName.trim(),
      registrationNo: registrationNo.trim(),
      bussinesEmail: email || null,
      taxId: taxId.trim(),
      address: address?.trim() || null,
      city: city.trim(),
      startDate: startDate || null,
      business_logo,
      addressLogo,

      created_by: userId,
      updated_by: null,
    });

    await createAuditLog({
      req,
      businessId: newIndustry._id,
      module: AUDIT_MODULES.INDUSTRY,
      entityId: newIndustry._id,
      entityModel: "IndustryModel",
      entityLabel: newIndustry.businessName,
      action: AUDIT_ACTIONS.CREATE,
      description: `Business ${newIndustry.businessName} created`,
      after: newIndustry,
    });

    return res.status(201).json({
      success: true,
      message: "Business created successfully",
      industry: newIndustry,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];

      const labelMap = {
        businessName: "Business name",
        registrationNo: "Registration number",
        bussinesEmail: "Business email",
      };

      return res.status(400).json({
        success: false,
        message: `${labelMap[field] || field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Business creation failed",
    });
  }
}

/* =========================
   GET BY ID
========================= */

async function getIndustryById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid industry ID",
      });
    }

    const industry = await industryModel
      .findById(id)
      .populate("created_by", "name email user_type")
      .populate("updated_by", "name email user_type")
      .lean();

    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Industry not found",
      });
    }

    return res.status(200).json({
      success: true,
      industry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching business",
      error: error.message,
    });
  }
}

/* =========================
   UPDATE
========================= */

const updateIndustry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid industry ID",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Login user not found",
      });
    }

    const oldIndustry = await industryModel.findById(id).lean();

    if (!oldIndustry) {
      return res.status(404).json({
        success: false,
        message: "Industry not found",
      });
    }

    if (
      req.body.businessName &&
      req.body.businessName.trim() !== oldIndustry.businessName
    ) {
      const exists = await industryModel
        .findOne({
          _id: { $ne: id },
          businessName: req.body.businessName.trim(),
        })
        .select("_id")
        .lean();

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Business name already exists",
        });
      }
    }

    if (
      req.body.registrationNo &&
      req.body.registrationNo.trim() !== oldIndustry.registrationNo
    ) {
      const exists = await industryModel
        .findOne({
          _id: { $ne: id },
          registrationNo: req.body.registrationNo.trim(),
        })
        .select("_id")
        .lean();

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Registration number already exists",
        });
      }
    }

    if (
      req.body.bussinesEmail &&
      req.body.bussinesEmail.trim().toLowerCase() !== oldIndustry.bussinesEmail
    ) {
      const exists = await industryModel
        .findOne({
          _id: { $ne: id },
          bussinesEmail: req.body.bussinesEmail.trim().toLowerCase(),
        })
        .select("_id")
        .lean();

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Business email already exists",
        });
      }
    }

    const updateData = cleanObject({
      industry: req.body.industry?.trim(),
      businessName: req.body.businessName?.trim(),
      registrationNo: req.body.registrationNo?.trim(),
      bussinesEmail: req.body.bussinesEmail?.trim()?.toLowerCase(),
      taxId: req.body.taxId?.trim(),
      address: req.body.address?.trim(),
      city: req.body.city?.trim(),
      startDate: req.body.startDate || undefined,
      is_active:
        req.body.is_active !== undefined
          ? parseBoolean(req.body.is_active, oldIndustry.is_active)
          : undefined,
      updated_by: userId,
    });

    if (req.files?.business_logo?.[0]) {
      updateData.business_logo = req.files.business_logo[0].path;
    }

    if (req.files?.addressLogo?.[0]) {
      updateData.addressLogo = req.files.addressLogo[0].path;
    }

    const updatedIndustry = await industryModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
      .lean();

    await createAuditLog({
      req,
      businessId: updatedIndustry._id,
      module: AUDIT_MODULES.INDUSTRY,
      entityId: updatedIndustry._id,
      entityModel: "IndustryModel",
      entityLabel: updatedIndustry.businessName,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Business ${updatedIndustry.businessName} updated`,
      before: oldIndustry,
      after: updatedIndustry,
    });

    return res.status(200).json({
      success: true,
      message: "Industry updated successfully",
      industry: updatedIndustry,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];

      const labelMap = {
        businessName: "Business name",
        registrationNo: "Registration number",
        bussinesEmail: "Business email",
      };

      return res.status(400).json({
        success: false,
        message: `${labelMap[field] || field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Update failed",
    });
  }
};

/* =========================
   DELETE WITH CASCADE + AUDIT
========================= */

const deleteIndustry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid industry ID",
      });
    }

    const industry = await industryModel.findById(id).lean();

    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Industry not found",
      });
    }

    await createAuditLog({
      req,
      businessId: industry._id,
      module: AUDIT_MODULES.INDUSTRY,
      entityId: industry._id,
      entityModel: "IndustryModel",
      entityLabel: industry.businessName,
      action: AUDIT_ACTIONS.DELETE,
      description: `Business ${industry.businessName} deleted`,
      before: industry,
      after: null,
    });

    /* ================= CASCADE DELETE ================= */

    await dealerModel.deleteMany({ businessId: id });

    await userModel.deleteMany({ industry: id });

    if (Product) {
      await Product.deleteMany({ businessId: id });
    }

    if (productCategory) {
      await productCategory.deleteMany({ businessId: id });
    }

    const orders = await orderModel.find({ businessId: id }).select("_id").lean();
    const orderIds = orders.map((o) => o._id);

    if (orderIds.length > 0) {
      await orderItemModel.deleteMany({
        order_id: { $in: orderIds },
      });
    }

    await orderModel.deleteMany({ businessId: id });

    const quotations = await quotationModel
      .find({ businessId: id })
      .select("_id")
      .lean();

    const quotationIds = quotations.map((q) => q._id);

    if (quotationIds.length > 0) {
      await quotationItem.deleteMany({
        quotation_id: { $in: quotationIds },
      });
    }

    await quotationModel.deleteMany({ businessId: id });

    await industryModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Industry and all related data deleted successfully",
    });
  } catch (error) {
    console.log("DELETE INDUSTRY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};

module.exports = {
  createIndustry,
  getAllIndustries,
  deleteIndustry,
  getIndustryById,
  updateIndustry,
};