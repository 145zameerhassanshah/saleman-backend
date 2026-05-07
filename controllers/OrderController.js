// const mongoose = require("mongoose");

// const {
//   orderModel,
//   orderItemModel,
//   productModel,
//   productCategory,
//   dealerModel,
// } = require("../models/exporter");

// const puppeteer = require("puppeteer");

// const { createAuditLog } = require("../sevices/auditLog");
// const { AUDIT_MODULES, AUDIT_ACTIONS } = require("../models/auditEnum");

// /* ================================
//    HELPERS
// ================================ */

// const getUserId = (req) => {
//   return req.user?._id || req.user?.id || req.user?.userId || null;
// };

// const getUserRole = (req) => {
//   return String(req.user?.user_type || req.user?.role || "").toLowerCase();
// };

// const getId = (value) => {
//   if (!value) return null;
//   if (typeof value === "object" && value._id) return value._id;
//   return value;
// };

// const isValidObjectId = (id) => {
//   return id && mongoose.Types.ObjectId.isValid(String(id));
// };

// const round2 = (value) => {
//   return Math.round((Number(value) || 0) * 100) / 100;
// };

// const escapeRegex = (value = "") => {
//   return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// };

// const normalizeAmountType = (type, defaultType = "amount") => {
//   const value = String(type || "").toLowerCase();

//   if (value === "percent" || value === "percentage") return "percent";
//   if (value === "amount" || value === "fixed") return "amount";

//   return defaultType;
// };

// const calculateLineTotal = (item) => {
//   const qty = Number(item.quantity) || 0;
//   const price = Number(item.unit_price) || 0;
//   const discountVal = Number(item.discount_percent) || 0;

//   const gross = qty * price;
//   const discountType = normalizeAmountType(item.discount_type, "percent");

//   const discountAmount =
//     discountType === "amount" ? discountVal : (gross * discountVal) / 100;

//   return round2(Math.max(gross - discountAmount, 0));
// };

// const calculateOrderTotals = (items, discount, discount_type, tax, tax_type) => {
//   const subtotal = round2(
//     items.reduce((sum, item) => sum + calculateLineTotal(item), 0)
//   );

//   const finalDiscountType = normalizeAmountType(discount_type, "amount");
//   const finalTaxType = normalizeAmountType(tax_type, "amount");

//   const discountAmount =
//     finalDiscountType === "percent"
//       ? round2((subtotal * Number(discount || 0)) / 100)
//       : round2(Number(discount || 0));

//   const taxable = Math.max(subtotal - discountAmount, 0);

//   const taxAmount =
//     finalTaxType === "percent"
//       ? round2((taxable * Number(tax || 0)) / 100)
//       : round2(Number(tax || 0));

//   const total = round2(taxable + taxAmount);

//   return {
//     subtotal,
//     discountAmount,
//     taxAmount,
//     total,
//   };
// };

// const getPagination = (query) => {
//   const page = Math.max(Number(query.page) || 1, 1);
//   const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
//   const skip = (page - 1) * limit;

//   return { page, limit, skip };
// };

// const buildRoleFilter = (businessId, role, userId) => {
//   const filter = { businessId };

//   if (role === "salesman") {
//     filter.created_by = userId;
//   }

//   if (role === "dispatcher" || role === "manager") {
//     filter.status = { $in: ["dispatched", "partial", "approved"] };
//   }

//   if (role === "accountant") {
//     filter.status = { $in: ["dispatched", "partial", "posted"] };
//   }

//   return filter;
// };

// const applyStatusFilter = (filter, status) => {
//   if (!status) return filter;

//   const requestedStatus = String(status).toLowerCase();

//   if (filter.status?.$in) {
//     filter.status = filter.status.$in.includes(requestedStatus)
//       ? requestedStatus
//       : { $in: [] };
//     return filter;
//   }

//   filter.status = requestedStatus;
//   return filter;
// };

// const withStatusGroup = (filter, statuses) => {
//   const nextFilter = { ...filter };

//   if (nextFilter.status?.$in) {
//     nextFilter.status = {
//       $in: statuses.filter((status) => nextFilter.status.$in.includes(status)),
//     };
//     return nextFilter;
//   }

//   if (nextFilter.status) {
//     nextFilter.status = statuses.includes(nextFilter.status)
//       ? nextFilter.status
//       : { $in: [] };
//     return nextFilter;
//   }

//   nextFilter.status = { $in: statuses };
//   return nextFilter;
// };

// const buildPreparedItems = async (items = []) => {
//   const validItems = items.filter((item) => {
//     return (
//       (getId(item.product_id) || item.item_name) &&
//       Number(item.quantity) > 0 &&
//       Number(item.unit_price) >= 0
//     );
//   });

//   if (!validItems.length) {
//     return {
//       success: false,
//       message: "Please add at least one valid order item",
//       items: [],
//     };
//   }

//   for (const item of validItems) {
//     const productId = getId(item.product_id);
//     const categoryId = getId(item.category_id);

//     if (productId && !isValidObjectId(productId)) {
//       return {
//         success: false,
//         message: "Invalid product id",
//         items: [],
//       };
//     }

//     if (categoryId && !isValidObjectId(categoryId)) {
//       return {
//         success: false,
//         message: "Invalid category id",
//         items: [],
//       };
//     }
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | ✅ QUERY OPTIMIZATION
//   |--------------------------------------------------------------------------
//   | Product/category ko loop ke andar query nahi kar rahe.
//   | Pehle IDs collect, phir single batch query.
//   */
//   const productIds = [
//     ...new Set(
//       validItems
//         .map((item) => getId(item.product_id))
//         .filter((id) => isValidObjectId(id))
//         .map(String)
//     ),
//   ];

//   const categoryIds = [
//     ...new Set(
//       validItems
//         .map((item) => getId(item.category_id))
//         .filter((id) => isValidObjectId(id))
//         .map(String)
//     ),
//   ];

//   const [products, activeCategories] = await Promise.all([
//     productIds.length
//       ? productModel
//           .find({ _id: { $in: productIds }, is_active: true })
//           .select("_id name category_id mrp")
//           .lean()
//       : [],

//     categoryIds.length
//       ? productCategory
//           .find({ _id: { $in: categoryIds }, is_active: true })
//           .select("_id")
//           .lean()
//       : [],
//   ]);

//   const productMap = new Map(products.map((p) => [String(p._id), p]));
//   const activeCategorySet = new Set(activeCategories.map((c) => String(c._id)));

//   const preparedItems = [];

//   for (const item of validItems) {
//     const productId = getId(item.product_id);
//     const categoryId = getId(item.category_id);

//     if (categoryId && !activeCategorySet.has(String(categoryId))) {
//       return {
//         success: false,
//         message: "Selected category is inactive or invalid",
//         items: [],
//       };
//     }

//     let product = null;

//     if (productId) {
//       product = productMap.get(String(productId));

//       if (!product) {
//         return {
//           success: false,
//           message: "Product not found or inactive",
//           items: [],
//         };
//       }

//       if (
//         categoryId &&
//         product.category_id &&
//         String(product.category_id) !== String(categoryId)
//       ) {
//         return {
//           success: false,
//           message: "Product does not belong to selected category",
//           items: [],
//         };
//       }
//     }

//     const itemName = product?.name || item.item_name;

//     if (!itemName) continue;

//     const preparedItem = {
//       product_id: productId || null,
//       category_id: categoryId || null,
//       item_name: itemName,
//       description: item.description || null,
//       quantity: Number(item.quantity),
//       unit_price: Number(item.unit_price),
//       discount_percent: Number(item.discount_percent) || 0,
//       discount_type: normalizeAmountType(item.discount_type, "percent"),
//     };

//     preparedItem.total = calculateLineTotal(preparedItem);

//     preparedItems.push(preparedItem);
//   }

//   if (!preparedItems.length) {
//     return {
//       success: false,
//       message: "Please add at least one valid order item",
//       items: [],
//     };
//   }

//   return {
//     success: true,
//     items: preparedItems,
//   };
// };

// /* ================================
//    DASHBOARD STATS
// ================================ */

// async function getDashboardStats(req, res) {
//   try {
//     const businessId = req.params.id;
//     const role = getUserRole(req);
//     const userId = getUserId(req);

//     if (!isValidObjectId(businessId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid business id",
//       });
//     }

//     const filter = buildRoleFilter(businessId, role, userId);

//     /*
//     |--------------------------------------------------------------------------
//     | ✅ QUERY OPTIMIZATION
//     |--------------------------------------------------------------------------
//     | 3 count queries parallel run.
//     */
//     const [totalOrders, activeOrders, pendingOrders] = await Promise.all([
//       orderModel.countDocuments(filter),

//       orderModel.countDocuments(
//         withStatusGroup(filter, ["approved", "active", "partial"])
//       ),

//       orderModel.countDocuments(withStatusGroup(filter, ["unapproved"])),
//     ]);

//     return res.status(200).json({
//       success: true,
//       totalOrders,
//       activeOrders,
//       pendingOrders,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// /* ================================
//    SHOW ALL ORDERS
// ================================ */

// async function showAll(req, res) {
//   try {
//     const { id } = req.params;
//     const role = getUserRole(req);
//     const userId = getUserId(req);

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid business id",
//       });
//     }

//     const {
//       search = "",
//       status = "",
//     } = req.query;

//     const { page, limit, skip } = getPagination(req.query);

//     const filter = buildRoleFilter(id, role, userId);

//     applyStatusFilter(filter, status);

//     /*
//     |--------------------------------------------------------------------------
//     | ✅ QUERY OPTIMIZATION
//     |--------------------------------------------------------------------------
//     | Prefix search index friendly hai.
//     */
//     if (search.trim()) {
//       filter.order_number = {
//         $regex: `^${escapeRegex(search.trim())}`,
//         $options: "i",
//       };
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | ✅ QUERY OPTIMIZATION
//     |--------------------------------------------------------------------------
//     | 1. Pagination
//     | 2. select only required fields
//     | 3. lean()
//     | 4. count + records parallel
//     */
//     const [orders, total] = await Promise.all([
//       orderModel
//         .find(filter)
//         .select(
//           "order_number businessId payment_term dealer_id order_date due_date subtotal tax tax_type discount_type discount total total_paid remaining_balance created_by updated_by status notes deliveryNotes rejectReason createdAt"
//         )
//         .populate("dealer_id", "name phone_number whatsapp_number")
//         .populate("businessId", "businessName business_logo addressLogo name")
//         .populate("created_by", "name email role user_type")
//         .populate("updated_by", "name email role user_type")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),

//       orderModel.countDocuments(filter),
//     ]);

//     return res.status(200).json({
//       success: true,
//       orders,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit) || 1,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// /* ================================
//    PRODUCTS BY CATEGORY
// ================================ */

// async function getProductsByCategory(req, res) {
//   try {
//     const categoryId = req.params.categoryId;

//     if (!isValidObjectId(categoryId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category id",
//       });
//     }

//     const products = await productModel
//       .find({
//         category_id: categoryId,
//         is_active: true,
//       })
//       .select("name mrp discount_percent code sku image category_id")
//       .sort({ name: 1 })
//       .lean(); // ✅ QUERY OPTIMIZATION

//     return res.status(200).json({
//       success: true,
//       products,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//     });
//   }
// }

// /* ================================
//    STORE ORDER
// ================================ */

// async function store(req, res) {
//   try {
//     const {
//       dealer_id,
//       order_date,
//       due_date,
//       discount_type = "amount",
//       tax_type = "amount",
//       notes,
//       businessId,
//       deliveryNotes,
//       payment_term,
//       items = [],
//     } = req.body;

//     const role = getUserRole(req);
//     const userId = getUserId(req);

//     if (!isValidObjectId(businessId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid business id",
//       });
//     }

//     if (!isValidObjectId(dealer_id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid dealer id",
//       });
//     }

//     const dealer = await dealerModel
//       .findOne({ _id: dealer_id, businessId })
//       .select("_id")
//       .lean(); // ✅ QUERY OPTIMIZATION

//     if (!dealer) {
//       return res.status(404).json({
//         success: false,
//         message: "Dealer not found",
//       });
//     }

//     const preparedResult = await buildPreparedItems(items);

//     if (!preparedResult.success) {
//       return res.status(400).json({
//         success: false,
//         message: preparedResult.message,
//       });
//     }

//     const preparedItems = preparedResult.items;

//     const finalDiscountType = normalizeAmountType(discount_type, "amount");
//     const finalTaxType = normalizeAmountType(tax_type, "amount");

//     const { subtotal, discountAmount, taxAmount, total } = calculateOrderTotals(
//       preparedItems,
//       req.body.discount,
//       finalDiscountType,
//       req.body.tax,
//       finalTaxType
//     );

//     const orderNumber = await generateOrderNumber();

//     const initialStatus = role === "admin" ? "approved" : "unapproved";

//     const order = await orderModel.create({
//       order_number: orderNumber,
//       dealer_id,
//       businessId,
//       order_date,
//       created_by: userId,
//       due_date,
//       subtotal,
//       discount: discountAmount,
//       discount_type: finalDiscountType,
//       tax: taxAmount,
//       tax_type: finalTaxType,
//       total,
//       total_paid: 0,
//       remaining_balance: total,
//       notes,
//       deliveryNotes,
//       payment_term,
//       status: initialStatus,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | ✅ QUERY OPTIMIZATION
//     |--------------------------------------------------------------------------
//     | Loop ke andar create nahi. insertMany use karo.
//     */
//     const createdItems = await orderItemModel.insertMany(
//       preparedItems.map((item) => ({
//         order_id: order._id,
//         ...item,
//       }))
//     );

//     await createAuditLog({
//       req,
//       businessId: order.businessId,
//       module: AUDIT_MODULES.ORDER,
//       entityId: order._id,
//       entityModel: "Order",
//       entityLabel: order.order_number,
//       action: AUDIT_ACTIONS.CREATE,
//       description: `Order ${order.order_number} created`,
//       after: order,
//       meta: {
//         items: createdItems,
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       order,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// /* ================================
//    UPDATE ORDER
// ================================ */

// async function update(req, res) {
//   try {
//     const id = req.params.id;
//     const role = getUserRole(req);
//     const userId = getUserId(req);

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid order id",
//       });
//     }

//     const oldOrder = await orderModel.findById(id).lean();

//     if (!oldOrder) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const oldItems = await orderItemModel.find({ order_id: id }).lean();

//     /* ================= DISPATCHER / MANAGER ================= */

//     if (role === "dispatcher" || role === "manager") {
//       const updatedOrder = await orderModel
//         .findByIdAndUpdate(
//           id,
//           {
//             status: req.body.status,
//             deliveryNotes: req.body.deliveryNotes,
//             updated_by: userId,
//           },
//           {
//             returnDocument: "after",
//             runValidators: true,
//           }
//         )
//         .lean();

//       await createAuditLog({
//         req,
//         businessId: updatedOrder.businessId,
//         module: AUDIT_MODULES.ORDER,
//         entityId: updatedOrder._id,
//         entityModel: "Order",
//         entityLabel: updatedOrder.order_number,
//         action:
//           oldOrder.status !== updatedOrder.status
//             ? AUDIT_ACTIONS.STATUS_CHANGE
//             : AUDIT_ACTIONS.UPDATE,
//         description:
//           oldOrder.status !== updatedOrder.status
//             ? `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`
//             : `Order ${updatedOrder.order_number} updated`,
//         before: oldOrder,
//         after: updatedOrder,
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Order updated successfully",
//         data: updatedOrder,
//       });
//     }

//     /* ================= ACCOUNTANT ================= */

//     if (role === "accountant") {
//       const updatedOrder = await orderModel
//         .findByIdAndUpdate(
//           id,
//           {
//             status: req.body.status,
//             payment_term: req.body.payment_term,
//             updated_by: userId,
//           },
//           {
//             returnDocument: "after",
//             runValidators: true,
//           }
//         )
//         .lean();

//       await createAuditLog({
//         req,
//         businessId: updatedOrder.businessId,
//         module: AUDIT_MODULES.ORDER,
//         entityId: updatedOrder._id,
//         entityModel: "Order",
//         entityLabel: updatedOrder.order_number,
//         action:
//           oldOrder.status !== updatedOrder.status
//             ? AUDIT_ACTIONS.STATUS_CHANGE
//             : AUDIT_ACTIONS.UPDATE,
//         description:
//           oldOrder.status !== updatedOrder.status
//             ? `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`
//             : `Order ${updatedOrder.order_number} updated`,
//         before: oldOrder,
//         after: updatedOrder,
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Order updated successfully",
//         data: updatedOrder,
//       });
//     }

//     /* ================= ADMIN + SALESMAN FULL UPDATE ================= */

//     if (role !== "admin" && role !== "salesman") {
//       return res.status(403).json({
//         success: false,
//         message: "You are not allowed to update this order",
//       });
//     }

//     if (role === "salesman" && String(oldOrder.created_by) !== String(userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "You can only update your own order",
//       });
//     }

//     const {
//       dealer_id,
//       order_date,
//       due_date,
//       discount_type = "amount",
//       tax_type = "amount",
//       notes,
//       payment_term,
//       status,
//       deliveryNotes,
//       items = [],
//     } = req.body;

//     if (!isValidObjectId(dealer_id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid dealer id",
//       });
//     }

//     const dealer = await dealerModel
//       .findOne({ _id: dealer_id, businessId: oldOrder.businessId })
//       .select("_id")
//       .lean();

//     if (!dealer) {
//       return res.status(404).json({
//         success: false,
//         message: "Dealer not found",
//       });
//     }

//     const preparedResult = await buildPreparedItems(items);

//     if (!preparedResult.success) {
//       return res.status(400).json({
//         success: false,
//         message: preparedResult.message,
//       });
//     }

//     const preparedItems = preparedResult.items;

//     const finalDiscountType = normalizeAmountType(discount_type, "amount");
//     const finalTaxType = normalizeAmountType(tax_type, "amount");

//     const { subtotal, discountAmount, taxAmount, total } = calculateOrderTotals(
//       preparedItems,
//       req.body.discount,
//       finalDiscountType,
//       req.body.tax,
//       finalTaxType
//     );

//     const totalPaid = Number(oldOrder.total_paid || 0);
//     const remainingBalance = round2(Math.max(total - totalPaid, 0));

//     const updatePayload = {
//       dealer_id,
//       updated_by: userId,
//       order_date,
//       due_date,
//       subtotal,
//       discount: discountAmount,
//       discount_type: finalDiscountType,
//       tax: taxAmount,
//       tax_type: finalTaxType,
//       total,
//       remaining_balance: remainingBalance,
//       notes,
//       payment_term,
//       deliveryNotes,
//     };

//     if (role === "salesman") {
//       updatePayload.status = "unapproved";
//     }

//     if (role === "admin" && status) {
//       updatePayload.status = status;
//     }

//     const updatedOrder = await orderModel
//       .findByIdAndUpdate(id, updatePayload, {
//         returnDocument: "after",
//         runValidators: true,
//       })
//       .lean();

//     await orderItemModel.deleteMany({ order_id: id });

//     const newItems = await orderItemModel.insertMany(
//       preparedItems.map((item) => ({
//         order_id: id,
//         ...item,
//       }))
//     );

//     await createAuditLog({
//       req,
//       businessId: updatedOrder.businessId,
//       module: AUDIT_MODULES.ORDER,
//       entityId: updatedOrder._id,
//       entityModel: "Order",
//       entityLabel: updatedOrder.order_number,
//       action:
//         oldOrder.status !== updatedOrder.status
//           ? AUDIT_ACTIONS.STATUS_CHANGE
//           : AUDIT_ACTIONS.UPDATE,
//       description:
//         oldOrder.status !== updatedOrder.status
//           ? `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`
//           : `Order ${updatedOrder.order_number} updated`,
//       before: oldOrder,
//       after: updatedOrder,
//       meta: {
//         oldItems,
//         newItems,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Order updated successfully",
//       data: updatedOrder,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// /* ================================
//    UPDATE ORDER STATUS
// ================================ */

// async function updateOrderStatus(req, res) {
//   try {
//     const id = req.params.id;
//     const status = String(req.body.status || "").toLowerCase();
//     const rejectReason = req.body.rejectReason || null;
//     const userId = getUserId(req);

//     const validStatuses = [
//       "pending",
//       "unpaid",
//       "unapproved",
//       "approved",
//       "active",
//       "partial",
//       "paid",
//       "posted",
//       "rejected",
//       "dispatched",
//     ];

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid order id",
//       });
//     }

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
//       });
//     }

//     const oldOrder = await orderModel.findById(id).lean();

//     if (!oldOrder) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const updatePayload = {
//       status,
//       updated_by: userId,
//     };

//     if (status === "rejected") {
//       updatePayload.rejectReason = rejectReason;
//     }

//     if (status === "approved") {
//       updatePayload.rejectReason = null;
//     }

//     const updatedOrder = await orderModel
//       .findByIdAndUpdate(id, updatePayload, {
//         returnDocument: "after",
//         runValidators: true,
//       })
//       .lean();

//     let action = AUDIT_ACTIONS.STATUS_CHANGE;

//     if (status === "approved") action = AUDIT_ACTIONS.APPROVE;
//     if (status === "rejected") action = AUDIT_ACTIONS.REJECT;

//     await createAuditLog({
//       req,
//       businessId: updatedOrder.businessId,
//       module: AUDIT_MODULES.ORDER,
//       entityId: updatedOrder._id,
//       entityModel: "Order",
//       entityLabel: updatedOrder.order_number,
//       action,
//       description: `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`,
//       before: oldOrder,
//       after: updatedOrder,
//       reason: rejectReason,
//     });

//     return res.status(200).json({
//       success: true,
//       message: `Order ${status} successfully`,
//       data: updatedOrder,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// }

// /* ================================
//    DELETE ORDER
// ================================ */

// async function remove(req, res) {
//   try {
//     const id = req.params.id;
//     const role = getUserRole(req);
//     const userId = getUserId(req);

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid order id",
//       });
//     }

//     let order;

//     if (role === "admin") {
//       order = await orderModel
//         .findOne({
//           _id: id,
//           status: { $in: ["unapproved", "approved", "rejected"] },
//         })
//         .lean();
//     } else {
//       order = await orderModel
//         .findOne({
//           _id: id,
//           status: "unapproved",
//           created_by: userId,
//         })
//         .lean();
//     }

//     if (!order) {
//       return res.status(400).json({
//         success: false,
//         message: "Order not found or cannot be deleted",
//       });
//     }

//     const oldItems = await orderItemModel.find({ order_id: id }).lean();

//     await createAuditLog({
//       req,
//       businessId: order.businessId,
//       module: AUDIT_MODULES.ORDER,
//       entityId: order._id,
//       entityModel: "Order",
//       entityLabel: order.order_number,
//       action: AUDIT_ACTIONS.DELETE,
//       description: `Order ${order.order_number} deleted`,
//       before: order,
//       after: null,
//       meta: {
//         deletedItems: oldItems,
//       },
//     });

//     await Promise.all([
//       orderItemModel.deleteMany({ order_id: id }),
//       orderModel.findByIdAndDelete(id),
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: "Order deleted successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// }

// /* ================================
//    GET ORDER BY ID
// ================================ */

// async function getOrderById(req, res) {
//   try {
//     const id = req.params.id;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid order id",
//       });
//     }

//     const order = await orderModel
//       .findById(id)
//       .select(
//         "order_number businessId payment_term dealer_id order_date due_date subtotal tax tax_type discount_type discount total total_paid remaining_balance created_by updated_by status notes deliveryNotes rejectReason createdAt"
//       )
//       .populate("dealer_id", "name phone_number whatsapp_number address")
//       .populate("created_by", "name email role user_type")
//       .populate("updated_by", "name email role user_type")
//       .populate("businessId", "businessName business_logo addressLogo name")
//       .lean(); // ✅ QUERY OPTIMIZATION

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const items = await orderItemModel
//       .find({ order_id: id })
//       .select(
//         "order_id category_id product_id item_name description quantity unit_price discount_percent discount_type total"
//       )
//       .populate("product_id", "name mrp code sku image")
//       .populate("category_id", "_id name")
//       .sort({ createdAt: 1 })
//       .lean(); // ✅ QUERY OPTIMIZATION

//     const formattedItems = items.map((item) => ({
//       _id: item._id,
//       category_id: item.category_id?._id || item.category_id || "",
//       category_name: item.category_id?.name || "",
//       product_id: item.product_id?._id || item.product_id || null,
//       product_name: item.product_id?.name || "",
//       item_name: item.item_name,
//       description: item.description,
//       quantity: item.quantity,
//       unit_price: item.unit_price,
//       discount_percent: item.discount_percent,
//       discount_type: item.discount_type || "percent",
//       total: item.total,
//     }));

//     return res.status(200).json({
//       success: true,
//       order,
//       items: formattedItems,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// }

// /* ================================
//    DOWNLOAD PDF
// ================================ */

// const downloadPDF = async (req, res) => {
//   let browser;

//   try {
//     const id = req.params.id;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid order id",
//       });
//     }

//     const order = await orderModel
//       .findById(id)
//       .select("order_number")
//       .lean();

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const url = `${process.env.CLIENT_URL}/order/print/${id}`;

//     browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox"],
//     });

//     const page = await browser.newPage();

//     if (req.headers.cookie) {
//       await page.setExtraHTTPHeaders({
//         Cookie: req.headers.cookie,
//       });
//     }

//     await page.goto(url, {
//       waitUntil: "networkidle0",
//       timeout: 60000,
//     });

//     await page.waitForSelector("#invoice", {
//       timeout: 10000,
//     });

//     const pdf = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: {
//         top: "20mm",
//         bottom: "20mm",
//         left: "10mm",
//         right: "10mm",
//       },
//       displayHeaderFooter: true,
//       footerTemplate: `
//         <div style="width:100%; font-size:10px; text-align:center;">
//           Page <span class="pageNumber"></span> of <span class="totalPages"></span>
//         </div>
//       `,
//       headerTemplate: `<div></div>`,
//     });

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=order-${order.order_number}.pdf`,
//     });

//     return res.send(pdf);
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate PDF",
//       error: error.message,
//     });
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };

// /* ================================
//    GENERATE ORDER NUMBER
// ================================ */

// async function generateOrderNumber() {
//   /*
//   |--------------------------------------------------------------------------
//   | ✅ QUERY OPTIMIZATION
//   |--------------------------------------------------------------------------
//   | Sirf order_number select ho raha hai, full document nahi.
//   */
//   const last = await orderModel
//     .findOne()
//     .select("order_number")
//     .sort({ createdAt: -1 })
//     .lean();

//   let serial = 1;

//   if (last?.order_number) {
//     const match = last.order_number.match(/ORD-(\d+)-/);

//     if (match) {
//       serial = parseInt(match[1], 10) + 1;
//     }
//   }

//   const serialFormatted = String(serial).padStart(4, "0");

//   const today = new Date();

//   const formattedDate =
//     today.getDate() +
//     "-" +
//     (today.getMonth() + 1) +
//     "-" +
//     today.getFullYear().toString().slice(-2);

//   return `ORD-${serialFormatted}-${formattedDate}`;
// }

// /* ================================
//    EXPORTS
// ================================ */

// module.exports = {
//   showAll,
//   store,
//   update,
//   remove,
//   updateOrderStatus,
//   getProductsByCategory,
//   getOrderById,
//   downloadPDF,
//   getDashboardStats,
// };



// const {
//   dealerModel,
//   orderModel,
//   orderItemModel,
//   paymentModel,
//   productModel,
//   productCategory,
//   AuditLogModel 
// } = require("../models/exporter");

// const puppeteer = require("puppeteer");
// /* ================================
//    INVOICE LIST
// ================================ */
// // async function getDashboardStats(req, res) {
// //   try {
// //     const user = req.user;
// //     const businessId = req.params.id;

// //     let filter = { businessId };

// //     // 🔥 role-based same logic
// //     if (user.role === "salesman") {
// //       filter.createdBy = user.id;
// //     }

// //     if (user.role === "dispatcher" || user.role === "manager"){
// //       filter.status = { $in: ["dispatched", "partial"] };
// //     }

// //     if (user.role === "accountant") {
// //       filter.status = { $in: ["dispatched", "partial", "posted"] };
// //     }

// //     const totalOrders = await orderModel.countDocuments({ businessId });

// //     const activeOrders = await orderModel.countDocuments({
// //       businessId,
// //       status: { $in: ["approved", "active", "partial"] },
// //     });

// //     const pendingOrders = await orderModel.countDocuments({
// //       businessId,
// //       status: "unapproved",
// //     });

// //     return res.json({
// //       totalOrders,
// //       activeOrders,
// //       pendingOrders,
// //     });

// //   } catch (error) {
// //     return res.status(500).json({ message: error.message });
// //   }
// // }








// async function getDashboardStats(req, res) {
//   try {
//     const user = req.user;
//     const businessId = req.params.id;

//     let filter = { businessId };

//     /* ================= ROLE FILTER ================= */

//     if (user.role === "salesman") {
//       filter.created_by = user.id;
//     }

//     if (user.role === "dispatcher" || user.role === "manager") {
//       filter.status = { $in: ["approved"] };
//     }

//     if (user.role === "accountant") {
//       filter.status = { $in: ["dispatched", "partial", "posted"] };
//     }

//     /* ================= COUNTS ================= */

//     const totalOrders = await orderModel.countDocuments(filter);

//     const activeOrders = await orderModel.countDocuments({
//       ...filter,
//       status: { $in: ["approved", "active", "partial"] },
//     });

//     const pendingOrders = await orderModel.countDocuments({
//       ...filter,
//       status: "unapproved",
//     });

//     return res.json({
//       totalOrders,
//       activeOrders,
//       pendingOrders,
//     });

//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// }
// async function showAll(req, res) {
//   try {
//       const { id } = req.params;
//       const user=req.user;
  
//        let filter = {
//         businessId: id
//       };
  
//       // ✅ ROLE BASED FILTERING
//       if (user.role === "salesman") {
//         filter.created_by = user.id;
//       }
  
//       if (user.role === "dispatcher"|| user.role === "manager") {
//         filter.status = { $in: ["dispatched", "partial","approved"] }; 
//       }
  
//       if (user.role === "accountant") {
//         filter.status =  { $in: ["dispatched", "partial","posted"] };
//       }
//       const orders = await orderModel
//         .find(filter)
//         .populate("dealer_id")
//         .populate("businessId", "businessName business_logo addressLogo")
//         .populate("created_by", "name email role")
//         .populate("updated_by", "name email role")
//         .sort({ createdAt: -1 });
  
//       return res.status(200).json({ orders });
  
//     } catch (error) {
//       return res.status(500).json({ message: error.message });
//     }
// }


// /* ================================
//    PRODUCTS BY CATEGORY
// ================================ */

// async function getProductsByCategory(req, res) {

//   try {

//     const categoryId = req.params.categoryId;

//     const products = await productModel
//       .find({
//         category_id: categoryId,
//         is_active: true
//       })
//       .select("name mrp discount_percent code");

//     return res.json(products);

//   } catch (error) {

//     return res.status(500).json({
//       message: "Something went wrong"
//     });

//   }

// }


// /* ================================
//    STORE INVOICE
// ================================ */

// async function store(req, res) {
//   const {
//     dealer_id,
//     order_date,
//     due_date,
//     discount_type,
//     tax_type,
//     notes,
//     businessId,
//     created_by,
//     deliveryNotes,
//     payment_term 
//   } = req.body;
//   const discount = Number(req.body.discount) || 0;
//   const tax = Number(req.body.tax) || 0;

//   const items = req.body.items || [];
//   const orderNumber = await generateOrderNumber();

//   /* SUBTOTAL */
//   const subtotal = items.reduce((sum, i) => {
//   const qty = Number(i.quantity) || 0;
//   const price = Number(i.unit_price) || 0;
//   const discountVal = Number(i.discount_percent) || 0;
//   const gross = qty * price;

//   const discountAmount =
//     i.discount_type === "amount"
//       ? discountVal
//       : (gross * discountVal) / 100;

//   return sum + (gross - discountAmount);
// }, 0);
//   /* DISCOUNT */
//   const discountAmount =
//     discount_type === "percent"
//       ? (Number(subtotal) * Number(discount) )/ 100
//       : discount;
//   /* TAX */
//   const taxAmount =
//     tax_type === "percent"
//       ? ((Number(subtotal) - Number(discountAmount)) * Number(tax)) / 100
//       : tax;


//   const total = Number(subtotal) - Number(discountAmount) + Number(taxAmount);

//   /* CREATE ORDER */
//   const order = await orderModel.create({
//     order_number: orderNumber,
//     dealer_id,
//     businessId,
//     order_date,
//     created_by: req.user.id,
//     due_date,
//     subtotal,
//     discount: discountAmount,
//     discount_type,
//     tax: taxAmount,
//     tax_type,
//     total,
//     notes,
//     deliveryNotes,
//     payment_term 
//   });
//   await AuditLogModel.create({
//     module: "ORDER",
//     entityId: order._id,
//     action: "CREATE",
// performedBy: req.user.id,
//     data: order,
//   });
//   console.log("USER:", req.user);

//   if (req.user.role === "admin") {
//     order.status = "approved";
//     await order.save();
//   }

//   /* CREATE ITEMS */
//   for (const item of items) {
//       const category = await productCategory.findById(item.category_id);

//   if (!category || category.is_active === false) {
//     return res.status(400).json({
//       success: false,
//       message: "Selected category is inactive"
//     });
//   }

//    if (!item.item_name || !item.quantity || !item.unit_price) continue;
//     await orderItemModel.create({
//   order_id: order._id,
//   category_id: item.category_id || null,  // ✅ save it
//   item_name: item.item_name,
//   product_id: item.product_id || null,
//   quantity: Number(item.quantity),
//   unit_price: Number(item.unit_price),
//   discount_percent: Number(item.discount_percent) || 0,
//   total:
//     item.discount_type === "percent"
//       ? Number(item.quantity) * Number(item.unit_price) * (1 - (Number(item.discount_percent) || 0) / 100)
//       : Number(item.quantity) * Number(item.unit_price) - (Number(item.discount_percent) || 0)
// });
//   }

//   return res.status(201).json({
//     message: "Order created successfully",
//     order
//   });
// }

// async function update(req, res) {
//   try {
//     const id = req.params.id;
//     const order = await orderModel.findById(id);

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     // ✅ DISPATCHER / MANAGER → status + deliveryNotes only
//     if (req.user.role === "dispatcher" || req.user.role === "manager") {
//       order.status = req.body.status;
//       order.deliveryNotes = req.body.deliveryNotes;
//       order.updated_by = req.user.id;
//       await order.save();
//       return res.json({ success: true, message: "Order updated successfully" });
//     }

//     // ✅ ACCOUNTANT → status + payment_term only
//     if (req.user.role === "accountant") {
//       order.status = req.body.status;
//       order.payment_term = req.body.payment_term;
//       order.updated_by = req.user.id;
//       await order.save();
//       return res.json({ success: true, message: "Order updated successfully" });
//     }

//     // ✅ ADMIN + SALESMAN → full edit
//     if (req.user.role === "salesman") {
//       order.status = "unapproved";
//     }

//     const {
//       dealer_id,
//       order_date,
//       due_date,
//       discount_type,
//       tax_type,
//       notes,
//       payment_term,
//       status,
//     } = req.body;

//     const items = req.body.items || [];

//     const subtotal = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

//     const discountInput = Number(req.body.discount) || 0;
//     const taxInput = Number(req.body.tax) || 0;

//     const discountAmount =
//       discount_type === "percent"
//         ? (subtotal * discountInput) / 100
//         : discountInput;

//     const taxAmount =
//       tax_type === "percent"
//         ? ((subtotal - discountAmount) * taxInput) / 100
//         : taxInput;

//     const total = subtotal - discountAmount + taxAmount;

//     await order.updateOne({
//       dealer_id,
//       updated_by: req.user.id,
//       order_date,
//       due_date,
//       subtotal,
//       discount: discountAmount,
//       discount_type,
//       tax: taxAmount,
//       tax_type,
//       total,
//       notes,
//       payment_term,
//       // ✅ admin can also update status directly via edit modal
//       ...(req.user.role === "admin" && status ? { status } : {}),
//     });

//     await orderItemModel.deleteMany({ order_id: id });

//     for (const item of items) {
//       if ((!item.product_id && !item.item_name) || !item.quantity || !item.unit_price) continue;

//       await orderItemModel.create({
//         order_id: id,
//         category_id: item.category_id || null,
//         product_id: item.product_id?._id || item.product_id || null,
//         quantity: Number(item.quantity),
//         item_name: item.item_name,
//         unit_price: Number(item.unit_price),
//         discount_percent: Number(item.discount_percent) || 0,
//         total: Number(item.total),
//       });
//     }
// await AuditLogModel.create({
//   module: "ORDER",
//   entityId: id,
//   action: "UPDATE",
// performedBy: req.user.id,
//   data: req.body,
// });

//     return res.status(200).json({ success: true, message: "Order updated successfully" });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// }

// async function updateOrderStatus (req, res){
//   try {
//     const id  = req.params.id;
//     const status = req.body.status;

//     const validStatuses = ["approved", "rejected", "pending", "posted","unapproved"];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
//       });
//     }

//     const order = await orderModel.findById(id);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//      if(req.body.status==="rejected"){
//       order.rejectReason=req.body.rejectReason;
//     }

//     if(req.body.status==="approved"){
//       order.rejectReason=null;
//     }

//     // if (order.status !== "unapproved") {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Only unapproved orders can be updated",
//     //   });
//     // }

//     order.status = status;
//     await order.save();
// await AuditLogModel.create({
//   module: "ORDER",
//   entityId: id,
//   action: "STATUS_CHANGE",
// performedBy: req.user.id,
//   data: {
//     status,
//     rejectReason: req.body.rejectReason || null
//   },
// });
//     return res.status(200).json({
//       success: true,
//       message: `Order ${status} successfully`,
//       data: order,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error,
//     });
//   }
// };


// /* ================================
//    DELETE INVOICE
// ================================ */

// async function remove(req, res) {
//   try {
//     const id = req.params.id;
//     const role = req.user.role;

//     let order;

//     if (role === "admin") {
//       // Admin can delete approved, unapproved, rejected
//       order = await orderModel.findOne({
//         _id: id,
//         status: { $in: ["unapproved", "approved", "rejected"] }
//       });
//     } else {
//       // Salesman can only delete own unapproved
//       order = await orderModel.findOne({ _id: id, status: "unapproved" });
//     }

//     if (!order) {
//       return res.status(400).json({
//         success: false,
//         message: "Order not found or cannot be deleted"
//       });
//     }

//     // ✅ AUDIT LOG (BEFORE DELETE)
//     await AuditLogModel.create({
//       module: "ORDER",
//       entityId: id,
//       action: "DELETE",
// performedBy: req.user.id,
//       data: order,
//     });

//     await orderModel.findByIdAndDelete(id);
//     await orderItemModel.deleteMany({ order_id: id });

//     return res.status(200).json({
//       success: true,
//       message: "Order deleted successfully"
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong"
//     });
//   }
// }

// /* ================================
//    GENERATE INVOICE NUMBER
// ================================ */

// async function generateOrderNumber() {

//   const last = await orderModel
//     .findOne()
//     .sort({ createdAt: -1 });

//   let serial = 1;

//   if (last && last.order_number) {

//     const match = last.order_number.match(/ORD-(\d+)-/);

//     if (match) {
//       serial = parseInt(match[1]) + 1;
//     }

//   }

//   const serialFormatted = String(serial).padStart(4, "0");

//   const today = new Date();

//   const formattedDate =
//     today.getDate() +
//     "-" +
//     (today.getMonth() + 1) +
//     "-" +
//     today.getFullYear().toString().slice(-2);

//   return `ORD-${serialFormatted}-${formattedDate}`;
// }

// // async function getOrderById(req, res) {
// //   try {
// //     const order = await orderModel
// //       .findById(req.params.id)
// //       .populate("dealer_id createdBy")

// //     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

// //     const items = await orderItemModel.find({ order_id: req.params.id }).populate("product_id");

// //     return res.status(200).json({ success: true, order, items });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: "Something went wrong" });
// //   }
// // }



// const downloadPDF = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const url = `${process.env.CLIENT_URL}/order/print/${id}`;

//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox"],
//     });

//     const page = await browser.newPage();

//     // Pass cookies if present
//     if (req.headers.cookie) {
//       await page.setExtraHTTPHeaders({ Cookie: req.headers.cookie });
//     }

//     await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

//     // Wait for invoice element
//     await page.waitForSelector("#invoice", { timeout: 10000 });

//     // Get full page height
//     const bodyHandle = await page.$("body");
//     const { height } = await bodyHandle.boundingBox();
//     await bodyHandle.dispose();

//     // Generate single-page PDF by setting height dynamically
// const pdf = await page.pdf({
//   format: "A4",
//   printBackground: true,
//   margin: {
//     top: "20mm",
//     bottom: "20mm",
//     left: "10mm",
//     right: "10mm",
//   },
//   displayHeaderFooter: true,
//   footerTemplate: `
//     <div style="width:100%; font-size:10px; text-align:center;">
//       Page <span class="pageNumber"></span> of <span class="totalPages"></span>
//     </div>
//   `,
//   headerTemplate: `<div></div>`,
// });
//     await browser.close();

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=order-${id}.pdf`,
//     });

//     return res.send(pdf);

//   } catch (error) {
    
//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate PDF",
//       error: error.message,
//     });
//   }
// };
// async function getOrderById(req, res) {
//   try {
//     const id = req.params.id;

//     /* ================= ORDER ================= */
// const order = await orderModel
//   .findById(id)
//   .populate("dealer_id created_by")
//   .populate("businessId");
//       if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }

//     /* ================= ITEMS ================= */
//     const items = await orderItemModel
//   .find({ order_id: id })
//   .populate("product_id")
//   .populate("category_id", "_id name");  // ✅ populate directly

// const formattedItems = items.map((item) => ({
//   _id: item._id,
//   category_id: item.category_id?._id || item.category_id || "",  // ✅ from item, not from product
//   product_id: item.product_id || null,
//   product_name: item.product_id?.name || "",
//   item_name: item.item_name,
//   quantity: item.quantity,
//   unit_price: item.unit_price,
//   discount_percent: item.discount_percent,
//   total: item.total
// }));

//     return res.status(200).json({
//       success: true,
//       order,
//       items: formattedItems
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong"
//     });
//   }
// }
// async function getAuditLogs(req, res) {
//   try {
//     const { module, entityId } = req.query;

//     const logs = await AuditLogModel
//       .find({ module, entityId })
// .populate("performedBy", "name role")
//       .sort({ createdAt: -1 });

//     return res.json({ success: true, logs });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// }

// module.exports = {
//   showAll,
//   store,
//   update,
//   remove,
//   updateOrderStatus,
//   getProductsByCategory,
//   getOrderById,
//   downloadPDF,
//   getDashboardStats,
//   getAuditLogs
// };







const {
  orderModel,
  orderItemModel,
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
  return req.user?._id || req.user?.id;
};

const getUserRole = (req) => {
  return req.user?.role || req.user?.user_type;
};

const calculateLineTotal = (item) => {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unit_price) || 0;
  const discountVal = Number(item.discount_percent) || 0;

  const gross = qty * price;

  if (item.discount_type === "amount") {
    return gross - discountVal;
  }

  return gross - (gross * discountVal) / 100;
};

const calculateOrderTotals = (items, discount, discount_type, tax, tax_type) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + calculateLineTotal(item);
  }, 0);

  const discountAmount =
    discount_type === "percent"
      ? (subtotal * Number(discount || 0)) / 100
      : Number(discount || 0);

  const taxAmount =
    tax_type === "percent"
      ? ((subtotal - discountAmount) * Number(tax || 0)) / 100
      : Number(tax || 0);

  const total = subtotal - discountAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
};

/* ================================
   DASHBOARD STATS
================================ */

async function getDashboardStats(req, res) {
  try {
    const businessId = req.params.id;
    const role = getUserRole(req);
    const userId = getUserId(req);

    let filter = { businessId };

    if (role === "salesman") {
      filter.created_by = userId;
    }

    if (role === "dispatcher" || role === "manager") {
      filter.status = { $in: ["approved"] };
    }

    if (role === "accountant") {
      filter.status = { $in: ["dispatched", "partial", "posted"] };
    }

    const totalOrders = await orderModel.countDocuments(filter);

    const activeOrders = await orderModel.countDocuments({
      ...filter,
      status: { $in: ["approved", "active", "partial"] },
    });

    const pendingOrders = await orderModel.countDocuments({
      ...filter,
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

/* ================================
   SHOW ALL ORDERS
================================ */

async function showAll(req, res) {
  try {
    const { id } = req.params;
    const role = getUserRole(req);
    const userId = getUserId(req);

    let filter = {
      businessId: id,
    };

    if (role === "salesman") {
      filter.created_by = userId;
    }

    if (role === "dispatcher" || role === "manager") {
      filter.status = { $in: ["dispatched", "partial", "approved"] };
    }

    if (role === "accountant") {
      filter.status = { $in: ["dispatched", "partial", "posted"] };
    }

    const orders = await orderModel
      .find(filter)
      .populate("dealer_id")
      
      .populate("businessId", "businessName business_logo addressLogo")
      
      .populate("created_by", "name email role user_type")
      .populate("updated_by", "name email role user_type")
      
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
        is_active: true,
      })
      .select("name mrp discount_percent code sku image");

    return res.json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}

/* ================================
   STORE ORDER
================================ */

async function store(req, res) {
  try {
    const {
      dealer_id,
      order_date,
      due_date,
      discount_type,
      tax_type,
      notes,
      businessId,
      deliveryNotes,
      payment_term,
    } = req.body;

    const role = getUserRole(req);
    const userId = getUserId(req);

    const discount = Number(req.body.discount) || 0;
    const tax = Number(req.body.tax) || 0;
    const items = req.body.items || [];

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one order item",
      });
    }

    for (const item of items) {
      if (!item.category_id) continue;

      const category = await productCategory.findById(item.category_id);

      if (!category || category.is_active === false) {
        return res.status(400).json({
          success: false,
          message: "Selected category is inactive",
        });
      }
    }

    const orderNumber = await generateOrderNumber();

    const { subtotal, discountAmount, taxAmount, total } = calculateOrderTotals(
      items,
      discount,
      discount_type,
      tax,
      tax_type
    );

    const initialStatus = role === "admin" ? "approved" : "unapproved";

    const order = await orderModel.create({
      order_number: orderNumber,
      dealer_id,
      businessId,
      order_date,
      created_by: userId,
      due_date,
      subtotal,
      discount: discountAmount,
      discount_type,
      tax: taxAmount,
      tax_type,
      total,
      notes,
      deliveryNotes,
      payment_term,
      status: initialStatus,
    });

    const createdItems = [];

    for (const item of items) {
      if ((!item.product_id && !item.item_name) || !item.quantity || !item.unit_price) {
        continue;
      }

      const lineTotal = calculateLineTotal(item);

      const createdItem = await orderItemModel.create({
        order_id: order._id,
        category_id: item.category_id || null,
        product_id: item.product_id?._id || item.product_id || null,
        item_name: item.item_name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount_percent: Number(item.discount_percent) || 0,
        total: lineTotal,
      });

      createdItems.push(createdItem);
    }

    await createAuditLog({
      req,
      businessId: order.businessId,
      module: AUDIT_MODULES.ORDER,
      entityId: order._id,
      entityModel: "Order",
      entityLabel: order.order_number,
      action: AUDIT_ACTIONS.CREATE,
      description: `Order ${order.order_number} created`,
      after: order,
      meta: {
        items: createdItems,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================================
   UPDATE ORDER
================================ */

async function update(req, res) {
  try {
    const id = req.params.id;
    const role = getUserRole(req);
    const userId = getUserId(req);

    const oldOrder = await orderModel.findById(id).lean();

    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const oldItems = await orderItemModel.find({ order_id: id }).lean();

    /*
    |--------------------------------------------------------------------------
    | DISPATCHER / MANAGER
    |--------------------------------------------------------------------------
    | Sirf status + deliveryNotes update kar sakte hain.
    */
    if (role === "dispatcher" || role === "manager") {
      const updatedOrder = await orderModel
        .findByIdAndUpdate(
          id,
          {
            status: req.body.status,
            deliveryNotes: req.body.deliveryNotes,
            updated_by: userId,
          },
          {
            new: true,
            runValidators: true,
          }
        )
        .lean();

      await createAuditLog({
        req,
        businessId: updatedOrder.businessId,
        module: AUDIT_MODULES.ORDER,
        entityId: updatedOrder._id,
        entityModel: "Order",
        entityLabel: updatedOrder.order_number,
        action:
          oldOrder.status !== updatedOrder.status
            ? AUDIT_ACTIONS.STATUS_CHANGE
            : AUDIT_ACTIONS.UPDATE,
        description:
          oldOrder.status !== updatedOrder.status
            ? `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`
            : `Order ${updatedOrder.order_number} updated`,
        before: oldOrder,
        after: updatedOrder,
      });

      return res.json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNTANT
    |--------------------------------------------------------------------------
    | Sirf status + payment_term update kar sakta hai.
    */
    if (role === "accountant") {
      const updatedOrder = await orderModel
        .findByIdAndUpdate(
          id,
          {
            status: req.body.status,
            payment_term: req.body.payment_term,
            updated_by: userId,
          },
          {
            new: true,
            runValidators: true,
          }
        )
        .lean();

      await createAuditLog({
        req,
        businessId: updatedOrder.businessId,
        module: AUDIT_MODULES.ORDER,
        entityId: updatedOrder._id,
        entityModel: "Order",
        entityLabel: updatedOrder.order_number,
        action:
          oldOrder.status !== updatedOrder.status
            ? AUDIT_ACTIONS.STATUS_CHANGE
            : AUDIT_ACTIONS.UPDATE,
        description:
          oldOrder.status !== updatedOrder.status
            ? `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`
            : `Order ${updatedOrder.order_number} updated`,
        before: oldOrder,
        after: updatedOrder,
      });

      return res.json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN + SALESMAN FULL UPDATE
    |--------------------------------------------------------------------------
    */
    const {
      dealer_id,
      order_date,
      due_date,
      discount_type,
      tax_type,
      notes,
      payment_term,
      status,
      deliveryNotes,
    } = req.body;

    const items = req.body.items || [];

    const discountInput = Number(req.body.discount) || 0;
    const taxInput = Number(req.body.tax) || 0;

    const { subtotal, discountAmount, taxAmount, total } = calculateOrderTotals(
      items,
      discountInput,
      discount_type,
      taxInput,
      tax_type
    );

    const updatePayload = {
      dealer_id,
      updated_by: userId,
      order_date,
      due_date,
      subtotal,
      discount: discountAmount,
      discount_type,
      tax: taxAmount,
      tax_type,
      total,
      notes,
      payment_term,
      deliveryNotes,
    };

    if (role === "salesman") {
      updatePayload.status = "unapproved";
    }

    if (role === "admin" && status) {
      updatePayload.status = status;
    }

    const updatedOrder = await orderModel
      .findByIdAndUpdate(id, updatePayload, {
        new: true,
        runValidators: true,
      })
      .lean();

    await orderItemModel.deleteMany({ order_id: id });

    const newItems = [];

    for (const item of items) {
      if ((!item.product_id && !item.item_name) || !item.quantity || !item.unit_price) {
        continue;
      }

      const lineTotal = calculateLineTotal(item);

      const newItem = await orderItemModel.create({
        order_id: id,
        category_id: item.category_id || null,
        product_id: item.product_id?._id || item.product_id || null,
        quantity: Number(item.quantity),
        item_name: item.item_name,
        unit_price: Number(item.unit_price),
        discount_percent: Number(item.discount_percent) || 0,
        total: lineTotal,
      });

      newItems.push(newItem);
    }

    await createAuditLog({
      req,
      businessId: updatedOrder.businessId,
      module: AUDIT_MODULES.ORDER,
      entityId: updatedOrder._id,
      entityModel: "Order",
      entityLabel: updatedOrder.order_number,
      action:
        oldOrder.status !== updatedOrder.status
          ? AUDIT_ACTIONS.STATUS_CHANGE
          : AUDIT_ACTIONS.UPDATE,
      description:
        oldOrder.status !== updatedOrder.status
          ? `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`
          : `Order ${updatedOrder.order_number} updated`,
      before: oldOrder,
      after: updatedOrder,
      meta: {
        oldItems,
        newItems,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================================
   UPDATE ORDER STATUS
================================ */

async function updateOrderStatus(req, res) {
  try {
    const id = req.params.id;
    const { status, rejectReason } = req.body;
    const userId = getUserId(req);

    const validStatuses = [
      "pending",
      "unpaid",
      "unapproved",
      "approved",
      "active",
      "partial",
      "paid",
      "posted",
      "rejected",
      "dispatched",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const oldOrder = await orderModel.findById(id).lean();

    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatePayload = {
      status,
      updated_by: userId,
    };

    if (status === "rejected") {
      updatePayload.rejectReason = rejectReason || null;
    }

    if (status === "approved") {
      updatePayload.rejectReason = null;
    }

    const updatedOrder = await orderModel
      .findByIdAndUpdate(id, updatePayload, {
        new: true,
        runValidators: true,
      })
      .lean();

    let action = AUDIT_ACTIONS.STATUS_CHANGE;

    if (status === "approved") {
      action = AUDIT_ACTIONS.APPROVE;
    }

    if (status === "rejected") {
      action = AUDIT_ACTIONS.REJECT;
    }

    await createAuditLog({
      req,
      businessId: updatedOrder.businessId,
      module: AUDIT_MODULES.ORDER,
      entityId: updatedOrder._id,
      entityModel: "Order",
      entityLabel: updatedOrder.order_number,
      action,
      description: `Order ${updatedOrder.order_number} status changed from ${oldOrder.status} to ${updatedOrder.status}`,
      before: oldOrder,
      after: updatedOrder,
      reason: rejectReason || null,
    });

    return res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      data: updatedOrder,
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
   DELETE ORDER
================================ */

async function remove(req, res) {
  try {
    const id = req.params.id;
    const role = getUserRole(req);
    const userId = getUserId(req);

    let order;

    if (role === "admin") {
      order = await orderModel
        .findOne({
          _id: id,
          status: { $in: ["unapproved", "approved", "rejected"] },
        })
        .lean();
    } else {
      order = await orderModel
        .findOne({
          _id: id,
          status: "unapproved",
          created_by: userId,
        })
        .lean();
    }

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order not found or cannot be deleted",
      });
    }

    const oldItems = await orderItemModel.find({ order_id: id }).lean();

    await createAuditLog({
      req,
      businessId: order.businessId,
      module: AUDIT_MODULES.ORDER,
      entityId: order._id,
      entityModel: "Order",
      entityLabel: order.order_number,
      action: AUDIT_ACTIONS.DELETE,
      description: `Order ${order.order_number} deleted`,
      before: order,
      after: null,
      meta: {
        deletedItems: oldItems,
      },
    });

    await orderModel.findByIdAndDelete(id);
    await orderItemModel.deleteMany({ order_id: id });

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
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
   GENERATE ORDER NUMBER
================================ */

async function generateOrderNumber() {
  const last = await orderModel.findOne().sort({ createdAt: -1 });

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

/* ================================
   GET ORDER BY ID
================================ */

async function getOrderById(req, res) {
  try {
    const id = req.params.id;

    const order = await orderModel
      .findById(id)
      .populate("dealer_id")
      .populate("created_by", "name email role user_type")
      .populate("updated_by", "name email role user_type")
      .populate("businessId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const items = await orderItemModel
      .find({ order_id: id })
      .populate("product_id")
      .populate("category_id", "_id name");

    const formattedItems = items.map((item) => ({
      _id: item._id,
      category_id: item.category_id?._id || item.category_id || "",
      category_name: item.category_id?.name || "",
      product_id: item.product_id || null,
      product_name: item.product_id?.name || "",
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      total: item.total,
    }));

    return res.status(200).json({
      success: true,
      order,
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
   DOWNLOAD PDF
================================ */

const downloadPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const url = `${process.env.CLIENT_URL}/order/print/${id}`;

    const browser = await puppeteer.launch({
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
    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
    });
  }
};

/* ================================
   EXPORTS
================================ */

module.exports = {
  showAll,
  store,
  update,
  remove,
  updateOrderStatus,
  getProductsByCategory,
  getOrderById,
  downloadPDF,
  getDashboardStats,
};