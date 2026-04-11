const Message = require('../models/Message');
const Chat = require('../models/Chat');
const validator = require('validator');

/**
 * Message Controllers
 * - Handles message CRUD operations
 * - Supports reactions, replies, and file sharing
 */

/**
 * @desc    Send a message
 * @route   POST /api/messages/send
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    // Get chatId from URL params first, then from body as fallback
    const chatId = req.params.chatId || req.body.chatId;
    const { text, content, messageType = 'text', replyTo, file } = req.body;
    
    // Support both 'text' and 'content' for compatibility
    const messageContent = text || content;

    // Validate required fields
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required'
      });
    }

    // Validate chat ID format
    if (!validator.isMongoId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID format'
      });
    }

    // For text messages, content is required
    if (messageType === 'text' && (!messageContent || messageContent.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required for text messages'
      });
    }

    // For non-text messages, file information is required
    if (messageType !== 'text' && !file) {
      return res.status(400).json({
        success: false,
        message: 'File information is required for non-text messages'
      });
    }

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const isParticipant = chat.participants.some(participant => {
      const participantId = participant.user ? participant.user.toString() : participant.toString();
      return participantId === req.user._id.toString();
    });

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    // Validate replyTo if provided
    if (replyTo && !validator.isMongoId(replyTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reply message ID format'
      });
    }

    // Create message
    const messageData = {
      senderId: req.user._id,
      chatId,
      messageType,
      replyTo
    };

    if (messageContent) {
      messageData.content = messageContent.trim();
    }

    if (file) {
      messageData.file = file;
    }

    const message = await Message.create(messageData);

    // Populate message details
    await message.populate([
      { path: 'senderId', select: 'name profilePicture' },
      { path: 'replyTo', populate: { path: 'senderId', select: 'name' } }
    ]);

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id
    });

    // Update user's last read message in this chat
    await Chat.updateOne(
      { _id: chatId, 'participants.user': req.user._id },
      { 'participants.$.lastReadMessage': message._id }
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending message'
    });
  }
};

/**
 * @desc    Get messages for a chat
 * @route   GET /api/messages/:chatId
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;

    // Validate chat ID
    if (!validator.isMongoId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID format'
      });
    }

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const isParticipant = chat.participants.some(participant => 
      participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    // Get messages
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      before,
      after
    };

    const messages = await Message.findChatMessages(chatId, options);

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      msg.senderId._id.toString() !== req.user._id.toString() &&
      !msg.readBy.some(read => read.user.toString() === req.user._id.toString())
    );

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(msg => msg.markAsRead(req.user._id))
      );
    }

    res.status(200).json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    });
  }
};

/**
 * @desc    Edit a message
 * @route   PUT /api/messages/edit/:id
 * @access  Private
 */
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, content } = req.body;
    
    // Support both 'text' and 'content' for compatibility
    const messageContent = text || content;

    // Validate message ID
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    // Validate content
    if (!messageContent || messageContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (messageContent.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot exceed 4000 characters'
      });
    }

    // Find message
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Check if message is deleted
    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit deleted message'
      });
    }

    // Check if message type is text
    if (message.messageType !== 'text') {
      return res.status(400).json({
        success: false,
        message: 'Only text messages can be edited'
      });
    }

    // Edit message
    await message.editMessage(messageContent.trim());

    // Populate and return updated message
    const updatedMessage = await Message.findById(id)
      .populate('senderId', 'name profilePicture')
      .populate('replyTo', 'content senderId messageType')
      .populate('replyTo.senderId', 'name');

    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: updatedMessage
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error editing message'
    });
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/delete/:id
 * @access  Private
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate message ID
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    // Find message
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Message is already deleted'
      });
    }

    // Soft delete message
    await message.softDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting message'
    });
  }
};

/**
 * @desc    Add or remove reaction to a message
 * @route   POST /api/messages/react
 * @access  Private
 */
const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const messageId = id;

    // Validate inputs
    if (!validator.isMongoId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if message is deleted
    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot react to deleted message'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chatId);
    const isParticipant = chat.participants.some(participant => 
      participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(reaction => 
      reaction.userId.toString() === req.user._id.toString() && 
      reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      await message.removeReaction(req.user._id, emoji);
      
      res.status(200).json({
        success: true,
        message: 'Reaction removed successfully',
        action: 'removed'
      });
    } else {
      // Add reaction
      await message.addReaction(req.user._id, emoji);
      
      res.status(200).json({
        success: true,
        message: 'Reaction added successfully',
        action: 'added'
      });
    }

    // Return updated message with reactions
    const updatedMessage = await Message.findById(messageId)
      .populate('reactions.userId', 'name profilePicture');

    res.status(200).json({
      success: true,
      data: updatedMessage.reactions
    });

  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding reaction'
    });
  }
};

/**
 * @desc    Forward a message
 * @route   POST /api/messages/forward
 * @access  Private
 */
const forwardMessage = async (req, res) => {
  try {
    const { messageId, targetChatIds } = req.body;

    // Validate inputs
    if (!validator.isMongoId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    if (!targetChatIds || !Array.isArray(targetChatIds) || targetChatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Target chat IDs are required'
      });
    }

    // Validate target chat IDs
    for (const chatId of targetChatIds) {
      if (!validator.isMongoId(chatId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target chat ID format'
        });
      }
    }

    // Find original message
    const originalMessage = await Message.findById(messageId);

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    // Check if user is participant of original chat
    const originalChat = await Chat.findById(originalMessage.chatId);
    const isOriginalParticipant = originalChat.participants.some(participant => 
      participant.user.toString() === req.user._id.toString()
    );

    if (!isOriginalParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of the original chat'
      });
    }

    // Check if message is deleted
    if (originalMessage.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot forward deleted message'
      });
    }

    // Forward message to target chats
    const forwardedMessages = [];

    for (const chatId of targetChatIds) {
      // Check if user is participant of target chat
      const targetChat = await Chat.findById(chatId);
      const isTargetParticipant = targetChat.participants.some(participant => 
        participant.user.toString() === req.user._id.toString()
      );

      if (!isTargetParticipant) {
        continue; // Skip chats where user is not participant
      }

      // Create forwarded message
      const forwardedMessage = await Message.create({
        senderId: req.user._id,
        chatId,
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        file: originalMessage.file,
        forwardedFrom: originalMessage._id,
        isForwarded: true
      });

      // Populate message details
      await forwardedMessage.populate('senderId', 'name profilePicture');

      forwardedMessages.push(forwardedMessage);

      // Update chat's last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: forwardedMessage._id
      });
    }

    res.status(200).json({
      success: true,
      message: `Message forwarded to ${forwardedMessages.length} chats`,
      data: forwardedMessages
    });

  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error forwarding message'
    });
  }
};

/**
 * @desc    Search messages in a chat
 * @route   GET /api/messages/search/:chatId
 * @access  Private
 */
const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q: query } = req.query;

    // Validate inputs
    if (!validator.isMongoId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID format'
      });
    }

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId);
    const isParticipant = chat.participants.some(participant => 
      participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    // Search messages
    const messages = await Message.searchMessages(chatId, query.trim(), req.user._id);

    res.status(200).json({
      success: true,
      messages,
      query: query.trim(),
      count: messages.length
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching messages'
    });
  }
};

/**
 * @desc    Get unread messages count for all chats
 * @route   GET /api/messages/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    // Get all chats for user
    const chats = await Chat.find({ 'participants.user': req.user._id });

    // Count unread messages for each chat
    const unreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const count = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
          isDeleted: false
        });

        return {
          chatId: chat._id,
          unreadCount: count
        };
      })
    );

    const totalUnread = unreadCounts.reduce((sum, item) => sum + item.unreadCount, 0);

    res.status(200).json({
      success: true,
      totalUnread,
      chatCounts: unreadCounts
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching unread count'
    });
  }
};

/**
 * @desc    Mark messages as read
 * @route   POST /api/messages/:chatId/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;

    // Validate chat ID
    if (!validator.isMongoId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID format'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const isParticipant = chat.participants.some(participant => 
      participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    // If no specific message IDs provided, mark all unread messages as read
    if (!messageIds || messageIds.length === 0) {
      await Message.updateMany(
        {
          chatId,
          senderId: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
          isDeleted: false
        },
        {
          $push: {
            readBy: {
              user: req.user._id,
              readAt: new Date()
            }
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: 'All messages marked as read'
      });
    }

    // Mark specific messages as read
    const updatePromises = messageIds.map(messageId => 
      Message.updateOne(
        {
          _id: messageId,
          chatId,
          'readBy.user': { $ne: req.user._id }
        },
        {
          $push: {
            readBy: {
              user: req.user._id,
              readAt: new Date()
            }
          }
        }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      markedCount: messageIds.length
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking messages as read'
    });
  }
};

/**
 * @desc    Upload file to chat
 * @route   POST /api/messages/:chatId/file
 * @access  Private
 */
const uploadFile = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Validate chat ID
    if (!validator.isMongoId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID format'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const isParticipant = chat.participants.some(participant => 
      participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create file object
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/chat-files/${req.file.filename}`
    };

    // Create message with file
    const message = await Message.create({
      senderId: req.user._id,
      chatId,
      messageType: req.file.mimetype.startsWith('image/') ? 'image' : 
                req.file.mimetype.startsWith('video/') ? 'video' :
                req.file.mimetype.startsWith('audio/') ? 'audio' : 'file',
      content: req.file.originalname,
      file: fileData
    });

    // Populate message details
    await message.populate('senderId', 'name profilePicture');

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: message
    });

  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading file'
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  forwardMessage,
  searchMessages,
  getUnreadCount,
  markAsRead,
  uploadFile
};
