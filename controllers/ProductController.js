const Product = require("../models/ProductModel");

const createProduct = async (req,res)=>{
  try{

    const existProduct = await Product.findOne({
      code:req.body.code
    });

    if(existProduct){
      return res.status(400).json({
        message:"Product code already exists"
      });
    }

    const product = new Product(req.body);

    await product.save();

    res.status(201).json({
      success:true,
      message:"Product created",
      product
    });

  }catch(err){
    console.log(err);
    res.status(500).json({message:"Server error"});
  }
};

module.exports = {createProduct};