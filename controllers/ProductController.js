const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const fs = require("fs");

/* =========================
   CREATE PRODUCT
========================= */

const createProduct = async (req, res) => {
  try {

    const {
      name,
      sku,
      mrp,
      discount_percent,
      order_no,
      description,
      category_id,
      is_active
    } = req.body;

    /* VALIDATION */

    if (!name || !name.trim()) {
      return res.status(400).json({ success:false, message: "Product name is required" });
    }

    if (!sku || !sku.trim()) {
      return res.status(400).json({ success:false, message: "SKU is required" });
    }

    if (!mrp || Number(mrp) <= 0) {
      return res.status(400).json({ success:false, message: "MRP must be greater than 0" });
    }

    if (!category_id) {
      return res.status(400).json({ success:false, message: "Category is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success:false, message: "Product image is required" });
    }


    const existProduct = await Product.findOne({
      sku,
    });


    if (existProduct) {
      return res.status(400).json({
        success:false,
        message: "SKU already exists in your business"
      });
    }


    const product = new Product({
      name: name.trim(),
      sku: sku.trim(),
      mrp: Number(mrp),
      discount_percent: Number(discount_percent || 0),
      order_no: Number(order_no || 0),
      description,
      category_id,
      is_active: is_active === "true" || is_active === true,
      businessId: req.params.id,
      image: req.file.filename
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });

  } catch (err) {
    res.status(500).json({
      success:false,
      message: err.message
    });
  }
};


const getProducts = async (req,res)=>{
  try{

    const products = await Product.find({
      businessId: req.params.id
    })
    .populate("category_id","name")

    res.status(200).json({
      success:true,
      count:products.length,
      products
    });

  }catch(err){
    res.status(500).json({
      success:false,
      message:"Error fetching products"
    });
  }
};

/* =========================
   GET PRODUCT BY ID
========================= */

const getProductById = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid product ID"
      });
    }

    const product = await Product.findOne({
      _id:id,
      businessId:req.params.id
    })
    .populate("category_id","name")

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
    }

    res.status(200).json({
      success:true,
      product
    });

  }catch(err){
    res.status(500).json({
      success:false,
      message:"Error fetching product"
    });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const isactive=req.body?.is_active==='true'?true:false;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // ✅ businessId from req.user, not req.params
    const product = await Product.findOne({ _id: id, businessId: req.body.industry });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (req.body.sku) {
      const existing = await Product.findOne({
        sku: req.body.sku,
        businessId: req.body.industry,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({ success: false, message: "SKU already used" });
      }
    }

    const updateData = {
      name: req.body.name,
      sku: req.body.sku,
      mrp: req.body.mrp,
      discount_percent: req.body.discount_percent,
      order_no: req.body.order_no,
      description: req.body.description,
      category_id: req.body.category_id,
      is_active: isactive,
    };

    if (req.file) {
      if (product.image) {
        try { fs.unlinkSync(`uploads/${product.image}`); } catch { console.log("Old image not found"); }
      }
      updateData.image = req.file.filename;
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ success: true, message: "Product updated successfully", product: updated });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const deleteProduct = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid product ID"
      });
    }

    const product = await Product.findOne({
      _id:id,
    });

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
    }


    if (product.image) {
      try {
        fs.unlinkSync(`uploads/${product.image}`);
      } catch (err) {
        console.log("Image not found");
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success:true,
      message:"Product deleted successfully"
    });

  }catch(err){
    res.status(500).json({
      success:false,
      message:"Delete failed"
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};