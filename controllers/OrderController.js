const {
  dealerModel,
  orderModel,
  orderItemModel,
  paymentModel,
  productModel
} = require("../models/exporter");


/* ================================
   INVOICE LIST
================================ */

async function showAll(req, res) {
  try {

    const orders = await orderModel
      .find({businessId:req.params.id})
      .populate("dealer_id createdBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong"
    });

  }
}


/* ================================
   PRODUCTS BY CATEGORY
================================ */

async function getProductsByCategory(req, res) {

  try {

    const categoryId = req.params.categoryId;

    const products = await productModel
      .find({
        category_id: categoryId,
        is_active: true
      })
      .select("name mrp discount_percent code");

    return res.json(products);

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong"
    });

  }

}


/* ================================
   STORE INVOICE
================================ */

async function store(req, res) {
    const {
      dealer_id,
      order_date,
      due_date,
      discount,
      discount_type,
      tax,
      tax_type,
      notes,
      businessId,
      createdBy,
      deliveryNotes
    } = req.body;


    const items = req.body.items || [];

    const orderNumber = await generateOrderNumber();


    /* SUBTOTAL */

    const subtotal = items.reduce((sum, i) => {
      return sum + (i.quantity * i.unit_price);
    }, 0);


    /* DISCOUNT */

    const discountAmount =
      discount_type === "percent"
        ? (subtotal * discount) / 100
        : discount || 0;


    /* TAX */

    const taxAmount =
      tax_type === "percent"
        ? ((subtotal - discountAmount) * tax) / 100
        : tax || 0;


    const total = subtotal - discountAmount + taxAmount;


    /* CREATE ORDER */

    const order = await orderModel.create({

      order_number: orderNumber,
      dealer_id,
      businessId,
      order_date,
      createdBy,
      due_date,
      subtotal,
      discount: discountAmount,
      discount_type,
      tax: taxAmount,
      tax_type,
      total,
      notes,
      deliveryNotes
    });

    if(req.user.role==="admin") {
      order.status="approved"
      await order.save();
    };




    /* CREATE ITEMS */

    for (const item of items) {

      if (!item.product_id || !item.quantity || !item.unit_price) continue;

      await orderItemModel.create({

        order_id: order._id,
        item_name: item.item_name,
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


    /* ADVANCE PAYMENT */

    // if (advance_paid && advance_paid > 0) {

    //   await paymentModel.create({

    //     order_id: order._id,
    //     payment_date: order_date,
    //     amount: advance_paid,
    //     payment_method: "Advance"

    //   });

    // }


    /* UPDATE PAYMENT SUMMARY */

    // await order.updatePaymentSummary();


    return res.status(201).json({

      message: "Order created successfully",
      order

    })

}


/* ================================
   UPDATE INVOICE
================================ */

async function update(req, res) {

  try {

    const id = req.params.id;

    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }


    const {
      dealer_id,
      currency_id,
      order_date,
      due_date,
      discount,
      discount_type,
      tax,
      tax_type,
      notes
    } = req.body;

    const items = req.body.items || [];


    const subtotal = items.reduce((sum, i) => {
      return sum + (i.quantity * i.unit_price);
    }, 0);


    const discountAmount =
      discount_type === "percent"
        ? (subtotal * discount) / 100
        : discount || 0;


    const taxAmount =
      tax_type === "percent"
        ? ((subtotal - discountAmount) * tax) / 100
        : tax || 0;


    const total = subtotal - discountAmount + taxAmount;


    await order.updateOne({

      dealer_id,
      currency_id,
      order_date,
      due_date,
      subtotal,
      discount: discountAmount,
      discount_type,
      tax: taxAmount,
      tax_type,
      total,
      notes

    });


    /* DELETE OLD ITEMS */

    await orderItemModel.deleteMany({ order_id: id });


    /* CREATE NEW ITEMS */

    for (const item of items) {

      if (!item.product_id || !item.quantity || !item.unit_price) continue;

      await orderItemModel.create({

        order_id: id,
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


    /* HANDLE ADVANCE PAYMENT */

    // if (advance_paid && advance_paid > 0) {

    //   const advancePayment = await paymentModel.findOne({
    //     order_id: id,
    //     payment_method: "Advance"
    //   });

    //   if (advancePayment) {

    //     advancePayment.amount = advance_paid;
    //     advancePayment.payment_date = order_date;

    //     await advancePayment.save();

    //   } else {

    //     await paymentModel.create({
    //       order_id: id,
    //       payment_date: order_date,
    //       amount: advance_paid,
    //       payment_method: "Advance"
    //     });

    //   }

    // }


    // await order.updatePaymentSummary();


    return res.status(200).json({
      message: "Order updated successfully"
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong"
    });

  }

}


/* ================================
   DELETE INVOICE
================================ */

async function remove(req, res) {

  try {

    const id = req.params.id;

    const order = await orderModel.findOne({ _id: id, status: "unapproved" });

    if (!order) {
      return res.status(400).json({
        message: "Order not found or is activated by director"
      });
    }

    // const payments = await paymentModel.find({ order_id: id });

    // if (payments.length > 0) {
    //   return res.status(400).json({
    //     message: "Order has payments and cannot be deleted"
    //   });
    // }

    await orderModel.findByIdAndDelete(id);
    await orderItemModel.deleteMany({ order_id: id });

    return res.status(200).json({
      message: "Oder deleted successfully"
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong"
    });

  }

}


/* ================================
   GENERATE INVOICE NUMBER
================================ */

async function generateOrderNumber() {

  const last = await orderModel
    .findOne()
    .sort({ createdAt: -1 });

  let serial = 1;

  if (last && last.order_number) {

    const match = last.order_number.match(/ORD-(\d+)-/);

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

  return `ORD-${serialFormatted}-${formattedDate}`;
}


module.exports = {
  showAll,
  store,
  update,
  remove,
  getProductsByCategory
};