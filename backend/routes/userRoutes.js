const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  registerAdmin,
  loginUser, 
  getUserProfile, 
  getUsers, 
  updateUserRole 
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/register-admin', registerAdmin);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);

// Admin routes
router.get('/', protect, admin, getUsers);
router.put('/:id/role', protect, admin, updateUserRole);

module.exports = router;