const {createUser,login,getLoggedInUser,verifyUser,logout,getUser,forgotPassword,verifyOTP,updateUser,resetPassword,changePassword,getUsersByIndustry,getSalesmen}=require("../controllers/UserController");
const {Router}=require("express");
const {authMiddleware,roleMiddleware} = require("../middleware/exporter");
const { super_admin_seed, admin_seed } = require("../utils/superAdminSeed");
const USER_ROLES=require("../models/userEnum")
const {upload} = require("../bucket/config"); 

const router=Router();

router.get("/super-admin",async (_,res)=>{
    const isStored=await super_admin_seed();
    if(!isStored) return res.status(401).json({message:"Error seeding super admin"});

    return res.status(200).json({message:"Seed successfully"});
})
router.get("/admin",async (_,res)=>{
    const isStored=await admin_seed();
    if(!isStored) return res.status(401).json({message:"Error seeding  admin"});

    return res.status(200).json({message:"Seed successfully"});
})
router.post("/create-user",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),upload.single("profile_image"),createUser);
router.post("/auth/login",login);
router.patch("/update/:id", authMiddleware,roleMiddleware(USER_ROLES.ADMIN), upload.single("profile_image"), updateUser);
router.get("/me",authMiddleware,getLoggedInUser);
router.get("/user-profile/:id",authMiddleware,getUser);
router.post("/verify-user",verifyUser)
router.get("/auth/logout",authMiddleware,logout);
router.post("/auth/forgot-password",forgotPassword);
router.post("/auth/change-password", authMiddleware, changePassword);
router.post("/auth/verify-otp",verifyOTP);
router.post("/auth/reset-password",resetPassword);
router.get(
  "/salesmen/:businessId",
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getSalesmen
);
router.get("/industry/:industry_id",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),getUsersByIndustry)

module.exports=router;