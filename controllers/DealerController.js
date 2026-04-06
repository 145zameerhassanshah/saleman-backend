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
      city,
      business_logo,
      billing_address,
shipping_address,
country,
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
if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,     
        message: "City is required"
      });
    } 
    if (!country || !country.trim()) {
      return res.status(400).json({
        success: false,
        message: "Country is required"
      });
    } 
    if (!whatsapp_number || !whatsapp_number.trim()) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp number is required"
      });
    } 
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,     message: "Email is required"
      });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    } 
    if(shipping_address && !shipping_address.trim()){
      return res.status(400).json({
        success: false,
        message: "Shipping address cannot be empty"
      });
    } 
if(billing_address && !billing_address.trim()){
      return res.status(400).json({
        success: false,
        message: "Billing address cannot be empty"
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
      city,
        billing_address,
shipping_address,
      country,
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
console.log("REQ USER:", req.user);
    let filter = {
      businessId: req.params.businessId
    };

    
    if (req.user.role === "salesman") {
      filter.userId = new mongoose.Types.ObjectId(req.user.id);
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
};
// //   GET SINGLE DEALER
// ========================= */

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

    let updateData = {
      ...req.body,
      is_active:
        req.body.is_active === "true" || req.body.is_active === true
    };

    // 🔥 IMAGE UPDATE FIX
    if (req.file) {

      // OPTIONAL: delete old image
      if (dealer.business_logo) {
        try {
          fs.unlinkSync(`uploads/${dealer.business_logo}`);
        } catch {}
      }

      updateData.business_logo = req.file.filename;
    }

    const updated = await Dealer.findByIdAndUpdate(
      req.params.dealerId,
      updateData,
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