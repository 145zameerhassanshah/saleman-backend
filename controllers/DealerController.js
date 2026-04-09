const mongoose = require("mongoose");
const Dealer = require("../models/DealerModel");
const fs = require("fs");

/* ================= CREATE DEALER ================= */

const createDealer = async (req, res) => {
  try {
    const {
      name, email, phone_number, whatsapp_number,
      company_name, city, billing_address,
      shipping_address, country, is_active, userId
    } = req.body;

    /* VALIDATION */
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Dealer name is required" });
    if (!email?.trim()) return res.status(400).json({ success: false, message: "Email is required" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: "Invalid email" });
    if (!phone_number?.trim()) return res.status(400).json({ success: false, message: "Phone required" });
    if (!company_name?.trim()) return res.status(400).json({ success: false, message: "Company required" });

    if (req.user.role === "admin" && !userId) {
      return res.status(400).json({ success: false, message: "Salesman required" });
    }

    /* UNIQUE */
    const exist = await Dealer.findOne({
      businessId: req.params.businessId,
      $or: [{ email }, { phone_number }, { company_name }]
    });

    if (exist) {
      return res.status(400).json({ success: false, message: "Dealer already exists" });
    }

    /* ASSIGN */
    const assigned_to = req.user.role === "admin" ? userId : req.user.id;
    const status = req.user.role === "admin" ? "approved" : "pending";

    const dealer = new Dealer({
      name: name.trim(),
      email,
      phone_number,
      whatsapp_number,
      company_name,
      city,
      billing_address,
      shipping_address,
      country,
      business_logo: req.file ? req.file.path : null,
      is_active: is_active === "true" || is_active === true,
      businessId: req.params.businessId,
      created_by: req.user.id,
      assigned_to,
      status,
      assignment_history: [{
        from: null,
        to: assigned_to,
        changed_by: req.user.id,
        note: "Dealer created"
      }]
    });

    await dealer.save();

    res.json({
      success: true,
      message: status === "approved" ? "Created & approved" : "Submitted for approval",
      dealer
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET ALL ================= */

const getDealers = async (req, res) => {
  try {
    let filter = { businessId: req.params.businessId };

    if (req.user.role === "salesman") {
      filter.assigned_to = req.user.id;
    }

    const dealers = await Dealer.find(filter)
      .populate("assigned_to", "name")
      .populate("created_by", "name");

    res.json({ success: true, dealers });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= GET SINGLE ================= */

const getDealerById = async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.dealerId)
      .populate("assigned_to", "name")
      .populate("created_by", "name")
        .populate("assignment_history.from", "name")
  .populate("assignment_history.to", "name")
  .populate("assignment_history.changed_by", "name");

    if (!dealer) return res.status(404).json({ success: false });

    // 🔥 SALESMAN SECURITY
    if (req.user.role === "salesman" &&
      String(dealer.assigned_to) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, dealer });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= UPDATE ================= */

const updateDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.dealerId);
    if (!dealer) return res.status(404).json({ success: false });

    // 🔥 SALESMAN LIMIT
    if (req.user.role === "salesman" &&
      String(dealer.assigned_to) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    let updateData = {
      ...req.body,
      is_active: req.body.is_active === "true" || req.body.is_active === true
    };

    /* IMAGE */
    if (req.file) {
      updateData.business_logo = req.file.path;
    }

    /* ADMIN REASSIGN */
    if (req.user.role === "admin" && req.body.userId &&
      String(req.body.userId) !== String(dealer.assigned_to)) {

      dealer.assignment_history.push({
        from: dealer.assigned_to,
        to: req.body.userId,
        changed_by: req.user.id,
        note: "Reassigned during edit"
      });

      updateData.assigned_to = req.body.userId;
    }

    /* SALESMAN EDIT */
    if (req.user.role === "salesman" && dealer.status === "approved") {
      updateData.status = "pending";
    }

    updateData.updated_by = req.user.id;

    const updated = await Dealer.findByIdAndUpdate(
      req.params.dealerId,
      updateData,
      { new: true }
    );

    await dealer.save();

    res.json({ success: true, dealer: updated });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= STATUS ================= */

const updateDealerStatus = async (req, res) => {
  try {
    const { status, rejectReason } = req.body;

    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) return res.status(404).json({ success: false });

    const validTransitions = {
      pending: ["approved", "rejected"],
      approved: ["unapproved", "rejected"],
      unapproved: ["approved"],
      rejected: ["approved"]
    };

    if (!validTransitions[dealer.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid transition" });
    }

    if (status === "rejected" && !rejectReason?.trim()) {
      return res.status(400).json({ success: false, message: "Reason required" });
    }

    dealer.status = status;
    dealer.rejectReason = status === "rejected" ? rejectReason : "";
    dealer.updated_by = req.user.id;

    dealer.assignment_history.push({
      from: dealer.assigned_to,
      to: dealer.assigned_to,
      changed_by: req.user.id,
      note: `Status → ${status}`
    });

    await dealer.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= UNAPPROVE ================= */

const unapproveDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);

    if (!dealer || dealer.status !== "approved") {
      return res.status(400).json({ success: false });
    }

    dealer.status = "unapproved";
    dealer.updated_by = req.user.id;

    await dealer.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= REASSIGN ================= */

const reassignDealer = async (req, res) => {
  try {
    const { newSalesmanId, reason} = req.body;

    if (!mongoose.Types.ObjectId.isValid(newSalesmanId)) {
      return res.status(400).json({ success: false });
    }

    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) return res.status(404).json({ success: false });

    dealer.assignment_history.push({
      from: dealer.assigned_to,
      to: newSalesmanId,
      changed_by: req.user.id,
note: reason?.trim() || "Reassigned"
    });

    dealer.assigned_to = newSalesmanId;
    dealer.updated_by = req.user.id;

    await dealer.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= DELETE ================= */

const deleteDealer = async (req, res) => {
  try {
    await Dealer.findByIdAndDelete(req.params.dealerId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  updateDealerStatus,
  unapproveDealer,
  reassignDealer,
  deleteDealer
};