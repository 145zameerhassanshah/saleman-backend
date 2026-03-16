const {Router}=require("express");
const {createCategory,showAll,updateCategory,removeCategory,getMyAddedCategory}=require("../controllers/productCategoryController");
const router=Router();


router.get("/",showAll);
router.post("/",createCategory);
router.patch("/:id",updateCategory);
router.delete("/:id",removeCategory);
router.get("/my-added",getMyAddedCategory);

module.exports=router