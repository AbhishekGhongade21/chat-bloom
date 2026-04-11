const express = require('express');
const router = express.Router();

const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  forwardMessage,
  searchMessages,
  getUnreadCount
} = require('../controllers/messageController');

const { protect, requireChatParticipant, basicRateLimit } = require('../middleware/auth');

/**
 * Message Routes
 * - Message CRUD operations
 * - Reactions and replies
 * - Message search and forwarding
 */

/**
 * @route   POST /api/messages/:chatId
 * @desc    Send a message
 * @access  Private
 */
router.post('/:chatId', protect, sendMessage);

/**
 * @route   GET /api/messages/:chatId
 * @desc    Get messages for a chat
 * @access  Private
 */
router.get('/:chatId', protect, getMessages);

/**
 * @route   PUT /api/messages/:id
 * @desc    Edit a message
 * @access  Private
 */
router.put('/:id', protect, editMessage);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:id', protect, deleteMessage);

/**
 * @route   POST /api/messages/:id/react
 * @desc    Add reaction to a message
 * @access  Private
 */
router.post('/:id/react', protect, reactToMessage);

/**
 * @route   DELETE /api/messages/:id/react/:emoji
 * @desc    Remove reaction from a message
 * @access  Private
 */
router.delete('/:id/react/:emoji', protect, reactToMessage);

/**
 * @route   POST /api/messages/:chatId/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.post('/:chatId/read', protect, (req, res) => {
  // This would need to be implemented in the controller
  res.status(501).json({ message: 'Not implemented yet' });
});

/**
 * @route   GET /api/messages/:chatId/search
 * @desc    Search messages in a chat
 * @access  Private
 */
router.get('/:chatId/search', protect, basicRateLimit(20, 60000), searchMessages);

/**
 * @route   POST /api/messages/:chatId/file
 * @desc    Upload file to chat
 * @access  Private
 */
router.post('/:chatId/file', protect, (req, res) => {
  // This would need to be implemented in the controller
  res.status(501).json({ message: 'Not implemented yet' });
});

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread messages count for all chats
 * @access  Private
 */
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
