const mongoose = require("mongoose");
const Dealer = require("../models/DealerModel");
const fs = require("fs");

/* =========================
   CREATE DEALER
========================= */

const createDealer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone_number,
      whatsapp_number,
      company_name,
      address,
      city,
      business_logo,
      is_active,
      userId   
    } = req.body;

    /* VALIDATION */

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Dealer name is required"
      });
    }

    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name is required"
      });
    }

    /* UNIQUE CHECK (BUSINESS BASED) */

    const existDealer = await Dealer.findOne({
      businessId: req.params.businessId ,
      $or: [
        { email },
        { phone_number },
        { company_name }
      ]
    });

    if (existDealer) {
      return res.status(400).json({
        success: false,
        message: "Dealer already exists in your business"
      });
    }

    const dealer = new Dealer({
      name: name.trim(),
      email,
      phone_number: phone_number.trim(),
      whatsapp_number,
      company_name: company_name.trim(),
      address,
      city,
      userId: userId || null,
business_logo: req.file ? req.file.filename : null,
      is_active: is_active === "true" || is_active === true,
      businessId: req.params.businessId ,
      created_by: req.user.id
    });

    await dealer.save();

    res.status(201).json({
      success: true,
      message: "Dealer created successfully",
      dealer
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 
/* =========================
   GET ALL DEALERS
========================= */

const getDealers = async (req, res) => {
  try {

    let filter = {
      businessId: req.params.businessId
    };

    if (req.user.user_type === "salesman") {
      filter.userId = req.user.id;
    }

    const dealers = await Dealer.find(filter)
      .populate("userId", "name email"); 

    res.json({
      success: true,
      dealers
    });

  } catch {
    res.status(500).json({ success: false });
  }
};/* =========================
   GET SINGLE DEALER
========================= */

const getDealerById = async (req, res) => {
  try {

    const dealer = await Dealer.findById(req.params.dealerId);

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found"
      });
    }

    res.json({
      success: true,
      dealer
    });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* =========================
   UPDATE DEALER
========================= */

const updateDealer = async (req, res) => {
  try {

    const dealer = await Dealer.findById(req.params.dealerId);

    if (!dealer) {
      return res.status(404).json({ success: false });
    }

    const updated = await Dealer.findByIdAndUpdate(
      req.params.dealerId,
      {
        ...req.body,
        is_active:
          req.body.is_active === "true" || req.body.is_active === true
      },
      { new: true }
    );

    res.json({
      success: true,
      dealer: updated
    });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* =========================
   DELETE DEALER
========================= */

const deleteDealer = async (req, res) => {
  try {

    await Dealer.findByIdAndDelete(req.params.dealerId);

    res.json({
      success: true,
      message: "Dealer deleted"
    });

  } catch {
    res.status(500).json({ success: false });
  }
};module.exports = {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer
};