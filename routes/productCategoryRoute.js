const {Router}=require("express");
const {createCategory,showAll,updateCategory,removeCategory}=require("../controllers/productCategoryController");
const {authMiddleware,roleMiddleware}=require("../middleware/exporter");
const USER_ROLES=require("../models/userEnum")
const router=Router();


router.get("/",showAll);
router.post("/",roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),createCategory);
router.patch("/:id",roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),updateCategory);
router.delete("/:id",roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),removeCategory);

module.exports=router