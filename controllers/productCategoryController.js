const { productCategory } = require("../models/exporter");

async function createCategory(req, res) {
  try {
    const newCategory = new productCategory({...req.body,
      business: req.params.id,});
    await newCategory.save();
    return res.status(201).json({
      message: "Category added!",
      category: newCategory
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}

async function getMyAddedCategory(req,res){
  const category=await productCategory.find({businessId:req.params.id});

  return res.status(201).json({category});
}

async function showAll(req, res) {
  try {

    const allCategories = await productCategory.find();

    return res.status(200).json({
      success: true,
      categories: allCategories
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}

async function updateCategory(req, res) {
  try {

    const id = req.params.id;

    const updatedCategory = await productCategory.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    return res.status(200).json({
      message: "Category updated!",
      category: updatedCategory
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}

async function removeCategory(req, res) {
  try {

    const id = req.params.id;

    const deletedCategory = await productCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    return res.status(200).json({
      message: "Category deleted"
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}

module.exports = {
  createCategory,
  showAll,
  updateCategory,
  getMyAddedCategory,
  removeCategory
};