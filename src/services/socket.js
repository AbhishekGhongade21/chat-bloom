import { io } from 'socket.io-client';
import { messageAPI } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.connectedUsers = new Map();
    this.currentUserId = null;
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io('https://backendofchatbloom.onrender.com', {
      auth: {
        token
      }
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.authenticate();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Authentication
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      this.currentUserId = data.userId;
    });

    // Message events
    this.socket.on('new_message', (message) => {
      this.emit('new_message', message);
    });

    this.socket.on('message_edited', (data) => {
      this.emit('message_edited', data);
    });

    this.socket.on('message_deleted', (data) => {
      this.emit('message_deleted', data);
    });

    this.socket.on('message_reaction_added', (data) => {
      this.emit('message_reaction_added', data);
    });

    this.socket.on('message_reaction_removed', (data) => {
      this.emit('message_reaction_removed', data);
    });

    this.socket.on('messages_read', (data) => {
      this.emit('messages_read', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    // User status events
    this.socket.on('user_status_changed', (data) => {
      this.emit('user_status_changed', data);
    });

    // Chat events
    this.socket.on('chat_updated', (data) => {
      this.emit('chat_updated', data);
    });

    this.socket.on('participant_added', (data) => {
      this.emit('participant_added', data);
    });

    this.socket.on('participant_removed', (data) => {
      this.emit('participant_removed', data);
    });
  }

  authenticate() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && this.socket) {
      this.socket.emit('authenticate', {
        userId: user.id,
        token: localStorage.getItem('token')
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat room management
  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  // Typing indicators
  sendTyping(chatId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  // Message read receipts
  markMessagesRead(chatId, messageIds) {
    if (this.socket) {
      this.socket.emit('mark_messages_read', { chatId, messageIds });
    }
    // Also send via API for persistence
    messageAPI.markAsRead(chatId, messageIds);
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.events) {
      this.events = new Map();
    }
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  emit(event, data) {
    if (this.events && this.events.has(event)) {
      this.events.get(event).forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    if (this.events && this.events.has(event)) {
      const callbacks = this.events.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Get connection status
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Get current user ID
  getCurrentUserId() {
    return this.currentUserId;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
