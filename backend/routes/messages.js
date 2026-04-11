const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// File upload configuration for chat files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chat-files/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept all file types for now, but you can restrict here
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const {
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
} = require('../controllers/messageController');

const { protect, requireChatParticipant, basicRateLimit } = require('../middleware/auth');

/**
 * Message Routes
 * - Message CRUD operations
 * - Reactions and replies
 * - Message search and forwarding
 */

/**
 * @desc    Send a message
 * @route   POST /api/messages/:chatId
 * @access  Private
 */
router.post('/:chatId', protect, sendMessage);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread messages count for all chats
 * @access  Private
 */
router.get('/unread-count', protect, getUnreadCount);

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
router.post('/:chatId/read', protect, markAsRead);

/**
 * @route   GET /api/messages/:chatId/search
 * @desc    Search messages in a chat
 * @access  Private
 */
router.get('/:chatId/search', protect, basicRateLimit(100, 60000), searchMessages);

/**
 * @route   POST /api/messages/:chatId/file
 * @desc    Upload file to chat
 * @access  Private
 */
router.post('/:chatId/file', protect, upload.single('file'), uploadFile);

module.exports = router;
