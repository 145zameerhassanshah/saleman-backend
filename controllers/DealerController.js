const mongoose = require("mongoose");
const Dealer = require("../models/DealerModel");

/* =========================
   CREATE DEALER
========================= */

const createDealer = async (req,res)=>{
  try{

    const {email,phone_number,company_name} = req.body;

    const existDealer = await Dealer.findOne({
      $or:[
        {email},
        {phone_number},
        {company_name}
      ]
    });

    if(existDealer){
      return res.status(400).json({
        success:false,
        message:"Dealer already exists"
      });
    }

    const dealer = new Dealer({
      ...req.body,
      created_by:req.user.id
    });

    await dealer.save();

    res.status(201).json({
      success:true,
      message:"Dealer created successfully",
      dealer
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
   GET ALL DEALERS
========================= */

const getDealers = async (req,res)=>{
  try{

    const dealers = await Dealer.find()

    res.status(200).json({
      success:true,
      count:dealers.length,
      dealers
    });

  }catch(err){
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Error fetching dealers"
    });
  }
};



/* =========================
   GET SINGLE DEALER
========================= */

const getDealerById = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid dealer ID"
      });
    }

    const dealer = await Dealer.findById(id)

    if(!dealer){
      return res.status(404).json({
        success:false,
        message:"Dealer not found"
      });
    }

    res.status(200).json({
      success:true,
      dealer
    });

  }catch(err){
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Error fetching dealer"
    });
  }
};



/* =========================
   UPDATE DEALER
========================= */

const updateDealer = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid dealer ID"
      });
    }

    const dealer = await Dealer.findByIdAndUpdate(
      id,
      req.body,
      {new:true,runValidators:true}
    );

    if(!dealer){
      return res.status(404).json({
        success:false,
        message:"Dealer not found"
      });
    }

    res.status(200).json({
      success:true,
      message:"Dealer updated successfully",
      dealer
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
   DELETE DEALER
========================= */

const deleteDealer = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid dealer ID"
      });
    }

    const dealer = await Dealer.findByIdAndDelete(id);

    if(!dealer){
      return res.status(404).json({
        success:false,
        message:"Dealer not found"
      });
    }

    res.status(200).json({
      success:true,
      message:"Dealer deleted successfully"
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
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer
};