const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  changePassword
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

/**
 * Authentication Routes
 * - User registration and login
 * - Token management
 * - Password operations
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', protect, refreshToken);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', protect, changePassword);

module.exports = router;
