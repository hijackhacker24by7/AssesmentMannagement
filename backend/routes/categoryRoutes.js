const express = require('express');
const router = express.Router();
const { 
  createCategory, 
  getCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin-only routes
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

// Routes for both admin and regular users
router.get('/', protect, getCategories);
router.get('/:id', protect, getCategoryById);

module.exports = router;