const mongoose = require('mongoose');

/**
 * Message Schema for Chat Bloom 93
 * - Handles all types of messages (text, image, file)
 * - Supports reactions, replies, and message status tracking
 */
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    },
    trim: true,
    maxlength: [4000, 'Message content cannot exceed 4000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
    default: 'text'
  },
  // File information for non-text messages
  file: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  // Message reactions
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply functionality
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Message editing tracking
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message status tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message deletion
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Forward functionality
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isForwarded: {
    type: Boolean,
    default: false
  },
  // Message priority (for important messages)
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Message expiration (for disappearing messages)
  expiresAt: {
    type: Date,
    default: null
  },
  // System messages (for automated notifications)
  systemMessage: {
    type: {
      type: String,
      enum: ['user_joined', 'user_left', 'user_added', 'user_removed', 'chat_created', 'chat_renamed', 'chat_picture_changed']
    },
    metadata: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ 'reactions.userId': 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for reaction count by emoji
messageSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });
  return counts;
});

// Virtual to check if user has reacted
messageSchema.virtual('hasUserReacted').get(function() {
  return function(userId, emoji) {
    return this.reactions.some(reaction => 
      reaction.userId.toString() === userId.toString() && 
      reaction.emoji === emoji
    );
  };
});

// Virtual for formatted content (for system messages)
messageSchema.virtual('formattedContent').get(function() {
  if (this.messageType === 'system' && this.systemMessage) {
    switch (this.systemMessage.type) {
      case 'user_joined':
        return `${this.systemMessage.metadata.userName} joined the chat`;
      case 'user_left':
        return `${this.systemMessage.metadata.userName} left the chat`;
      case 'user_added':
        return `${this.systemMessage.metadata.addedBy} added ${this.systemMessage.metadata.userName}`;
      case 'user_removed':
        return `${this.systemMessage.metadata.removedBy} removed ${this.systemMessage.metadata.userName}`;
      case 'chat_created':
        return 'Chat was created';
      case 'chat_renamed':
        return `Chat was renamed to "${this.systemMessage.metadata.newName}"`;
      case 'chat_picture_changed':
        return 'Chat picture was changed';
      default:
        return 'System message';
    }
  }
  return this.content;
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Auto-mark as edited if content changed and not new
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editHistory.push({
      content: this.content,
      editedAt: new Date()
    });
  }
  
  // Set expiration for disappearing messages
  if (this.isModified('expiresAt') && this.expiresAt) {
    // Schedule message deletion
    setTimeout(async () => {
      await this.constructor.findByIdAndDelete(this._id);
    }, this.expiresAt.getTime() - Date.now());
  }
  
  next();
});

// Static method to find messages for a chat
messageSchema.statics.findChatMessages = function(chatId, options = {}) {
  const { page = 1, limit = 50, before = null, after = null } = options;
  const skip = (page - 1) * limit;
  
  let query = { 
    chatId, 
    isDeleted: false 
  };
  
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  
  if (after) {
    query.createdAt = { $gt: new Date(after) };
  }
  
  return this.find(query)
    .populate('senderId', 'name email profilePicture')
    .populate('replyTo', 'content senderId messageType')
    .populate('replyTo.senderId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find unread messages for user
messageSchema.statics.findUnreadMessages = function(userId, chatId) {
  return this.find({
    chatId,
    senderId: { $ne: userId },
    'readBy.user': { $ne: userId },
    isDeleted: false
  }).populate('senderId', 'name profilePicture');
};

// Static method to search messages
messageSchema.statics.searchMessages = function(chatId, query, userId) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    chatId,
    content: searchRegex,
    isDeleted: false,
    messageType: 'text'
  })
  .populate('senderId', 'name profilePicture')
  .sort({ createdAt: -1 })
  .limit(50);
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from same user if exists
  this.reactions = this.reactions.filter(reaction => 
    reaction.userId.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({ emoji, userId });
  return this.save();
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(reaction => 
    !(reaction.userId.toString() === userId.toString() && reaction.emoji === emoji)
  );
  return this.save();
};

// Instance method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(read => 
    read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId });
    
    // Update status to 'read' if all participants have read it
    // Note: This would require knowing the chat participants
    this.status = 'read';
  }
  
  return this.save();
};

// Instance method to edit message
messageSchema.methods.editMessage = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editHistory.push({
    content: newContent,
    editedAt: new Date()
  });
  return this.save();
};

// Instance method to soft delete message
messageSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
