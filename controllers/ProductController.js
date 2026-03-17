const mongoose = require("mongoose");
const Product = require("../models/ProductModel");

/* =========================
   CREATE PRODUCT
========================= */

const createProduct = async (req, res) => {
  try {

    const { name, sku, mrp, category_id } = req.body;

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

    if (!req.file && !req.body.image) {
      return res.status(400).json({ success:false, message: "Product image is required" });
    }

    /* 🔥 SKU CHECK (within business) */
    const existProduct = await Product.findOne({
      sku,
      businessId: req.user.businessId
    });

    if (existProduct) {
      return res.status(400).json({
        success:false,
        message: "SKU already exists in your business"
      });
    }

    /* 🔥 CREATE */
    const product = new Product({
      ...req.body,
      businessId: req.user.businessId, // ✅ IMPORTANT
      image: req.file ? req.file.filename : req.body.image
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

/* =========================
   GET PRODUCTS (MY BUSINESS)
========================= */

const getProducts = async (req,res)=>{
  try{

    const products = await Product.find({
      businessId: req.user.businessId // ✅ FILTER
    })
    .populate("category_id","name")
    .populate("subcategory_id","name");

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
      businessId:req.user.businessId // ✅ SECURITY
    })
    .populate("category_id","name")
    .populate("subcategory_id","name");

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

/* =========================
   UPDATE PRODUCT
========================= */

const updateProduct = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success:false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findOne({
      _id:id,
      businessId:req.user.businessId // ✅ CHECK OWNERSHIP
    });

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
    }

    /* SKU CHECK */
    if (req.body.sku) {
      const existing = await Product.findOne({
        sku:req.body.sku,
        businessId:req.user.businessId,
        _id:{ $ne:id }
      });

      if (existing) {
        return res.status(400).json({
          success:false,
          message:"SKU already used"
        });
      }
    }

    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new:true }
    );

    res.status(200).json({
      success:true,
      message:"Product updated successfully",
      product:updated
    });

  } catch (err) {
    res.status(500).json({
      success:false,
      message: err.message
    });
  }
};

/* =========================
   DELETE PRODUCT
========================= */

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
      businessId:req.user.businessId // ✅ SECURITY
    });

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
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