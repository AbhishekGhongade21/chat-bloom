const mongoose = require('mongoose');

/**
 * Chat Schema for Chat Bloom 93
 * - Handles both 1-to-1 and group conversations
 * - Manages participants and chat metadata
 */
const chatSchema = new mongoose.Schema({
  chatName: {
    type: String,
    trim: true,
    maxlength: [50, 'Chat name cannot exceed 50 characters']
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    // For group chats - track last read message
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  }],
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Group chat specific fields
  groupDescription: {
    type: String,
    maxlength: [500, 'Group description cannot exceed 500 characters']
  },
  groupPicture: {
    type: String,
    default: null
  },
  // Privacy and settings
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For channels/broadcast functionality
  isChannel: {
    type: Boolean,
    default: false
  },
  channelType: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  subscribers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message settings
  messageSettings: {
    allowReactions: {
      type: Boolean,
      default: true
    },
    allowReplies: {
      type: Boolean,
      default: true
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    messageRetentionDays: {
      type: Number,
      default: 0, // 0 means keep forever
      min: 0,
      max: 365
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ isGroupChat: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ lastMessage: -1 });
chatSchema.index({ isChannel: 1 });

// Virtual for participant count
chatSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for unread count (would need to be populated with user context)
chatSchema.virtual('unreadCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chat',
  count: true,
  match: function() {
    // This would need to be filtered by user's last read message
    return { createdAt: { $gt: this.lastReadMessage } };
  }
});

// Virtual to check if user is participant
chatSchema.virtual('isParticipant').get(function() {
  return function(userId) {
    return this.participants.some(participant => 
      participant.user.toString() === userId.toString()
    );
  };
});

// Pre-save middleware to validate group chat requirements
chatSchema.pre('save', function(next) {
  if (this.isGroupChat && !this.chatName) {
    return next(new Error('Group chat must have a name'));
  }
  
  if (this.isGroupChat && !this.groupAdmin) {
    return next(new Error('Group chat must have an admin'));
  }
  
  // For 1-to-1 chats, ensure only 2 participants
  if (!this.isGroupChat && this.participants.length > 2) {
    return next(new Error('1-to-1 chat can only have 2 participants'));
  }
  
  next();
});

// Static method to find chats for a user
chatSchema.statics.findUserChats = function(userId, options = {}) {
  const { page = 1, limit = 20, search = '' } = options;
  const skip = (page - 1) * limit;
  
  let query = {
    'participants.user': userId,
    isArchived: { $nin: [userId] }
  };
  
  if (search) {
    query.chatName = new RegExp(search, 'i');
  }
  
  return this.find(query)
    .populate('participants.user', 'name email profilePicture status')
    .populate('lastMessage')
    .populate('groupAdmin', 'name email profilePicture')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to create 1-to-1 chat
chatSchema.statics.createOneOnOneChat = async function(userId1, userId2) {
  // Prevent self-chat
  if (userId1 === userId2) {
    throw new Error('Cannot create a chat with yourself');
  }
  
  // Check if chat already exists
  const existingChat = await this.findOne({
    isGroupChat: false,
    'participants.user': { $all: [userId1, userId2] }
  }).populate('participants.user', 'name email profilePicture status');
  
  if (existingChat) {
    return existingChat;
  }
  
  // Create new 1-to-1 chat
  const chat = await this.create({
    participants: [
      { user: userId1 },
      { user: userId2 }
    ]
  });
  
  return await chat.populate('participants.user', 'name email profilePicture status');
};

// Static method to create group chat
chatSchema.statics.createGroupChat = async function(chatName, creatorId, participantIds, options = {}) {
  const participants = [
    { user: creatorId, role: 'admin' },
    ...participantIds.map(id => ({ user: id, role: 'member' }))
  ];
  
  const chat = await this.create({
    chatName,
    isGroupChat: true,
    groupAdmin: creatorId,
    participants,
    ...options
  });
  
  return await chat.populate('participants.user', 'name email profilePicture status');
};

// Instance method to add participant
chatSchema.methods.addParticipant = function(userId, role = 'member') {
  // Check if user is already a participant
  const isParticipant = this.participants.some(p => 
    p.user.toString() === userId.toString()
  );
  
  if (isParticipant) {
    throw new Error('User is already a participant');
  }
  
  this.participants.push({ user: userId, role });
  return this.save();
};

// Instance method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => 
    p.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance method to update last read message for user
chatSchema.methods.updateLastReadMessage = function(userId, messageId) {
  const participant = this.participants.find(p =>
    p.user.toString() === userId.toString()
  );

  if (participant) {
    participant.lastReadMessage = messageId;
  }

  return this.save();
};

// Static method to find all chats for a user
chatSchema.statics.findUserChats = async function(userId, options = {}) {
  const { page = 1, limit = 20, search } = options;

  // Build query
  const query = {
    'participants.user': userId
  };

  // Add search filter if provided
  if (search && search.trim()) {
    query.$or = [
      { chatName: { $regex: search, $options: 'i' } },
      { isGroupChat: false }
    ];
  }

  // Execute query with pagination
  const chats = await this.find(query)
    .populate('participants.user', 'name email profilePicture status lastSeen')
    .populate('groupAdmin', 'name email profilePicture')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return chats;
};

module.exports = mongoose.model('Chat', chatSchema);
