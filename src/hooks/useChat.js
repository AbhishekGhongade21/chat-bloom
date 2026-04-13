import { useState, useEffect, useCallback } from 'react';
import { chatAPI, messageAPI, userAPI } from '../services/api';
import socketService from '../services/socket';

const useChat = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Check backend availability
  const checkBackendAvailability = useCallback(async () => {
    try {
      const healthUrl = `https://backendofchatbloom.onrender.com/health`;
      console.log('Checking backend availability at:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: 3000
      });
      const available = response.ok;
      console.log('Backend available:', available, 'Status:', response.status);
      
      setBackendAvailable(available);
      if (!available) {
        setError('Backend server is not running - using demo mode');
      } else {
        setError(null); // Clear any previous error
      }
      return available;
    } catch (err) {
      console.error('Backend availability check failed:', err);
      setBackendAvailable(false);
      setError('Backend server is not running - using demo mode');
      return false;
    }
  }, []);

  // Load user's chats
  const loadChats = useCallback(async (search = '') => {
    console.log('loadChats called, backendAvailable:', backendAvailable);
    if (!backendAvailable) {
      // Don't attempt to load if backend is not available
      console.log('Backend not available, setting empty chats');
      setChats([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting to load chats from API...');
      const response = await chatAPI.getChats(1, search);
      console.log('Chats loaded successfully:', response.data);
      setChats(response.data.chats || []);
    } catch (err) {
      console.error('Failed to load chats from API:', err);
      console.error('Error response:', err.response?.data);
      setBackendAvailable(false);
      setError('Failed to load chats from API');
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [backendAvailable]);

  // Load all chat history for a chat
  const loadAllMessages = useCallback(async (chatId) => {
    console.log('loadAllMessages called for chatId:', chatId, 'backendAvailable:', backendAvailable);
    
    if (!backendAvailable) {
      console.log('Backend not available, cannot load messages');
      setMessages([]);
      setError('Backend not available');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading all messages from API...');
      
      // Load messages in batches until all are loaded
      let allMessages = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await messageAPI.getMessages(chatId, page);
        const messages = response.data.messages || [];
        
        if (messages.length === 0) {
          hasMore = false;
        } else {
          allMessages = [...messages, ...allMessages]; // Prepend new messages
          page++;
        }
        
        // Safety check to prevent infinite loop
        if (page > 100) {
          console.warn('Reached maximum page limit, stopping message loading');
          hasMore = false;
        }
      }
      
      setMessages(allMessages);
      console.log(`Loaded ${allMessages.length} total messages for chat ${chatId}`);
      
    } catch (err) {
      console.error('Failed to load messages from API:', err);
      setBackendAvailable(false);
      setError('Failed to load messages from API');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [backendAvailable]);

  // Load messages for a chat (paginated)
  const loadMessages = useCallback(async (chatId, page = 1) => {
    console.log('loadMessages called for chatId:', chatId, 'backendAvailable:', backendAvailable);
    
    if (!backendAvailable) {
      console.log('Backend not available, cannot load messages');
      setMessages([]);
      setError('Backend not available');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting to load messages from API...');
      const response = await messageAPI.getMessages(chatId, page);
      const newMessages = response.data.messages || [];
      
      if (page === 1) {
        setMessages(newMessages.reverse()); // Reverse to show oldest first
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      }
    } catch (err) {
      console.error('Failed to load messages from API:', err);
      setBackendAvailable(false);
      setError('Failed to load messages from API');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [backendAvailable]);

  // Send a message
  const sendMessage = useCallback(async (chatId, content, messageType = 'text', file = null) => {
    try {
      let messageData = { content, messageType };
      
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('content', content);
        formData.append('messageType', messageType);
        
        const response = await messageAPI.uploadFile(chatId, formData);
        return response.data.data;
      } else {
        const response = await messageAPI.sendMessage(chatId, messageData);
        const newMessage = response.data.data;
        
        // Add message to local state immediately
        setMessages(prev => [...prev, newMessage]);
        
        // Update chat's last message in local state
        setChats(prev => prev.map(chat => 
          chat._id === chatId 
            ? { ...chat, lastMessage: newMessage, updatedAt: newMessage.createdAt }
            : chat
        ));
        
        return newMessage;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    }
  }, []);

  // Edit a message
  const editMessage = useCallback(async (messageId, content) => {
    try {
      const response = await messageAPI.editMessage(messageId, content);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to edit message');
      throw err;
    }
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
      throw err;
    }
  }, []);

  // Add reaction to message
  const addReaction = useCallback(async (messageId, emoji) => {
    try {
      const response = await messageAPI.addReaction(messageId, emoji);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add reaction');
      throw err;
    }
  }, []);

  // Remove reaction from message
  const removeReaction = useCallback(async (messageId, emoji) => {
    try {
      const response = await messageAPI.removeReaction(messageId, emoji);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove reaction');
      throw err;
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (chatId, messageIds) => {
    try {
      await messageAPI.markAsRead(chatId, messageIds);
      socketService.markMessagesRead(chatId, messageIds);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark messages as read');
    }
  }, []);

  // Create a new chat
  const createChat = useCallback(async (participantIds) => {
    try {
      const response = await chatAPI.createChat(participantIds);
      const newChat = response.data.data;
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat');
      throw err;
    }
  }, []);

  // Create a group chat
  const createGroupChat = useCallback(async (chatData) => {
    try {
      const response = await chatAPI.createGroupChat(chatData);
      const newChat = response.data.data;
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group chat');
      throw err;
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((chatId, isTyping) => {
    socketService.sendTyping(chatId, isTyping);
  }, []);

  // Set active chat
  const selectChat = useCallback((chat) => {
    if (activeChat && activeChat._id !== chat._id) {
      socketService.leaveChat(activeChat._id);
    }
    
    setActiveChat(chat);
    socketService.joinChat(chat._id);
    loadAllMessages(chat._id);
  }, [activeChat, loadAllMessages]);

  // Check backend availability on mount
  useEffect(() => {
    checkBackendAvailability();
  }, [checkBackendAvailability]);

  // Initialize socket connection when backend becomes available
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Socket connection effect - backendAvailable:', backendAvailable, 'hasToken:', !!token);
    
    if (token && backendAvailable) {
      try {
        console.log('Attempting to connect socket...');
        socketService.connect(token);
      } catch (err) {
        console.error('Socket connection failed:', err);
        setError('Socket connection failed - some features may be limited');
      }
    }

    return () => {
      console.log('Cleaning up socket connection...');
      socketService.disconnect();
    };
  }, [backendAvailable]);

  // Socket event listeners
  useEffect(() => {
    if (!socketService.isConnected()) return;

    // New message
    socketService.on('new_message', (message) => {
      if (message.chatId === activeChat?._id) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update chat's last message
      setChats(prev => prev.map(chat => 
        chat._id === message.chatId 
          ? { ...chat, lastMessage: message, updatedAt: message.createdAt }
          : chat
      ));
    });

    // Message edited
    socketService.on('message_edited', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, content: data.content, isEdited: true, editHistory: data.editHistory }
          : msg
      ));
    });

    // Message deleted
    socketService.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    });

    // Reaction added
    socketService.on('message_reaction_added', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    });

    // Reaction removed
    socketService.on('message_reaction_removed', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    });

    // Messages read
    socketService.on('messages_read', (data) => {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg._id) 
          ? { ...msg, status: 'read', readBy: data.readBy }
          : msg
      ));
    });

    // User typing
    socketService.on('user_typing', (data) => {
      if (data.chatId === activeChat?._id) {
        setTypingUsers(prev => {
          const newTypingUsers = new Map(prev);
          if (data.isTyping) {
            newTypingUsers.set(data.userId, Date.now());
          } else {
            newTypingUsers.delete(data.userId);
          }
          return newTypingUsers;
        });
      }
    });

    // User status changed
    socketService.on('user_status_changed', (data) => {
      setOnlineUsers(prev => {
        const newOnlineUsers = new Set(prev);
        if (data.status === 'online') {
          newOnlineUsers.add(data.userId);
        } else {
          newOnlineUsers.delete(data.userId);
        }
        return newOnlineUsers;
      });

      // Update chat participant status
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants.map(participant =>
          participant.user._id === data.userId
            ? { ...participant, user: { ...participant.user, status: data.status } }
            : participant
        )
      })));
    });

    // Chat updated
    socketService.on('chat_updated', (data) => {
      setChats(prev => prev.map(chat => 
        chat._id === data.chatId 
          ? { ...chat, ...data.updates }
          : chat
      ));

      if (activeChat && activeChat._id === data.chatId) {
        setActiveChat(prev => ({ ...prev, ...data.updates }));
      }
    });

    return () => {
      socketService.off('new_message');
      socketService.off('message_edited');
      socketService.off('message_deleted');
      socketService.off('message_reaction_added');
      socketService.off('message_reaction_removed');
      socketService.off('messages_read');
      socketService.off('user_typing');
      socketService.off('user_status_changed');
      socketService.off('chat_updated');
    };
  }, [activeChat]);

  // Clean up typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const newTypingUsers = new Map();
        prev.forEach((timestamp, userId) => {
          if (now - timestamp < 3000) { // Remove typing indicators after 3 seconds
            newTypingUsers.set(userId, timestamp);
          }
        });
        return newTypingUsers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    chats,
    activeChat,
    messages,
    loading,
    error,
    onlineUsers,
    typingUsers,
    backendAvailable,
    loadChats,
    loadMessages,
    loadAllMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markMessagesAsRead,
    createChat,
    createGroupChat,
    sendTyping,
    selectChat,
    setActiveChat,
    setError
  };
};

export default useChat;
