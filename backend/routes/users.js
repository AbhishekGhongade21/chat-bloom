const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getProfile,
  updateProfile,
  updateStatus,
  getAllUsers,
  getUserById,
  getOnlineUsers,
  searchUsers,
  uploadProfilePicture,
  deleteAccount
} = require('../controllers/userController');

const { protect, basicRateLimit } = require('../middleware/auth');

/**
 * File upload configuration for profile pictures
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * User Routes
 * - Profile management
 * - User discovery and search
 * - Status updates
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/users/update
 * @desc    Update user profile
 * @access  Private
 */
router.put('/update', protect, updateProfile);

/**
 * @route   PUT /api/users/status
 * @desc    Update user status
 * @access  Private
 */
router.put('/status', protect, updateStatus);

/**
 * @route   GET /api/users/all
 * @desc    Get all users (with pagination and search)
 * @access  Private
 */
router.get('/all', protect, basicRateLimit(50, 60000), getAllUsers);

/**
 * @route   GET /api/users/online
 * @desc    Get online users
 * @access  Private
 */
router.get('/online', protect, getOnlineUsers);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search', protect, basicRateLimit(30, 60000), searchUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', protect, getUserById);

/**
 * @route   POST /api/users/upload-profile-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/upload-profile-picture', 
  protect, 
  upload.single('profilePicture'), 
  uploadProfilePicture
);

/**
 * @route   DELETE /api/users/delete-account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
