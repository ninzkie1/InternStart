const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role, inviteCode } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists',
        action: 'login',
        email 
      });
    }

    // Create user with the provided role or default to 'intern'
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'intern' // Use the role from request body if provided, otherwise default to 'intern'
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    res.status(201).json({
      ...userData,
      inviteCode, // Return invite code if it was provided during registration
      message: 'Registration successful'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        action: 'register',
        username 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      organization: user.organization
    };

    res.json({
      token,
      user: userData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('organization');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Google OAuth login/register
const handleGoogleAuth = async (req, res) => {
  try {
    const { email, name, googleId, inviteCode } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        username: name,
        email,
        googleId,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for Google users
        role: 'intern'
      });
    } else {
      // Update existing user's googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Return user data
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      organization: user.organization
    };

    res.json({
      ...userData,
      inviteCode,
      message: 'Google authentication successful'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  handleGoogleAuth
}; 