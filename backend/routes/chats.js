const express = require('express');
const router = express.Router();

const {
  createChat,
  getChats,
  getChatById,
  addParticipant,
  removeParticipant,
  updateChat,
  leaveChat
} = require('../controllers/chatController');

const { protect, requireChatParticipant, requireGroupAdmin } = require('../middleware/auth');

/**
 * Chat Routes
 * - Chat creation and management
 * - Group chat operations
 * - Chat discovery
 */

/**
 * @route   POST /api/chats/create
 * @desc    Create a new chat (1-to-1 or group)
 * @access  Private
 */
router.post('/create', protect, createChat);

/**
 * @route   GET /api/chats
 * @desc    Get all chats for the current user
 * @access  Private
 */
router.get('/', protect, getChats);

/**
 * @route   GET /api/chats/:id
 * @desc    Get chat by ID
 * @access  Private
 */
router.get('/:id', protect, getChatById);

/**
 * @route   POST /api/chats/:id/add-participant
 * @desc    Add participant to group chat
 * @access  Private
 */
router.post('/:id/add-participant', 
  protect, 
  requireChatParticipant, 
  requireGroupAdmin, 
  addParticipant
);

/**
 * @route   DELETE /api/chats/:id/remove-participant/:participantId
 * @desc    Remove participant from group chat
 * @access  Private
 */
router.delete('/:id/remove-participant/:participantId', 
  protect, 
  requireChatParticipant, 
  removeParticipant
);

/**
 * @route   PUT /api/chats/:id
 * @desc    Update group chat details
 * @access  Private
 */
router.put('/:id', 
  protect, 
  requireChatParticipant, 
  requireGroupAdmin, 
  updateChat
);

/**
 * @route   POST /api/chats/:id/leave
 * @desc    Leave group chat
 * @access  Private
 */
router.post('/:id/leave', 
  protect, 
  requireChatParticipant, 
  leaveChat
);

module.exports = router;
