const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  handleGoogleAuth,
  forgotPassword,
  resetPassword,
  validateResetToken
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', handleGoogleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/reset-password/:token/validate', validateResetToken);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logoutUser);

module.exports = router; 