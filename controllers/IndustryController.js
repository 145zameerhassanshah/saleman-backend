// const { industryModel } = require("../models/exporter");

// async function getAllIndustries(req, res) {
//   try {
//     const industry = await industryModel.find();
//     res.status(200).json({
//       success: true,
//       count: industry.length,
//       industry,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching industries",
//     });
//   }
// }

// async function createIndustry(req, res) {
//   try {
//     const { businessName, registrationNo,bussinesEmail } = req.body;

//     /* ================= CHECK EXIST ================= */
// if (await industryModel.findOne({ bussinesEmail })) {
//   return res.status(400).json({
//     success: false,
//     message: "Email already exists",
//   });
// }

// if (await industryModel.findOne({ businessName })) {
//   return res.status(400).json({
//     success: false,
//     message: "Business name already exists",
//   });
// }

// if (await industryModel.findOne({ registrationNo })) {
//   return res.status(400).json({
//     success: false,
//     message: "Registration number already exists",
//   });
// }    /* ================= HANDLE IMAGE ================= */
//     let business_logo = null;

//     if (req.file) {
//       business_logo = req.file.filename;
//     }

//     /* ================= CREATE ================= */
//     const industry = new industryModel({
//       ...req.body,
//       business_logo, // save image
//       createdBy: req.user.id,
//     });

//     await industry.save();

//     res.status(201).json({
//       success: true,
//       message: "Business created successfully",
//       industry,
//     });

//   } catch (error) {
//     console.log(error.message);

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// }

// async function getIndustryById(req, res) {
//   try {
//     const id = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Industry ID",
//       });
//     }

//     const industry = await industryModel.findById(id);

//     if (!industry) {
//       return res.status(404).json({
//         success: false,
//         message: "Industry not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       industry,
//     });
//   } catch (error) {
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching industry",
//     });
//   }
// }

// const updateIndustry = async (req,res)=>{
//   try{

//     const {id} = req.params;

//     if(!mongoose.Types.ObjectId.isValid(id)){
//       return res.status(400).json({
//         success:false,
//         message:"Invalid industry ID"
//       });
//     }

//     const industry = await industryModel.findByIdAndUpdate(
//       id,
//       req.body,
//       {new:true,runValidators:true}
//     );

//     if(!industry){
//       return res.status(404).json({
//         success:false,
//         message:"Industry not found"
//       });
//     }

//     res.status(200).json({
//       success:true,
//       message:"Industry updated successfully",
//       industry
//     });

//   }catch(err){
//     console.log(err);
//     res.status(500).json({
//       success:false,
//       message:"Update failed"
//     });
//   }
// };

// const deleteIndustry = async (req,res)=>{
//   try{

//     const {id} = req.params;

//     if(!mongoose.Types.ObjectId.isValid(id)){
//       return res.status(400).json({
//         success:false,
//         message:"Invalid industry ID"
//       });
//     }

//     const industry = await industryModel.findByIdAndDelete(id);

//     if(!industry){
//       return res.status(404).json({
//         success:false,
//         message:"Industry not found"
//       });
//     }

//     res.status(200).json({
//       success:true,
//       message:"Industry deleted successfully"
//     });

//   }catch(err){
//     console.log(err);
//     res.status(500).json({
//       success:false,
//       message:"Delete failed"
//     });
//   }
// };

// module.exports={
//     createIndustry,
//     getAllIndustries,
//     deleteIndustry,
//     getIndustryById,
//     updateIndustry
// }




const {
  industryModel,
  dealerModel,
  userModel,
  orderModel,
  orderItemModel,
  quotationModel,
  quotationItem
} = require("../models/exporter");
const mongoose = require("mongoose");

/* ================= GET ALL ================= */
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
      message: error.message,
    });
  }
}

/* ================= CREATE ================= */
async function createIndustry(req, res) {
  try {
    // 🔥 DEBUG LOGS
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("USER:", req.user);

    const {
      businessName,
      registrationNo,
      bussinesEmail,
      taxId
    } = req.body;

    /* ===== REQUIRED VALIDATION ===== */
    if (!businessName || !registrationNo || !taxId) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    /* ===== EXIST CHECK ===== */
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
    }

    /* ===== HANDLE IMAGES (FIXED) ===== */
    let business_logo = null;
    let addressLogo = null;

    if (req.files) {
      if (req.files.business_logo) {
        business_logo = req.files.business_logo[0].filename;
      }

      if (req.files.addressLogo) {
        addressLogo = req.files.addressLogo[0].filename;
      }
    }

    /* ===== IMAGE VALIDATION ===== */
    if (!business_logo || !addressLogo) {
      return res.status(400).json({
        success: false,
        message: "Both Business Logo and Address Logo are required",
      });
    }

    /* ===== CREATE ===== */
    const industry = new industryModel({
      ...req.body,
      business_logo,
      addressLogo,
      createdBy: req.user?.id || null, 
    });

    await industry.save();

    res.status(201).json({
      success: true,
      message: "Business created successfully",
      industry,
    });

  } catch (error) {
    console.log("❌ ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message, 
    });
  }
}

/* ================= GET BY ID ================= */
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
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ================= UPDATE ================= */
const updateIndustry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid industry ID",
      });
    }

    let updateData = { ...req.body };

    // 🔥 HANDLE IMAGES
    if (req.files) {
      if (req.files.business_logo) {
        updateData.business_logo = req.files.business_logo[0].filename;
      }

      if (req.files.addressLogo) {
        updateData.addressLogo = req.files.addressLogo[0].filename;
      }
    }

    const industry = await industryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Industry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Industry updated successfully",
      industry,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ================= DELETE ================= */

const deleteIndustry = async (req, res) => {
  try {
    const { id } = req.params;

    /* ================= VALIDATION ================= */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid industry ID",
      });
    }

    const industry = await industryModel.findById(id);

    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Industry not found",
      });
    }

    /* ================= CASCADE DELETE ================= */

    // 1. Dealers
    await dealerModel.deleteMany({ businessId: id });

    // 2. Users (Admin, Salesman, Accountant)
    await userModel.deleteMany({ industry: id });

    // 3. Orders + Order Items
    const orders = await orderModel.find({ businessId: id }).select("_id");

    const orderIds = orders.map(o => o._id);

    await orderItemModel.deleteMany({ order_id: { $in: orderIds } });
    await orderModel.deleteMany({ businessId: id });

    // 4. Quotations + Items
    const quotations = await quotationModel.find({ businessId: id }).select("_id");

    const quotationIds = quotations.map(q => q._id);

    await quotationItem.deleteMany({ quotation_id: { $in: quotationIds } });
    await quotationModel.deleteMany({ businessId: id });

    // 5. Finally Industry
    await industryModel.findByIdAndDelete(id);

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      message: "Industry and all related data deleted successfully",
    });

  } catch (error) {
    console.log("❌ DELETE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createIndustry,
  getAllIndustries,
  deleteIndustry,
  getIndustryById,
  updateIndustry,
};