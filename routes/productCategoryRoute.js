const {Router}=require("express");
const {createCategory,showAll,updateCategory,removeCategory,getIndustryCategory}=require("../controllers/productCategoryController");
const router=Router();


router.get("/",showAll);
router.post("/:id",createCategory);
router.patch("/:id",updateCategory);
router.delete("/:id",removeCategory);
router.get("/my-added/:id",getIndustryCategory);

module.exports=router