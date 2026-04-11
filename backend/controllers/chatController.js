const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const validator = require('validator');

/**
 * Chat Controllers
 * - Handles chat creation and management
 * - Supports 1-to-1 and group chats
 */

/**
 * @desc    Create a new chat (1-to-1 or group)
 * @route   POST /api/chats/create
 * @access  Private
 */
const createChat = async (req, res) => {
  try {
    const { 
      isGroupChat, 
      participantIds, 
      chatName, 
      groupDescription,
      groupPicture 
    } = req.body;

    // Validate participants
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one participant is required'
      });
    }

    // Validate participant IDs
    for (const id of participantIds) {
      if (!validator.isMongoId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid participant ID format'
        });
      }
    }

    // Check if participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants not found'
      });
    }

    let chat;

    if (isGroupChat) {
      // Group chat validation
      if (!chatName || chatName.trim().length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Group chat name is required'
        });
      }

      if (chatName.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Group chat name cannot exceed 50 characters'
        });
      }

      if (participantIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Group chat must have at least 2 participants (excluding creator)'
        });
      }

      // Create group chat
      chat = await Chat.createGroupChat(
        chatName.trim(),
        req.user._id,
        participantIds,
        {
          groupDescription: groupDescription ? groupDescription.trim() : undefined,
          groupPicture
        }
      );

      // Create system message for group creation
      await Message.create({
        senderId: req.user._id,
        chatId: chat._id,
        messageType: 'system',
        systemMessage: {
          type: 'chat_created',
          metadata: {
            creatorName: req.user.name,
            chatName: chatName.trim()
          }
        }
      });

    } else {
      // 1-to-1 chat validation
      if (participantIds.length !== 1) {
        return res.status(400).json({
          success: false,
          message: '1-to-1 chat can only have one participant'
        });
      }

      const participantId = participantIds[0];

      // Prevent self-chat
      if (participantId === req.user._id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create a chat with yourself'
        });
      }

      // Check if chat already exists
      chat = await Chat.createOneOnOneChat(req.user._id, participantId);

      if (!chat.isNew) {
        return res.status(200).json({
          success: true,
          message: 'Chat already exists',
          chat
        });
      }
    }

    // Populate chat details
    await chat.populate([
      { path: 'participants.user', select: 'name email profilePicture status' },
      { path: 'groupAdmin', select: 'name email profilePicture' }
    ]);

    res.status(201).json({
      success: true,
      message: isGroupChat ? 'Group chat created successfully' : 'Chat created successfully',
      chat
    });

  } catch (error) {
    console.error('Create chat error:', error);
    
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
      message: 'Server error creating chat'
    });
  }
};

/**
 * @desc    Get all chats for the current user
 * @route   GET /api/chats
 * @access  Private
 */
const getChats = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search
    };

    const chats = await Chat.findUserChats(req.user._id, options);

    // Get unread counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
          isDeleted: false
        });

        const chatObj = chat.toObject();
        chatObj.unreadCount = unreadCount;
        return chatObj;
      })
    );

    res.status(200).json({
      success: true,
      chats: chatsWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chats'
    });
  }
};

/**
 * @desc    Get chat by ID
 * @route   GET /api/chats/:id
 * @access  Private
 */
const getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

    const chat = await Chat.findById(id)
      .populate('participants.user', 'name email profilePicture status lastSeen')
      .populate('groupAdmin', 'name email profilePicture')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(participant => 
      participant.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat'
      });
    }

    res.status(200).json({
      success: true,
      chat
    });

  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chat'
    });
  }
};

/**
 * @desc    Add participant to group chat
 * @route   POST /api/chats/:id/add-participant
 * @access  Private
 */
const addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantId } = req.body;

    // Validate inputs
    if (!validator.isMongoId(id) || !validator.isMongoId(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID or participant ID'
      });
    }

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if it's a group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add participants to 1-to-1 chat'
      });
    }

    // Check if user is group admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can add participants'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Add participant
    await chat.addParticipant(participantId);

    // Create system message
    await Message.create({
      senderId: req.user._id,
      chatId: chat._id,
      messageType: 'system',
      systemMessage: {
        type: 'user_added',
        metadata: {
          userName: participant.name,
          addedBy: req.user.name
        }
      }
    });

    // Return updated chat
    const updatedChat = await Chat.findById(id)
      .populate('participants.user', 'name email profilePicture status')
      .populate('groupAdmin', 'name email profilePicture');

    res.status(200).json({
      success: true,
      message: 'Participant added successfully',
      chat: updatedChat
    });

  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding participant'
    });
  }
};

/**
 * @desc    Remove participant from group chat
 * @route   DELETE /api/chats/:id/remove-participant/:participantId
 * @access  Private
 */
const removeParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;

    // Validate inputs
    if (!validator.isMongoId(id) || !validator.isMongoId(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID or participant ID'
      });
    }

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if it's a group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove participants from 1-to-1 chat'
      });
    }

    // Check if user is group admin or removing themselves
    const isAdmin = chat.groupAdmin.toString() === req.user._id.toString();
    const isSelf = participantId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can remove participants'
      });
    }

    // Get participant details for system message
    const participant = await User.findById(participantId);

    // Remove participant
    await chat.removeParticipant(participantId);

    // Create system message
    await Message.create({
      senderId: req.user._id,
      chatId: chat._id,
      messageType: 'system',
      systemMessage: {
        type: 'user_removed',
        metadata: {
          userName: participant ? participant.name : 'Unknown User',
          removedBy: req.user.name
        }
      }
    });

    // Return updated chat
    const updatedChat = await Chat.findById(id)
      .populate('participants.user', 'name email profilePicture status')
      .populate('groupAdmin', 'name email profilePicture');

    res.status(200).json({
      success: true,
      message: 'Participant removed successfully',
      chat: updatedChat
    });

  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing participant'
    });
  }
};

/**
 * @desc    Update group chat details
 * @route   PUT /api/chats/:id
 * @access  Private
 */
const updateChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { chatName, groupDescription, groupPicture } = req.body;

    // Validate ID
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if it's a group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update 1-to-1 chat details'
      });
    }

    // Check if user is group admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can update chat details'
      });
    }

    const updateData = {};

    // Validate and update chat name
    if (chatName !== undefined) {
      if (!chatName || chatName.trim().length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Group chat name is required'
        });
      }
      if (chatName.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Group chat name cannot exceed 50 characters'
        });
      }
      updateData.chatName = chatName.trim();
    }

    // Update group description
    if (groupDescription !== undefined) {
      updateData.groupDescription = groupDescription ? groupDescription.trim() : '';
    }

    // Update group picture
    if (groupPicture !== undefined) {
      updateData.groupPicture = groupPicture;
    }

    // Update chat
    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('participants.user', 'name email profilePicture status')
     .populate('groupAdmin', 'name email profilePicture');

    // Create system messages for changes
    if (chatName !== undefined && chat.chatName !== chatName.trim()) {
      await Message.create({
        senderId: req.user._id,
        chatId: chat._id,
        messageType: 'system',
        systemMessage: {
          type: 'chat_renamed',
          metadata: {
            newName: chatName.trim(),
            oldName: chat.chatName
          }
        }
      });
    }

    if (groupPicture !== undefined) {
      await Message.create({
        senderId: req.user._id,
        chatId: chat._id,
        messageType: 'system',
        systemMessage: {
          type: 'chat_picture_changed',
          metadata: {}
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat updated successfully',
      chat: updatedChat
    });

  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating chat'
    });
  }
};

/**
 * @desc    Leave group chat
 * @route   POST /api/chats/:id/leave
 * @access  Private
 */
const leaveChat = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if it's a group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave 1-to-1 chat'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(participant => 
      participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    // Group admin cannot leave without assigning new admin
    if (chat.groupAdmin.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Group admin cannot leave chat. Please transfer admin rights first.'
      });
    }

    // Remove participant
    await chat.removeParticipant(req.user._id);

    // Create system message
    await Message.create({
      senderId: req.user._id,
      chatId: chat._id,
      messageType: 'system',
      systemMessage: {
        type: 'user_left',
        metadata: {
          userName: req.user.name
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Left chat successfully'
    });

  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error leaving chat'
    });
  }
};

module.exports = {
  createChat,
  getChats,
  getChatById,
  addParticipant,
  removeParticipant,
  updateChat,
  leaveChat
};
