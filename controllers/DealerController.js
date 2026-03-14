const Dealer = require("../models/DealerModel");

const createDealer = async (req,res)=>{
  try{

    const {name,email,company_name} = req.body;

    const existDealer = await Dealer.findOne({
      $or:[{name},{email},{company_name}]
    });

    if(existDealer){
      return res.status(400).json({
        message:"Dealer already exists"
      });
    }

    const dealer = new Dealer({
      ...req.body
    });

    await dealer.save();

    res.status(201).json({
      success:true,
      message:"Dealer created successfully",
      dealer
    });

  }catch(err){
    console.log(err);
    res.status(500).json({message:"Server error"});
  }
};


const getDealers = async (req,res)=>{
  try{

    const dealers = await Dealer.find();

    res.json({
      success:true,
      dealers
    });

  }catch(err){
    res.status(500).json({message:"Error fetching dealers"});
  }
};


const getDealerById = async (req,res)=>{
  try{

    const dealer = await Dealer.findById(req.params.id);

    if(!dealer){
      return res.status(404).json({message:"Dealer not found"});
    }

    res.json({success:true,dealer});

  }catch(err){
    res.status(500).json({message:"Error fetching dealer"});
  }
};


const updateDealer = async (req,res)=>{
  try{

    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    );

    res.json({
      success:true,
      message:"Dealer updated successfully",
      dealer
    });

  }catch(err){
    res.status(500).json({message:"Update failed"});
  }
};


const deleteDealer = async (req,res)=>{
  try{

    await Dealer.findByIdAndDelete(req.params.id);

    res.json({
      success:true,
      message:"Dealer deleted successfully"
    });

  }catch(err){
    res.status(500).json({message:"Delete failed"});
  }
};


module.exports = {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer
};