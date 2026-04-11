/**
 * Socket.IO Event Handlers for Chat Bloom 93
 * - Real-time messaging
 * - Typing indicators
 * - Online/offline status
 * - Message reactions
 */

const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

/**
 * Initialize Socket.IO event handlers
 * @param {Object} io - Socket.IO instance
 */
const initializeSocketEvents = (io) => {
  // Store connected users and their socket IDs
  const connectedUsers = new Map(); // userId -> socketId
  const userSockets = new Map(); // socketId -> userId
  const typingUsers = new Map(); // chatId -> Set of userIds

  /**
   * Handle new client connection
   */
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    /**
     * Handle user authentication
     */
    socket.on('authenticate', async (data) => {
      try {
        const { token } = data;
        
        if (!token) {
          socket.emit('authentication_error', { message: 'No token provided' });
          return;
        }

        // Verify JWT token (you would use your auth middleware here)
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);
        if (!user) {
          socket.emit('authentication_error', { message: 'User not found' });
          return;
        }

        // Store user connection
        connectedUsers.set(user._id.toString(), socket.id);
        userSockets.set(socket.id, user._id.toString());
        
        // Join user to their personal room
        socket.join(`user_${user._id}`);
        
        // Update user status to online
        await User.findByIdAndUpdate(user._id, { 
          status: 'online',
          lastSeen: new Date()
        });

        // Send user data back to client
        socket.emit('authenticated', {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            status: user.status
          }
        });

        // Notify friends about user status change
        socket.broadcast.emit('user_status_changed', {
          userId: user._id,
          status: 'online',
          lastSeen: new Date()
        });

        console.log(`User ${user.name} authenticated with socket ${socket.id}`);

      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    });

    /**
     * Handle joining chat rooms
     */
    socket.on('join_chat', async (chatId) => {
      const userId = userSockets.get(socket.id);
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      try {
        // Verify user is participant of the chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          participant => participant.user.toString() === userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Not a participant of this chat' });
          return;
        }

        // Join chat room
        socket.join(`chat_${chatId}`);
        socket.emit('joined_chat', { chatId });
        
        console.log(`User ${userId} joined chat ${chatId}`);

      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    /**
     * Handle leaving chat rooms
     */
    socket.on('leave_chat', (chatId) => {
      const userId = userSockets.get(socket.id);
      if (userId) {
        socket.leave(`chat_${chatId}`);
        socket.emit('left_chat', { chatId });
        console.log(`User ${userId} left chat ${chatId}`);
      }
    });

    /**
     * Handle typing indicators
     */
    socket.on('typing', (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      const { chatId, isTyping } = data;
      
      if (!chatId) return;

      // Track typing users for this chat
      if (!typingUsers.has(chatId)) {
        typingUsers.set(chatId, new Set());
      }

      const chatTypingUsers = typingUsers.get(chatId);

      if (isTyping) {
        chatTypingUsers.add(userId);
      } else {
        chatTypingUsers.delete(userId);
      }

      // Broadcast typing status to other users in the chat
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId,
        chatId,
        isTyping,
        typingUsers: Array.from(chatTypingUsers)
      });
    });

    /**
     * Handle message sending (real-time)
     */
    socket.on('send_message', async (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      try {
        const { chatId, content, messageType = 'text', replyTo } = data;

        // Validate input
        if (!chatId || (!content && messageType === 'text')) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Verify user is participant of the chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          participant => participant.user.toString() === userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Not a participant of this chat' });
          return;
        }

        // Create message
        const message = await Message.create({
          senderId: userId,
          chatId,
          content: content ? content.trim() : undefined,
          messageType,
          replyTo
        });

        // Populate message details
        await message.populate([
          { path: 'senderId', select: 'name profilePicture' },
          { path: 'replyTo', populate: { path: 'senderId', select: 'name' } }
        ]);

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id
        });

        // Broadcast message to all participants in the chat
        io.to(`chat_${chatId}`).emit('new_message', message);

        // Send delivery receipt to sender
        socket.emit('message_delivered', { messageId: message._id });

        console.log(`Message sent in chat ${chatId} by user ${userId}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Handle message editing
     */
    socket.on('edit_message', async (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      try {
        const { messageId, newContent } = data;

        if (!messageId || !newContent) {
          socket.emit('error', { message: 'Invalid edit data' });
          return;
        }

        // Find and validate message
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.senderId.toString() !== userId) {
          socket.emit('error', { message: 'Cannot edit other users\' messages' });
          return;
        }

        // Edit message
        await message.editMessage(newContent.trim());

        // Populate and broadcast updated message
        const updatedMessage = await Message.findById(messageId)
          .populate('senderId', 'name profilePicture')
          .populate('replyTo', 'content senderId messageType')
          .populate('replyTo.senderId', 'name');

        // Broadcast to chat participants
        io.to(`chat_${message.chatId}`).emit('message_edited', updatedMessage);

        console.log(`Message ${messageId} edited by user ${userId}`);

      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    /**
     * Handle message deletion
     */
    socket.on('delete_message', async (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      try {
        const { messageId } = data;

        if (!messageId) {
          socket.emit('error', { message: 'Message ID required' });
          return;
        }

        // Find and validate message
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.senderId.toString() !== userId) {
          socket.emit('error', { message: 'Cannot delete other users\' messages' });
          return;
        }

        // Delete message
        await message.softDelete(userId);

        // Broadcast deletion to chat participants
        io.to(`chat_${message.chatId}`).emit('message_deleted', {
          messageId,
          chatId: message.chatId
        });

        console.log(`Message ${messageId} deleted by user ${userId}`);

      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    /**
     * Handle message reactions
     */
    socket.on('react_to_message', async (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      try {
        const { messageId, emoji } = data;

        if (!messageId || !emoji) {
          socket.emit('error', { message: 'Message ID and emoji required' });
          return;
        }

        // Find message
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user is participant of the chat
        const chat = await Chat.findById(message.chatId);
        const isParticipant = chat.participants.some(
          participant => participant.user.toString() === userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Not a participant of this chat' });
          return;
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
          reaction => reaction.userId.toString() === userId && reaction.emoji === emoji
        );

        if (existingReaction) {
          // Remove reaction
          await message.removeReaction(userId, emoji);
        } else {
          // Add reaction
          await message.addReaction(userId, emoji);
        }

        // Get updated reactions
        const updatedMessage = await Message.findById(messageId)
          .populate('reactions.userId', 'name profilePicture');

        // Broadcast reaction update to chat participants
        io.to(`chat_${message.chatId}`).emit('message_reacted', {
          messageId,
          reactions: updatedMessage.reactions,
          userId,
          emoji,
          action: existingReaction ? 'removed' : 'added'
        });

        console.log(`Reaction ${emoji} ${existingReaction ? 'removed from' : 'added to'} message ${messageId} by user ${userId}`);

      } catch (error) {
        console.error('React to message error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    /**
     * Handle marking messages as read
     */
    socket.on('mark_messages_read', async (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      try {
        const { chatId, messageIds } = data;

        if (!chatId || !messageIds || !Array.isArray(messageIds)) {
          socket.emit('error', { message: 'Invalid read receipt data' });
          return;
        }

        // Update message read status
        await Message.updateMany(
          { 
            _id: { $in: messageIds },
            chatId,
            senderId: { $ne: userId }
          },
          { 
            $addToSet: { readBy: { user: userId, readAt: new Date() } },
            $set: { status: 'read' }
          }
        );

        // Get messages to notify senders
        const messages = await Message.find({ _id: { $in: messageIds } });
        
        // Notify each message sender about read receipt
        messages.forEach(message => {
          const senderSocketId = connectedUsers.get(message.senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('messages_read', {
              chatId,
              messageIds,
              readBy: userId
            });
          }
        });

        console.log(`Messages marked as read by user ${userId} in chat ${chatId}`);

      } catch (error) {
        console.error('Mark messages read error:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    /**
     * Handle user status changes
     */
    socket.on('change_status', async (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      try {
        const { status } = data;
        const validStatuses = ['online', 'offline', 'away', 'busy'];

        if (!validStatuses.includes(status)) {
          socket.emit('error', { message: 'Invalid status' });
          return;
        }

        // Update user status in database
        await User.findByIdAndUpdate(userId, { 
          status,
          lastSeen: status === 'offline' ? new Date() : undefined
        });

        // Broadcast status change to all connected users
        socket.broadcast.emit('user_status_changed', {
          userId,
          status,
          lastSeen: status === 'offline' ? new Date() : undefined
        });

        socket.emit('status_updated', { status });

        console.log(`User ${userId} status changed to ${status}`);

      } catch (error) {
        console.error('Change status error:', error);
        socket.emit('error', { message: 'Failed to change status' });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', async () => {
      const userId = userSockets.get(socket.id);
      
      if (userId) {
        // Remove user from tracking
        connectedUsers.delete(userId);
        userSockets.delete(socket.id);
        
        // Remove from typing indicators
        typingUsers.forEach((users, chatId) => {
          if (users.has(userId)) {
            users.delete(userId);
            socket.broadcast.emit('user_typing', {
              userId,
              chatId,
              isTyping: false,
              typingUsers: Array.from(users)
            });
          }
        });
        
        // Update user status to offline
        await User.findByIdAndUpdate(userId, { 
          status: 'offline',
          lastSeen: new Date()
        });

        // Notify other users about status change
        socket.broadcast.emit('user_status_changed', {
          userId,
          status: 'offline',
          lastSeen: new Date()
        });

        console.log(`User ${userId} disconnected`);
      }

      console.log(`Client disconnected: ${socket.id}`);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Return helper functions for external use
  return {
    sendToUser: (userId, event, data) => {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    },
    sendToChat: (chatId, event, data) => {
      io.to(`chat_${chatId}`).emit(event, data);
    },
    getConnectedUsers: () => Array.from(connectedUsers.keys()),
    isUserConnected: (userId) => connectedUsers.has(userId)
  };
};

module.exports = initializeSocketEvents;
