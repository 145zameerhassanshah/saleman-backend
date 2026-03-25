const mongoose = require("mongoose");
const {
  quotationModel,
  quotationItem,
  dealerModel,
  productModel,
  productCategory,
} = require("../models/exporter");

/* ================================
   GET PRODUCTS BY CATEGORY
================================ */

async function getProductsByCategory(req, res) {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const products = await productModel.find({
      category_id: categoryId,
      is_active: true,
    }).select("name mrp discount_percent code category_id");

    return res.status(200).json({ products });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ================================
   LIST
================================ */

async function showAll(req, res) {
  try {
    const { businessId } = req.params;

    const quotations = await quotationModel
      .find({ businessId })
      .populate("dealer_id")
      .populate("created_by", "name email")
      .populate("updated_by", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ quotations });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ================================
   CREATE
================================ */

async function create(req, res) {
  try {
    const { businessId } = req.params;

    const userId = req.user.id;
    const role = req.user.role?.toLowerCase(); 

    const {
      dealer_id,
      quotation_date,
      valid_until,
      items,
      discount,
      tax,
      discount_type,
      tax_type,
      notes,
      deliveryNotes,
    } = req.body;

    if (!dealer_id) {
      return res.status(400).json({ message: "Dealer required" });
    }

    const dealer = await dealerModel.findOne({ _id: dealer_id, businessId });

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    let subtotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const product = await productModel.findOne({
        _id: item.product_id,
        category_id: item.category_id,
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const qty = Number(item.quantity);
      const price = Number(item.unit_price);
      const disc = Number(item.discount_percent) || 0;

      const gross = qty * price;
      subtotal += gross;

      preparedItems.push({
        product_id: item.product_id,
        category_id: item.category_id,
        item_name: product.name,
        quantity: qty,
        unit_price: price,
        discount_percent: disc,
        total: gross - (gross * disc) / 100,
      });
    }

    const discountAmount =
      discount_type === "percentage"
        ? (subtotal * discount) / 100
        : discount || 0;

    const taxable = subtotal - discountAmount;

    const taxAmount =
      tax_type === "percentage"
        ? (taxable * tax) / 100
        : tax || 0;

    const total = taxable + taxAmount;

    const quotationNumber = await generateQuotationNumber();

    const status = role === "admin" ? "approved" : "pending";

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
      discount_type,
      tax_type,
      notes,
      deliveryNotes,
      created_by: userId,
      updated_by: userId, 
      status,
    });

    for (const item of preparedItems) {
      await quotationItem.create({
        quotation_id: quotation._id,
        ...item,
      });
    }

    return res.status(201).json({
      message: "Quotation created successfully",
      quotation,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ================================
   UPDATE
================================ */

async function update(req, res) {
  try {
    const { id } = req.params;

    const userId = req.user._id;
    const role = req.user.user_type?.toLowerCase();

    const quotation = await quotationModel.findById(id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // 🔒 ROLE CONTROL
    if (role !== "admin") {

      if (quotation.status === "approved") {
        return res.status(403).json({
          message: "Cannot update approved quotation",
        });
      }

      if (quotation.created_by.toString() !== userId.toString()) {
        return res.status(403).json({
          message: "Not your quotation",
        });
      }
    }

    const { items } = req.body;

    let subtotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const product = await productModel.findById(item.product_id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const gross = item.quantity * item.unit_price;
      subtotal += gross;

      preparedItems.push({
        product_id: item.product_id,
        category_id: item.category_id,
        item_name: product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        total: gross - (gross * item.discount_percent) / 100,
      });
    }

    await quotation.updateOne({
      ...req.body,
      subtotal,
      updated_by: userId, 
    });

    await quotationItem.deleteMany({ quotation_id: id });

    for (const item of preparedItems) {
      await quotationItem.create({
        quotation_id: id,
        ...item,
      });
    }

    return res.json({ message: "Quotation updated successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ================================
   DELETE
================================ */

async function remove(req, res) {
  try {
    if (req.user.user_type?.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete quotation",
      });
    }

    const { id } = req.params;

    await quotationItem.deleteMany({ quotation_id: id });
    await quotationModel.findByIdAndDelete(id);

    return res.json({ message: "Deleted successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ================================
   GENERATE NUMBER
================================ */

async function generateQuotationNumber() {
  const last = await quotationModel.findOne().sort({ createdAt: -1 });

  let serial = 1;

  if (last?.quotation_number) {
    const match = last.quotation_number.match(/QTN-(\d+)-/);
    if (match) serial = parseInt(match[1]) + 1;
  }

  const serialFormatted = String(serial).padStart(4, "0");

  const today = new Date();
  const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today
    .getFullYear()
    .toString()
    .slice(-2)}`;

  return `QTN-${serialFormatted}-${formattedDate}`;
}

module.exports = {
  showAll,
  create,
  update,
  remove,
  getProductsByCategory,
};






// const mongoose = require("mongoose");
// const {
//   quotationModel,
//   quotationItem,
//   dealerModel,
//   productModel,
//   productCategory,
// } = require("../models/exporter");

// /* ================================
//    LIST QUOTATIONS
// ================================ */
// async function getProductsByCategory(req, res) {
//   try {
//     const { categoryId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({
//         message: "Invalid category id",
//       });
//     }

//     const categoryExists = await productCategory.findById(categoryId);

//     if (!categoryExists) {
//       return res.status(404).json({
//         message: "Category not found",
//       });
//     }

//     const products = await productModel
//       .find({
//         category_id: categoryId,
//         is_active: true,
//       })
//       .select("name mrp discount_percent code category_id");

//     return res.status(200).json({
//       products,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Something went wrong.",
//       error: error.message,
//     });
//   }
// }

// async function showAll(req, res) {
//   try {
//     const { businessId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(businessId)) {
//       return res.status(400).json({ message: "Invalid business id" });
//     }

//     const quotations = await quotationModel
//       .find({ businessId })
//       .populate("dealer_id")
//       .populate("created_by", "name email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ quotations });

//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// }

// /* ================================
//    CREATE QUOTATION
// ================================ */

// async function create(req, res) {
//   try {
//     const { businessId } = req.params;

//     const userId = req.user._id;
//     const role = req.user.user_type;

//     const {
//       dealer_id,
//       quotation_date,
//       valid_until,
//       items,
//       discount,
//       tax,
//       discount_type,
//       tax_type,
//       notes,
//       deliveryNotes,
//     } = req.body;

//     if (!dealer_id) {
//       return res.status(400).json({ message: "Dealer required" });
//     }

//     const dealer = await dealerModel.findOne({
//       _id: dealer_id,
//       businessId,
//     });

//     if (!dealer) {
//       return res.status(404).json({ message: "Dealer not found" });
//     }

//     let subtotal = 0;
//     const preparedItems = [];

//     for (const item of items) {
//       const product = await productModel.findOne({
//         _id: item.product_id,
//         category_id: item.category_id,
//       });

//       if (!product) {
//         return res.status(404).json({
//           message: "Product not found in category",
//         });
//       }

//       const qty = Number(item.quantity);
//       const price = Number(item.unit_price);
//       const disc = Number(item.discount_percent) || 0;

//       const gross = qty * price;
//       subtotal += gross;

//       preparedItems.push({
//         product_id: item.product_id,
//         category_id: item.category_id,
//         item_name: product.name,
//         quantity: qty,
//         unit_price: price,
//         discount_percent: disc,
//         total: gross - (gross * disc) / 100,
//       });
//     }

//     const discountAmount =
//       discount_type === "percentage"
//         ? (subtotal * discount) / 100
//         : discount || 0;

//     const taxable = subtotal - discountAmount;

//     const taxAmount =
//       tax_type === "percentage"
//         ? (taxable * tax) / 100
//         : tax || 0;

//     const total = taxable + taxAmount;

//     const quotationNumber = await generateQuotationNumber();

//     const status = role === "admin" ? "approved" : "pending";

//     const quotation = await quotationModel.create({
//       businessId,
//       quotation_number: quotationNumber,
//       dealer_id,
//       quotation_date,
//       valid_until,
//       subtotal,
//       discount: discountAmount,
//       tax: taxAmount,
//       total,
//       discount_type,
//       tax_type,
//       notes,
//       deliveryNotes,
//       created_by: userId,
//       status,
//     });

//     for (const item of preparedItems) {
//       await quotationItem.create({
//         quotation_id: quotation._id,
//         ...item,
//       });
//     }

//     return res.status(201).json({
//       message: "Quotation created successfully",
//       quotation,
//     });

//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// }

// /* ================================
//    UPDATE QUOTATION
// ================================ */

// async function update(req, res) {
//   try {
//     const { id } = req.params;

//     const userId = req.user._id;
//     const role = req.user.user_type;

//     const quotation = await quotationModel.findById(id);

//     if (!quotation) {
//       return res.status(404).json({ message: "Quotation not found" });
//     }

//     // 🔒 ROLE CHECK
//     if (role !== "admin") {

//       if (quotation.status === "approved") {
//         return res.status(403).json({
//           message: "Cannot update approved quotation",
//         });
//       }

//       if (quotation.created_by.toString() !== userId.toString()) {
//         return res.status(403).json({
//           message: "You can only update your own quotation",
//         });
//       }
//     }

//     const { items } = req.body;

//     let subtotal = 0;
//     const preparedItems = [];

//     for (const item of items) {
//       const product = await productModel.findById(item.product_id);

//       if (!product) {
//         return res.status(404).json({ message: "Product not found" });
//       }

//       const gross = item.quantity * item.unit_price;
//       subtotal += gross;

//       preparedItems.push({
//         product_id: item.product_id,
//         category_id: item.category_id,
//         item_name: product.name,
//         quantity: item.quantity,
//         unit_price: item.unit_price,
//         discount_percent: item.discount_percent,
//         total: gross - (gross * item.discount_percent) / 100,
//       });
//     }

//     await quotation.updateOne({
//       ...req.body,
//       subtotal,
//       updated_by: userId,
//     });

//     await quotationItem.deleteMany({ quotation_id: id });

//     for (const item of preparedItems) {
//       await quotationItem.create({
//         quotation_id: id,
//         ...item,
//       });
//     }

//     return res.json({ message: "Quotation updated successfully" });

//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// }

// /* ================================
//    DELETE QUOTATION
// ================================ */

// async function remove(req, res) {
//   try {
//     if (req.user.user_type !== "admin") {
//       return res.status(403).json({
//         message: "Only admin can delete quotation",
//       });
//     }

//     const { id } = req.params;

//     await quotationItem.deleteMany({ quotation_id: id });
//     await quotationModel.findByIdAndDelete(id);

//     return res.json({ message: "Quotation deleted successfully" });

//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// }

// /* ================================
//    GENERATE NUMBER
// ================================ */

// async function generateQuotationNumber() {
//   const last = await quotationModel.findOne().sort({ createdAt: -1 });

//   let serial = 1;

//   if (last?.quotation_number) {
//     const match = last.quotation_number.match(/QTN-(\d+)-/);
//     if (match) serial = parseInt(match[1]) + 1;
//   }

//   const serialFormatted = String(serial).padStart(4, "0");

//   const today = new Date();
//   const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today
//     .getFullYear()
//     .toString()
//     .slice(-2)}`;

//   return `QTN-${serialFormatted}-${formattedDate}`;
// }

// module.exports = {
//   showAll,
//   create,
//   update,
//   remove,
//   getProductsByCategory
// };