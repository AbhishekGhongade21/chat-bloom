const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * User Schema for Chat Bloom 93
 * - Handles user authentication and profile information
 * - Includes password hashing and validation
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  profilePicture: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // Additional fields for enhanced functionality
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: ''
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isMobilePhone(v, 'any');
      },
      message: 'Please provide a valid phone number'
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Privacy settings
  showLastSeen: {
    type: Boolean,
    default: true
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastSeen: -1 });

// Virtual for user's full profile info
userSchema.virtual('profileInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture,
    status: this.status,
    lastSeen: this.lastSeen,
    bio: this.bio,
    showLastSeen: this.showLastSeen,
    showOnlineStatus: this.showOnlineStatus
  };
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update lastSeen when status changes to online
userSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'online') {
    this.lastSeen = new Date();
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update user status
userSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'online') {
    this.lastSeen = new Date();
  }
  return this.save();
};

// Static method to find online users
userSchema.statics.findOnlineUsers = function() {
  return this.find({ status: 'online' }).select('name email profilePicture status lastSeen');
};

// Static method to search users by name or email
userSchema.statics.searchUsers = function(query, currentUserId) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $and: [
      { _id: { $ne: currentUserId } }, // Exclude current user
      {
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }
    ]
  }).select('name email profilePicture status lastSeen');
};

module.exports = mongoose.model('User', userSchema);
