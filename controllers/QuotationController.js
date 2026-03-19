const {quotationModel,quotationItem,dealerModel,productModel,productCategory,settingModel} = require("../models/exporter");

/* ================================
   LIST QUOTATIONS
================================ */

async function showAll(req, res) {
  try {

    const quotations = await quotationModel
      .find()
      .populate("dealer_id")
      .sort({ createdAt: -1 });

    return res.status(200).json({ quotations });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}


/* ================================
   GET PRODUCTS BY CATEGORY
================================ */

async function getProductsByCategory(req, res) {
  try {

    const categoryId = req.params.categoryId;

    const products = await productModel.find({
      category_id: categoryId,
      is_active: true
    }).select("name mrp discount_percent code");

    return res.json(products);

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}


/* ================================
   STORE QUOTATION
================================ */

async function create(req, res) {

  try {

    const businessId = req.params.businessId;

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
      deliveryNotes
    } = req.body;

    const quotationNumber = await generateQuotationNumber();

    const subtotal = items.reduce((sum, i) => {
      return sum + (i.quantity * i.unit_price);
    }, 0);

    const discountAmount =
      discount_type === "percentage"
        ? (subtotal * discount) / 100
        : discount;

    const taxAmount =
      tax_type === "percentage"
        ? ((subtotal - discountAmount) * tax) / 100
        : tax;

    const total = subtotal - discountAmount + taxAmount;

    const quotation = await quotationModel.create({
      businessId,
      quotation_number: quotationNumber,
      dealer_id,
      quotation_date,
      valid_until,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      discount_type,
      tax_type,
      total,
      notes,
      deliveryNotes
    });

    /* CREATE ITEMS */
    for (const item of items) {

      if (!item.product_id) continue;

      await quotationItem.create({
        quotation_id: quotation._id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        total:
          item.quantity *
          item.unit_price *
          (1 - (item.discount_percent || 0) / 100)
      });

    }

    return res.status(201).json({
      message: "Quotation created successfully!",
      quotation
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}/* ================================
   UPDATE QUOTATION
================================ */

async function update(req, res) {

  try {

    const id = req.params.businessId;

    const quotation = await quotationModel.findById(id);

    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found"
      });
    }

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
      deliveryNotes
    } = req.body;


    const subtotal = items.reduce((sum, i) => {
      return sum + (i.quantity * i.unit_price);
    }, 0);


    const discountAmount =
      discount_type === "percentage"
        ? (subtotal * discount) / 100
        : discount;


    const taxAmount =
      tax_type === "percentage"
        ? ((subtotal - discountAmount) * tax) / 100
        : tax;


    const total = subtotal - discountAmount + taxAmount;


    await quotation.updateOne({
      dealer_id,
      quotation_date,
      valid_until,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      discount_type,
      tax_type,
      total,
      notes,
      deliveryNotes
    });


    /* DELETE OLD ITEMS */

    await quotationItem.deleteMany({
      quotation_id: id
    });


    /* ADD NEW ITEMS */

    for (const item of items) {

      if (!item.product_id) continue;

      await quotationItem.create({
        quotation_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        total:
          item.quantity *
          item.unit_price *
          (1 - (item.discount_percent || 0) / 100)
      });

    }


    return res.status(200).json({
      message: "Quotation updated successfully!"
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}


/* ================================
   DELETE
================================ */

async function remove(req, res) {

  try {

    const id = req.params.businessId;

    await quotationItem.deleteMany({
      quotation_id: id
    });

    await quotationModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Quotation deleted successfully!"
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}


/* ================================
   QUOTATION NUMBER GENERATOR
================================ */

async function generateQuotationNumber() {

  const last = await quotationModel
    .findOne()
    .sort({ createdAt: -1 });

  let serial = 1;

  if (last) {

    const match = last.quotation_number.match(/QTN-(\d+)-/);

    if (match) {
      serial = parseInt(match[1]) + 1;
    }

  }

  const serialFormatted = String(serial).padStart(4, "0");

  const today = new Date();

  const formattedDate =
    today.getDate() +
    "-" +
    (today.getMonth() + 1) +
    "-" +
    today.getFullYear().toString().slice(-2);

  return `QTN-${serialFormatted}-${formattedDate}`;
}


module.exports = {
  showAll,
  getProductsByCategory,
  create,
  update,
  remove
};