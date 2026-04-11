const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const healthRoutes = require('./health');

// Import middleware
const { basicRateLimit } = require('./middleware/auth');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to database
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');
const filesDir = path.join(uploadsDir, 'files');

[uploadsDir, profilePicturesDir, filesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting middleware
app.use('/api/', basicRateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat Bloom 93 Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large'
    });
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Socket.IO connection handling
const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join user to their personal room for private messages
  socket.on('authenticate', (userData) => {
    try {
      // In a real app, you would verify the JWT token here
      const { userId, token } = userData;
      
      if (userId) {
        // Store user connection
        connectedUsers.set(userId, socket.id);
        userSockets.set(socket.id, userId);
        
        // Join user to their personal room
        socket.join(`user_${userId}`);
        
        // Update user status to online
        User.findByIdAndUpdate(userId, { status: 'online' })
          .then(() => {
            // Notify friends that user is online
            socket.broadcast.emit('user_status_changed', {
              userId,
              status: 'online'
            });
          })
          .catch(err => console.error('Error updating user status:', err));
        
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
    }
  });
  
  // Handle joining chat rooms
  socket.on('join_chat', (chatId) => {
    const userId = userSockets.get(socket.id);
    if (userId) {
      socket.join(`chat_${chatId}`);
      console.log(`User ${userId} joined chat room ${chatId}`);
    }
  });
  
  // Handle leaving chat rooms
  socket.on('leave_chat', (chatId) => {
    const userId = userSockets.get(socket.id);
    if (userId) {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${userId} left chat room ${chatId}`);
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    const { chatId, isTyping } = data;
    const userId = userSockets.get(socket.id);
    
    if (userId && chatId) {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId,
        chatId,
        isTyping
      });
    }
  });
  
  // Handle message read receipts
  socket.on('mark_messages_read', async (data) => {
    const { chatId, messageIds } = data;
    const userId = userSockets.get(socket.id);
    
    if (userId && chatId && messageIds.length > 0) {
      try {
        // Update message read status in database
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
        
        // Notify message sender that messages were read
        const messages = await Message.find({ _id: { $in: messageIds } });
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
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const userId = userSockets.get(socket.id);
    
    if (userId) {
      // Remove user connection
      connectedUsers.delete(userId);
      userSockets.delete(socket.id);
      
      // Update user status to offline
      User.findByIdAndUpdate(userId, { 
        status: 'offline',
        lastSeen: new Date()
      })
      .then(() => {
        // Notify friends that user is offline
        socket.broadcast.emit('user_status_changed', {
          userId,
          status: 'offline',
          lastSeen: new Date()
        });
      })
      .catch(err => console.error('Error updating user status:', err));
      
      console.log(`User ${userId} disconnected`);
    }
    
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to send real-time notifications
const sendToUser = (userId, event, data) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// Helper function to send to chat room
const sendToChat = (chatId, event, data) => {
  io.to(`chat_${chatId}`).emit(event, data);
};

// Make these functions available globally for use in controllers
global.io = io;
global.sendToUser = sendToUser;
global.sendToChat = sendToChat;

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ========================================
  Chat Bloom 93 Backend Server
  ========================================
  Environment: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT}
  Database: ${process.env.MONGODB_URI}
  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
  ========================================
  Server is running and ready to accept connections
  ========================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, io };
