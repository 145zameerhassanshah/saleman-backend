const { industryModel } = require("../models/exporter");

async function getAllIndustries(req, res) {
  try {
    const industry = await industryModel.find();
    res.status(200).json({
      success: true,
      count: industry.length,
      industry,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching industries",
    });
  }
}

async function createIndustry(req, res) {
  try {
    const { businessName, registrationNo,bussinesEmail } = req.body;

    /* ================= CHECK EXIST ================= */
if (await industryModel.findOne({ bussinesEmail })) {
  return res.status(400).json({
    success: false,
    message: "Email already exists",
  });
}

if (await industryModel.findOne({ businessName })) {
  return res.status(400).json({
    success: false,
    message: "Business name already exists",
  });
}

if (await industryModel.findOne({ registrationNo })) {
  return res.status(400).json({
    success: false,
    message: "Registration number already exists",
  });
}    /* ================= HANDLE IMAGE ================= */
    let business_logo = null;

    if (req.file) {
      business_logo = req.file.filename;
    }

    /* ================= CREATE ================= */
    const industry = new industryModel({
      ...req.body,
      business_logo, // save image
      createdBy: req.user.id,
    });

    await industry.save();

    res.status(201).json({
      success: true,
      message: "Business created successfully",
      industry,
    });

  } catch (error) {
    console.log(error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function getIndustryById(req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Industry ID",
      });
    }

    const industry = await industryModel.findById(id);

    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Industry not found",
      });
    }

    res.status(200).json({
      success: true,
      industry,
    });
  } catch (error) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error fetching industry",
    });
  }
}

const updateIndustry = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid industry ID"
      });
    }

    const industry = await industryModel.findByIdAndUpdate(
      id,
      req.body,
      {new:true,runValidators:true}
    );

    if(!industry){
      return res.status(404).json({
        success:false,
        message:"Industry not found"
      });
    }

    res.status(200).json({
      success:true,
      message:"Industry updated successfully",
      industry
    });

  }catch(err){
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Update failed"
    });
  }
};

const deleteIndustry = async (req,res)=>{
  try{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid industry ID"
      });
    }

    const industry = await industryModel.findByIdAndDelete(id);

    if(!industry){
      return res.status(404).json({
        success:false,
        message:"Industry not found"
      });
    }

    res.status(200).json({
      success:true,
      message:"Industry deleted successfully"
    });

  }catch(err){
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Delete failed"
    });
  }
};

module.exports={
    createIndustry,
    getAllIndustries,
    deleteIndustry,
    getIndustryById,
    updateIndustry
}
