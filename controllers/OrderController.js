const {
  dealerModel,
  orderModel,
  orderItemModel,
  paymentModel,
  productModel
} = require("../models/exporter");

const puppeteer = require("puppeteer");
/* ================================
   INVOICE LIST
================================ */
async function getDashboardStats(req, res) {
  try {
    const user = req.user;
    const businessId = req.params.id;

    let filter = { businessId };

    // 🔥 role-based same logic
    if (user.role === "salesman") {
      filter.createdBy = user.id;
    }

    if (user.role === "dispatcher") {
      filter.status = { $in: ["dispatched", "partial"] };
    }

    if (user.role === "accountant") {
      filter.status = { $in: ["dispatched", "partial", "posted"] };
    }

    const totalOrders = await orderModel.countDocuments({ businessId });

    const activeOrders = await orderModel.countDocuments({
      businessId,
      status: { $in: ["approved", "active", "partial"] },
    });

    const pendingOrders = await orderModel.countDocuments({
      businessId,
      status: "unapproved",
    });

    return res.json({
      totalOrders,
      activeOrders,
      pendingOrders,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
async function showAll(req, res) {
  try {
      const { id } = req.params;
      const user=req.user;
  
       let filter = {
        businessId: id
      };
  
      // ✅ ROLE BASED FILTERING
      if (user.role === "salesman") {
        filter.createdBy = user.id;
      }
  
      if (user.role === "dispatcher") {
        filter.status = { $in: ["dispatched", "partial","approved"] }; 
      }
  
      if (user.role === "accountant") {
        filter.status =  { $in: ["dispatched", "partial","posted"] };
      }
      const orders = await orderModel
        .find(filter)
        .populate("dealer_id")
        .populate("businessId", "businessName business_logo addressLogo")
        .populate("createdBy", "name email user_type")
        .populate("updatedBy", "name email user_type")
        .sort({ createdAt: -1 });
  
      return res.status(200).json({ orders });
  
    } catch (error) {
      return res.status(500).json({ message: error.message });
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
    discount_type,
    tax_type,
    notes,
    businessId,
    createdBy,
    deliveryNotes,
    payment_term 
  } = req.body;
  // ✅ Parse all numeric fields explicitly
  const discount = Number(req.body.discount) || 0;
  const tax = Number(req.body.tax) || 0;

  const items = req.body.items || [];

  const orderNumber = await generateOrderNumber();

  /* SUBTOTAL */
  const subtotal = items.reduce((sum, i) => {
  const qty = Number(i.quantity) || 0;
  const price = Number(i.unit_price) || 0;
  const discountPercent = Number(i.discount_percent) || 0;

  const subt = qty * price;

  const discountAmount = (subt * discountPercent) / 100;

  return sum + (subt - discountAmount);
}, 0);
  /* DISCOUNT */
  const discountAmount =
    discount_type === "percent"
      ? (Number(subtotal) * Number(discount) )/ 100
      : discount;
  /* TAX */
  const taxAmount =
    tax_type === "percent"
      ? ((Number(subtotal) - Number(discountAmount)) * Number(tax)) / 100
      : tax;


  const total = Number(subtotal) - Number(discountAmount) + Number(taxAmount);

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
    deliveryNotes,
    payment_term 
  });

  if (req.user.role === "admin") {
    order.status = "approved";
    await order.save();
  }

  /* CREATE ITEMS */
  for (const item of items) {
    if (!item.product_id || !item.quantity || !item.unit_price) continue;

    await orderItemModel.create({
      order_id: order._id,
      item_name: item.item_name,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      discount_percent: Number(item.discount_percent) || 0,
      total:
        Number(item.quantity) *
        Number(item.unit_price) *
        (1 - (Number(item.discount_percent) || 0) / 100)
    });
  }

  return res.status(201).json({
    message: "Order created successfully",
    order
  });
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
        success:false,
        message: "Order not found"
      });
    }

    // update order
if (req.user.role === "dispatcher" || req.user.role==="accountant") {
  order.status = req.body.status;
  order.deliveryNotes=req.body.deliveryNotes;
  order.updatedBy=req.user.id;
  await order.save();
  return res.json({ success: true });
}

    const {
      dealer_id,
      order_date,
      due_date,
      discount,
      discount_type,
      tax,
      tax_type,
      notes,
      payment_term 
    } = req.body;

    const items = req.body.items || [];


const subtotal = items.reduce((sum, i) => {
  const qty = Number(i.quantity) || 0;
  const price = Number(i.unit_price) || 0;
  const discountPercent = Number(i.discount_percent) || 0;

  const subt = qty * price;
  const discountAmount = (subt * discountPercent) / 100;

  return sum + (subt - discountAmount);
}, 0);

/* DISCOUNT */
const discountAmount =
  discount_type === "percent"
    ? (subtotal * discount) / 100
    : discount_type === "fixed"
    ? discount
    : 0;

/* TAX */
const taxAmount =
  tax_type === "percent"
    ? ((subtotal - discountAmount) * tax) / 100
    : tax_type === "fixed"
    ? tax
    : 0;

    const total = subtotal - discountAmount + taxAmount;


    await order.updateOne({

      dealer_id,
      updatedBy:req.user.id,
      order_date,
      due_date,
      subtotal,
      discount: discountAmount,
      discount_type,
      tax: taxAmount,
      tax_type,
      total,
      notes,
      payment_term

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
        item_name:item.item_name,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,

        total:
          item.quantity *
          item.unit_price *
          (1 - (item.discount_percent || 0) / 100)

      });

    }

    return res.status(200).json({
      success:true,
      message: "Order updated successfully"
    });

  } catch (error) {

    return res.status(500).json({
      success:true,
      message: "Something went wrong"
    });

  }

}

async function updateOrderStatus (req, res){
  try {
    const id  = req.params.id;
    const status = req.body.status;

    const validStatuses = ["approved", "rejected", "pending", "posted"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "unapproved") {
      return res.status(400).json({
        success: false,
        message: "Only unapproved orders can be updated",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};


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
    //     success:false,
    //     message: "Order has payments and cannot be deleted"
    //   });
    // }

    await orderModel.findByIdAndDelete(id);
    await orderItemModel.deleteMany({ order_id: id });

    return res.status(200).json({
      success:true,
      message: "Oder deleted successfully"
    });

  } catch (error) {

    return res.status(500).json({
      success:false,
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

// async function getOrderById(req, res) {
//   try {
//     const order = await orderModel
//       .findById(req.params.id)
//       .populate("dealer_id createdBy")

//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     const items = await orderItemModel.find({ order_id: req.params.id }).populate("product_id");

//     return res.status(200).json({ success: true, order, items });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// }



const downloadPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const url = `${process.env.CLIENT_URL}/order/print/${id}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    // Pass cookies if present
    if (req.headers.cookie) {
      await page.setExtraHTTPHeaders({ Cookie: req.headers.cookie });
    }

    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    // Wait for invoice element
    await page.waitForSelector("#invoice", { timeout: 10000 });

    // Get full page height
    const bodyHandle = await page.$("body");
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    // Generate single-page PDF by setting height dynamically
const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: {
    top: "20mm",
    bottom: "20mm",
    left: "10mm",
    right: "10mm",
  },
  displayHeaderFooter: true,
  footerTemplate: `
    <div style="width:100%; font-size:10px; text-align:center;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,
  headerTemplate: `<div></div>`,
});
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=order-${id}.pdf`,
    });

    return res.send(pdf);

  } catch (error) {
    console.log("❌ PDF ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
    });
  }
};
async function getOrderById(req, res) {
  try {
    const id = req.params.id;

    /* ================= ORDER ================= */
const order = await orderModel
  .findById(id)
  .populate("dealer_id createdBy")
  .populate("businessId");
      if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    /* ================= ITEMS ================= */
    const items = await orderItemModel
      .find({ order_id: id })
      .populate({
        path: "product_id",
        populate: {
          path: "category_id",
          select: "_id name"
        }
      });

    /* ================= FORMAT ITEMS ================= */
const formattedItems = items.map((item) => ({
  _id: item._id,

  category_id: item.product_id?.category_id?._id || "",

  product_id: item.product_id || null, // ✅ FIXED

  product_name: item.product_id?.name || "",

  item_name: item.item_name,

  quantity: item.quantity,
  unit_price: item.unit_price,
  discount_percent: item.discount_percent,

  total: item.total
}));    /* ================= RESPONSE ================= */
    return res.status(200).json({
      success: true,
      order,
      items: formattedItems
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

module.exports = {
  showAll,
  store,
  update,
  remove,
  updateOrderStatus,
  getProductsByCategory,
  getOrderById,
  downloadPDF,
  getDashboardStats
};