const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * - Verifies JWT tokens and protects routes
 * - Attaches user object to request object
 */

/**
 * Protect routes - require authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user not found'
        });
      }

      // Check if user is active (you might want to add an isActive field)
      // if (!user.isActive) {
      //   return res.status(401).json({
      //     success: false,
      //     message: 'Account has been deactivated'
      //   });
      // }

      // Attach user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token is invalid but we don't fail the request
        console.log('Invalid token in optional auth:', jwtError.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * Check if user is admin (for group chat management)
 */
const requireAdmin = (req, res, next) => {
  // This would be used for routes that require admin privileges
  // You might want to implement role-based access control
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

/**
 * Check if user is participant of the chat
 */
const requireChatParticipant = async (req, res, next) => {
  try {
    const Chat = require('../models/Chat');
    const chatId = req.params.chatId || req.body.chatId || req.query.chatId;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required'
      });
    }

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
        message: 'Access denied. You are not a participant of this chat'
      });
    }

    // Attach chat to request object for use in controllers
    req.chat = chat;
    next();

  } catch (error) {
    console.error('Chat participant check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking chat participation'
    });
  }
};

/**
 * Check if user is admin of the group chat
 */
const requireGroupAdmin = async (req, res, next) => {
  try {
    if (!req.chat) {
      return res.status(400).json({
        success: false,
        message: 'Chat not loaded. Use requireChatParticipant middleware first.'
      });
    }

    if (!req.chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'This is not a group chat'
      });
    }

    const isAdmin = req.chat.groupAdmin.toString() === req.user._id.toString();

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Group admin privileges required.'
      });
    }

    next();

  } catch (error) {
    console.error('Group admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking group admin status'
    });
  }
};

/**
 * Rate limiting middleware (basic implementation)
 * You might want to use a more sophisticated rate limiting library like express-rate-limit
 */
const basicRateLimit = (maxRequests = 1000, windowMs = 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(key)) {
      requests.set(key, requests.get(key).filter(timestamp => timestamp > windowStart));
    }

    // Get current request count
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  requireAdmin,
  requireChatParticipant,
  requireGroupAdmin,
  basicRateLimit
};
