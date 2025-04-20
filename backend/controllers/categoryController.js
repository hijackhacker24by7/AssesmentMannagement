const Category = require('../models/Category');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const categoryExists = await Category.findOne({ name });
    
    if (categoryExists) {
      res.status(400);
      throw new Error('Category already exists');
    }

    const category = await Category.create({
      name,
      description: description || ''
    });

    if (category) {
      res.status(201).json(category);
    } else {
      res.status(400);
      throw new Error('Invalid category data');
    }
  } catch (error) {
    res.status(res.statusCode || 500);
    res.json({
      message: error.message || 'Something went wrong while creating category',
    });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500);
    res.json({
      message: error.message || 'Error fetching categories',
    });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      res.json(category);
    } else {
      res.status(404);
      throw new Error('Category not found');
    }
  } catch (error) {
    res.status(res.statusCode || 500);
    res.json({
      message: error.message || 'Error fetching category',
    });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Check if new name already exists (and it's not the current category)
    if (name && name !== category.name) {
      const categoryExists = await Category.findOne({ name });
      if (categoryExists) {
        res.status(400);
        throw new Error('A category with that name already exists');
      }
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(res.statusCode || 500);
    res.json({
      message: error.message || 'Error updating category',
    });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(res.statusCode || 500);
    res.json({
      message: error.message || 'Error deleting category',
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};