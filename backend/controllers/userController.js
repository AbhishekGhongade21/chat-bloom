const User = require('../models/User');
const validator = require('validator');

/**
 * User Controllers
 * - Handles user profile management
 * - User search and discovery
 */

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        lastSeen: user.lastSeen,
        bio: user.bio,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        showLastSeen: user.showLastSeen,
        showOnlineStatus: user.showOnlineStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/update
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, showLastSeen, showOnlineStatus } = req.body;
    const updateData = {};

    // Validate and update name
    if (name !== undefined) {
      if (!name || name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 50 characters'
        });
      }
      updateData.name = name.trim();
    }

    // Validate and update bio
    if (bio !== undefined) {
      if (bio && bio.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 200 characters'
        });
      }
      updateData.bio = bio ? bio.trim() : '';
    }

    // Validate and update phone
    if (phone !== undefined) {
      if (phone && !validator.isMobilePhone(phone, 'any')) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number'
        });
      }
      updateData.phone = phone ? phone.trim() : undefined;
    }

    // Update privacy settings
    if (showLastSeen !== undefined) {
      updateData.showLastSeen = Boolean(showLastSeen);
    }

    if (showOnlineStatus !== undefined) {
      updateData.showOnlineStatus = Boolean(showOnlineStatus);
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        lastSeen: user.lastSeen,
        bio: user.bio,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        showLastSeen: user.showLastSeen,
        showOnlineStatus: user.showOnlineStatus,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

/**
 * @desc    Update user status
 * @route   PUT /api/users/status
 * @access  Private
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['online', 'offline', 'away', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: online, offline, away, busy'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      status: user.status,
      lastSeen: user.lastSeen
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating status'
    });
  }
};

/**
 * @desc    Get all users (for search/discovery)
 * @route   GET /api/users/all
 * @access  Private
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('getAllUsers called with search:', search);
    console.log('Current user ID:', req.user._id);

    let query = { _id: { $ne: req.user._id } }; // Exclude current user

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
      console.log('Search query:', query);
    }

    console.log('Final query:', JSON.stringify(query));

    const users = await User.find(query)
      .select('name email profilePicture status lastSeen showLastSeen showOnlineStatus')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found users:', users.length);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id)
      .select('name email profilePicture status lastSeen bio phone location showLastSeen showOnlineStatus createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Apply privacy settings
    let userResponse = user.toObject();
    
    if (!user.showLastSeen) {
      delete userResponse.lastSeen;
    }
    
    if (!user.showOnlineStatus) {
      userResponse.status = 'offline'; // Always show offline if privacy setting is off
    }

    res.status(200).json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};

/**
 * @desc    Get online users
 * @route   GET /api/users/online
 * @access  Private
 */
const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      status: 'online',
      _id: { $ne: req.user._id },
      showOnlineStatus: true
    })
    .select('name profilePicture status lastSeen');

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching online users'
    });
  }
};

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.searchUsers(query.trim(), req.user._id)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      users,
      query: query.trim()
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/users/upload-profile-picture
 * @access  Private
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }

    // In a real application, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll simulate by using the file path
    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('name email profilePicture status lastSeen');

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      user
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading profile picture'
    });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/delete-account
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // In a real application, you would want to:
    // 1. Delete all user's messages or mark them as deleted
    // 2. Remove user from all chats
    // 3. Delete uploaded files
    // 4. Handle any other cleanup

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting account'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateStatus,
  getAllUsers,
  getUserById,
  getOnlineUsers,
  searchUsers,
  uploadProfilePicture,
  deleteAccount
};
