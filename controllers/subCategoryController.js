const { subCategory } = require("../models/exporter");

async function createSubCategory(req, res) {
  try {

    const newCategory = new subCategory(req.body);
    await newCategory.save();

    return res.status(201).json({
      message: "Sub Category added!",
      category: newCategory
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}

async function showAllSubCategories(req, res) {
  try {

    const allCategories = await subCategory.find();

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

async function updateSubCategory(req, res) {
  try {

    const id = req.params.id;

    const updatedCategory = await subCategory.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        message: "Sub Category not found"
      });
    }

    return res.status(200).json({
      message: "Sub Category updated!",
      category: updatedCategory
    });

  } catch (error) {

    return res.status(500).json({
      message: "Something went wrong."
    });

  }
}

async function removeSubCategory(req, res) {
  try {

    const id = req.params.id;

    const deletedCategory = await subCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        message: "Sub Category not found"
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
  createSubCategory,
  showAllSubCategories,
  updateSubCategory,
  removeSubCategory
};