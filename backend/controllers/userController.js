const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper function to generate reset token
const generateResetToken = () => {
  // Generate a random token
  return crypto.randomBytes(20).toString('hex');
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { userId, email, password } = req.body;

    // Check if required fields are provided
    if (!userId || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ userId }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'User ID or email already exists' });
    }

    // Create new user with 'user' role
    const user = await User.create({
      userId,
      email,
      password,
      role: 'user',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Register a new admin user
// @route   POST /api/users/register-admin
// @access  Public
const registerAdmin = async (req, res) => {
  try {
    const { userId, email, password, adminSecret } = req.body;

    // Check if required fields are provided
    if (!userId || !email || !password || !adminSecret) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Verify admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ message: 'Invalid admin secret' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ userId }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'User ID or email already exists' });
    }

    // Create new user with 'admin' role
    const user = await User.create({
      userId,
      email,
      password,
      role: 'admin',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Login user and get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email (include password for authentication)
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Please provide a valid role' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      _id: user._id,
      userId: user.userId,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Forget password - request reset
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address' });
    }

    // Generate reset token and expiry
    const resetToken = generateResetToken();
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Update user with reset token and expiry
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // In a production environment, you would send an email here
    // For this example, we'll just return the token
    res.json({ 
      message: 'Password reset token generated successfully',
      resetToken: resetToken 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Find user with the reset token and check if token is still valid
    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    
    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  getUserProfile,
  getUsers,
  updateUserRole,
  forgotPassword,
  resetPassword,
};