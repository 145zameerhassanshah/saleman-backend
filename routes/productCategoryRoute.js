const {Router}=require("express");
const {createCategory,showAll,updateCategory,removeCategory}=require("../controllers/productCategoryController");
const {authMiddleware,roleMiddleware}=require("../middleware/exporter");
const USER_ROLES=require("../models/userEnum")
const router=Router();


router.get("/all",authMiddleware,showAll);
router.post("/add",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN));