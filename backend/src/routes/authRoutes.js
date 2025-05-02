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
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const client = new OAuth2Client('247475462857-sgf0cc00s3ss7g8iot31a2vp4sbr0fq8.apps.googleusercontent.com');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  console.log('Received credential:', credential ? credential.substring(0, 20) + '...' : 'none');
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '247475462857-sgf0cc00s3ss7g8iot31a2vp4sbr0fq8.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        username: payload.name,
        email: payload.email,
        googleId: payload.sub,
        password: crypto.randomBytes(32).toString('hex'),
        // You can set a default role or other fields here
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/reset-password/:token/validate', validateResetToken);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logoutUser);

module.exports = router; 