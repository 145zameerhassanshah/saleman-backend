const {createUser,login,getLoggedInUser,logout,getUser,forgotPassword,verifyOTP,resetPassword}=require("../controllers/UserController");
const {Router}=require("express");
const {authMiddleware,roleMiddleware} = require("../middleware/exporter");
const {super_admin_seed}=require("../utils/superAdminSeed");

const router=Router();

router.get("/super-admin",async (_,res)=>{
    const isStored=await super_admin_seed();
    if(!isStored) return res.status(401).json({message:"Error seeding super admin"});

    return res.status(200).json({message:"Seed successfully"});
})
router.post("/create-user",authMiddleware,roleMiddleware,createUser);
router.post("/auth/login",login);
router.get("/me",authMiddleware,getLoggedInUser);
router.get("/user-profile/:id",authMiddleware,getUser);
router.get("/auth/logout",authMiddleware,logout);
router.post("/auth/forgot-password",forgotPassword);
router.post("/auth/verify-otp",verifyOTP);
router.post("/auth/reset-password",resetPassword);

module.exports=router;