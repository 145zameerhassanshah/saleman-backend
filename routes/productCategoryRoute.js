const {Router}=require("express");
const {createCategory,showAll,updateCategory,removeCategory}=require("../controllers/productCategoryController");
const router=Router();


router.get("/",showAll);
router.post("/",createCategory);
router.patch("/:id",updateCategory);
router.delete("/:id",removeCategory);

module.exports=router