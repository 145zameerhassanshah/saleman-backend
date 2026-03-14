const mongoose = require("mongoose");
const Product = require("../models/ProductModel");

/* =========================
   CREATE PRODUCT
========================= */

const createProduct = async (req,res)=>{
  try{

    const { code } = req.body;

    const existProduct = await Product.findOne({ code });

    if(existProduct){
      return res.status(400).json({
        success:false,
        message:"Product code already exists"
      });
    }

    const product = new Product(req.body);

    await product.save();

    res.status(201).json({
      success:true,
      message:"Product created successfully",
      product
    });

  }catch(err){
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Server error"
    });
  }
};



/* =========================
   GET ALL PRODUCTS
========================= */

const getProducts = async (req,res)=>{
  try{

    const products = await Product.find()
      .populate("category_id","name")
      .populate("subcategory_id","name");

    res.status(200).json({
      success:true,
      count:products.length,
      products
    });

  }catch(err){
    console.log(err);
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

    const product = await Product.findById(id)
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
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Error fetching product"
    });
  }
};



/* =========================
   UPDATE PRODUCT
========================= */

const updateProduct = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid product ID"
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      {new:true,runValidators:true}
    );

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
    }

    res.status(200).json({
      success:true,
      message:"Product updated successfully",
      product
    });

  }catch(err){
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Update failed"
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

    const product = await Product.findByIdAndDelete(id);

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
    }

    res.status(200).json({
      success:true,
      message:"Product deleted successfully"
    });

  }catch(err){
    console.log(err);
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