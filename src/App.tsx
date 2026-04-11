import React, { useState, useEffect } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import UserProfile from './components/UserProfile';
import ContactManagement from './components/ContactManagement';
import ProfileManagement from './components/ProfileManagement';
import useChat from './hooks/useChat';
import { authAPI } from './services/api';
import './App.css';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showOwnProfile, setShowOwnProfile] = useState(false);
  const [showContactManagement, setShowContactManagement] = useState(false);
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [createChatForm, setCreateChatForm] = useState({ isGroupChat: false, chatName: '', participantEmail: '' });

  const {
    chats,
    activeChat,
    messages,
    loading,
    error,
    onlineUsers,
    typingUsers,
    backendAvailable,
    loadChats,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markMessagesAsRead,
    sendTyping,
    selectChat,
    setActiveChat,
    setError
  } = useChat();

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const { authAPI } = await import('./services/api');
      const response = await authAPI.login(loginForm);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      
      if (backendAvailable) {
        loadChats();
      }
    } catch (err) {
      console.error('Login failed:', err);
      setAuthError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    
    if (registerForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    
    try {
      const { authAPI } = await import('./services/api');
      const response = await authAPI.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      
      if (backendAvailable) {
        loadChats();
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setAuthError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
    setAuthError('');
  };

  // Handle create chat
  const handleCreateChat = () => {
    setShowCreateChat(true);
  };

  // Handle submit create chat
  const handleSubmitCreateChat = async (e) => {
    e.preventDefault();
    try {
      // First, find the user by email
      const { chatAPI, userAPI } = await import('./services/api');

      // Search for user by email
      console.log('Searching for user with email:', createChatForm.participantEmail);
      let usersResponse = await userAPI.searchUsers(createChatForm.participantEmail);
      console.log('Search response:', usersResponse.data);

      // If search by email fails, try getting all users
      if (!usersResponse.data.success || !usersResponse.data.users || usersResponse.data.users.length === 0) {
        console.log('Search by email failed, trying to get all users...');
        usersResponse = await userAPI.searchUsers('');
        console.log('All users response:', usersResponse.data);

        if (!usersResponse.data.success || !usersResponse.data.users || usersResponse.data.users.length === 0) {
          alert('No users found in the database. Please create a user first.');
          return;
        }

        // Filter manually by email
        const foundUser = usersResponse.data.users.find(u => u.email === createChatForm.participantEmail);
        if (!foundUser) {
          alert(`User not found with email: ${createChatForm.participantEmail}. Available users: ${usersResponse.data.users.map(u => u.email).join(', ')}`);
          return;
        }

        usersResponse.data.users = [foundUser];
      }

      const participant = usersResponse.data.users[0];
      const participantIds = [participant._id];

      let chatResponse;

      if (createChatForm.isGroupChat) {
        // Create group chat
        chatResponse = await chatAPI.createGroupChat({
          chatName: createChatForm.chatName,
          participantIds
        });
      } else {
        // Create 1-to-1 chat
        chatResponse = await chatAPI.createChat(participantIds);
      }

      if (chatResponse.data.success) {
        // Refresh the chats list
        loadChats();
        setShowCreateChat(false);
        setCreateChatForm({ isGroupChat: false, chatName: '', participantEmail: '' });
        alert('Chat created successfully!');
      } else {
        alert('Failed to create chat: ' + chatResponse.data.message);
      }
    } catch (err) {
      console.error('Create chat failed:', err);
      alert('Failed to create chat. Please try again.');
    }
  };

  // Check authentication on mount
  useEffect(() => {
    console.log('Authentication check effect running');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Found token:', !!token, 'Found user:', !!user);
    if (token && user) {
      console.log('Setting isAuthenticated to true from localStorage');
      setIsAuthenticated(true);
      if (backendAvailable) {
        console.log('Backend available, loading chats...');
        loadChats();
      } else {
        console.log('Backend not available, waiting for it to become available');
      }
    } else {
      console.log('No authentication data found in localStorage');
    }
  }, [loadChats, backendAvailable]);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // Handle search
  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        loadChats(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, loadChats, isAuthenticated]);

  const handleSendMessage = async (text) => {
    if (text.trim() && activeChat) {
      try {
        await sendMessage(activeChat._id, text);
        setReplyingTo(null);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    try {
      await editMessage(messageId, newText);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleReplyMessage = (message) => {
    setReplyingTo({
      author: message.senderId._id === activeChat?.participants.find(p => p.user._id === JSON.parse(localStorage.getItem('user')).id)?.user._id ? 'You' : message.senderId.name,
      text: message.content,
      id: message._id
    });
  };

  const handleReactMessage = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  const handleForwardMessage = (message) => {
    // UI only - would open chat selection dialog
    console.log('Forward message:', message);
  };

  const handleProfileClick = (isOwnProfile = false) => {
    if (isOwnProfile) {
      setShowOwnProfile(true);
    } else {
      setShowProfile(true);
    }
  };

  const handleProfileClose = () => {
    setShowProfile(false);
    setShowOwnProfile(false);
  };

  const handleStatusUpdate = (status) => {
    // Update user status via API
    console.log('Update status:', status);
  };

  const handleContactClick = () => {
    setShowContactManagement(true);
  };

  const handleContactClose = () => {
    setShowContactManagement(false);
  };

  const handleBlockContact = () => {
    // Block user via API
    console.log('Block contact');
    setShowContactManagement(false);
  };

  const handleUnblockContact = () => {
    // Unblock user via API
    console.log('Unblock contact');
    setShowContactManagement(false);
  };

  const handleMuteContact = () => {
    // Mute chat via API
    console.log('Mute contact');
    setShowContactManagement(false);
  };

  const handleUnmuteContact = () => {
    // Unmute chat via API
    console.log('Unmute contact');
    setShowContactManagement(false);
  };

  const handleProfileUpdate = (updatedUser) => {
    // Update current user in localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUserData = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    
    // Force a re-render to update UI with new user data
    window.location.reload();
  };

  const handleChatSelect = (chat) => {
    selectChat(chat);
  };

  const handleTyping = (isTyping) => {
    if (activeChat) {
      sendTyping(activeChat._id, isTyping);
    }
  };

  // Format message data for components
  const formatMessageData = (message) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?._id || currentUser?.id;
    
    // Handle different message structures from backend vs mock data
    const senderId = message.senderId?._id || message.sender?.id || message.senderId;
    const senderName = message.senderId?.name || message.sender?.name || 'Unknown';
    
    return {
      id: message._id || message.id,
      text: message.content,
      sent: senderId === currentUserId,
      time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: message.status,
      reactions: message.reactions?.map(r => ({ emoji: r.emoji, count: 1 })) || [],
      edited: message.isEdited,
      sender: senderName,
      messageType: message.messageType,
      file: message.file,
      replyTo: message.replyTo
    };
  };

  // Format chat data for components
  const formatChatData = (chat) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?._id || currentUser?.id;
    const otherParticipant = chat.participants?.find(p => p.user?._id !== currentUserId);
    
    return {
      _id: chat._id || chat.id,
      id: chat._id || chat.id,
      name: chat.isGroupChat ? (chat.chatName || 'Group Chat') : (otherParticipant?.user?.name || 'Unknown'),
      avatar: chat.isGroupChat ? (chat.chatName?.charAt(0) || 'G') : (otherParticipant?.user?.name?.charAt(0) || '?'),
      lastMessage: chat.lastMessage?.content || 'No messages yet',
      time: chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      unread: 0, // TODO: Calculate unread count
      online: chat.isGroupChat ? (chat.participants?.some(p => onlineUsers.has(p.user?._id)) || false) : onlineUsers.has(otherParticipant?.user?._id),
      isGroup: chat.isGroupChat || false,
      memberCount: chat.participants?.length || 0,
      isChannel: chat.isChannel || false,
      subscriberCount: chat.subscribers?.length || 0,
      participants: chat.participants || [],
      groupAdmin: chat.groupAdmin,
      isArchived: chat.isArchived || false
    };
  };

  const formattedChats = chats.map(formatChatData);
  const formattedMessages = messages.map(formatMessageData);
  const formattedActiveChat = activeChat ? formatChatData(activeChat) : null;
  const isTypingInChat = typingUsers.size > 0 && Array.from(typingUsers.keys()).some(userId => 
    activeChat?.participants.some(p => p.user._id === userId)
  );

  // Show create chat modal
  if (showCreateChat) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h2>Create New Chat</h2>
            <button onClick={() => setShowCreateChat(false)}>×</button>
          </div>
          <form onSubmit={handleSubmitCreateChat} className="modal-form">
            <div className="form-group">
              <label>Chat Type</label>
              <select
                value={createChatForm.isGroupChat ? 'group' : 'one-on-one'}
                onChange={(e) => setCreateChatForm({
                  ...createChatForm,
                  isGroupChat: e.target.value === 'group'
                })}
              >
                <option value="one-on-one">1-to-1 Chat</option>
                <option value="group">Group Chat</option>
              </select>
            </div>
            {createChatForm.isGroupChat && (
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={createChatForm.chatName}
                  onChange={(e) => setCreateChatForm({
                    ...createChatForm,
                    chatName: e.target.value
                  })}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Participant Email</label>
              <input
                type="email"
                placeholder="Enter user email"
                value={createChatForm.participantEmail}
                onChange={(e) => setCreateChatForm({
                  ...createChatForm,
                  participantEmail: e.target.value
                })}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowCreateChat(false)}>
                Cancel
              </button>
              <button type="submit">Create Chat</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <h1>Chat Bloom 93</h1>
          <p>{showLogin ? 'Login to your account' : 'Create a new account'}</p>
          
          {authError && (
            <div className="auth-error">
              {authError}
            </div>
          )}
          
          {showLogin ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              <button type="submit">Login</button>
              <p className="auth-switch">
                Don't have an account? 
                <button type="button" onClick={() => {setShowLogin(false); setAuthError('');}}>
                  Register
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit">Register</button>
              <p className="auth-switch">
                Already have an account? 
                <button type="button" onClick={() => {setShowLogin(true); setAuthError('');}}>
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div className="app">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
        <Sidebar
          chats={formattedChats}
          activeChat={formattedActiveChat}
          setActiveChat={handleChatSelect}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDarkMode={isDarkMode}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onCreateChat={handleCreateChat}
        />
        <ChatWindow
          chat={formattedActiveChat}
          messages={formattedMessages}
          onSendMessage={handleSendMessage}
          isTyping={isTypingInChat}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={handleReplyMessage}
          onReactMessage={handleReactMessage}
          onForwardMessage={handleForwardMessage}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          onProfileClick={handleProfileClick}
          onContactClick={handleContactClick}
          onTyping={handleTyping}
        />
      </div>
    );
  }

  // Show connection status if backend is not available
  if (!backendAvailable) {
    return (
      <div className="app">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
        <div className="connection-status offline">
          <span>🔴 Backend Offline - Demo Mode</span>
        </div>
        <Sidebar
          chats={formattedChats}
          activeChat={formattedActiveChat}
          setActiveChat={handleChatSelect}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDarkMode={isDarkMode}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onCreateChat={handleCreateChat}
        />
        <ChatWindow
          chat={formattedActiveChat}
          messages={formattedMessages}
          onSendMessage={handleSendMessage}
          isTyping={isTypingInChat}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={handleReplyMessage}
          onReactMessage={handleReactMessage}
          onForwardMessage={handleForwardMessage}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          onProfileClick={handleProfileClick}
          onContactClick={handleContactClick}
          onTyping={handleTyping}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt /> Logout
      </button>
      <Sidebar
        chats={formattedChats}
        activeChat={formattedActiveChat}
        setActiveChat={handleChatSelect}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isDarkMode={isDarkMode}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onCreateChat={handleCreateChat}
        onProfileClick={() => handleProfileClick(true)}
      />
      <ChatWindow
        chat={formattedActiveChat}
        messages={formattedMessages}
        onSendMessage={handleSendMessage}
        isTyping={isTypingInChat}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onReplyMessage={handleReplyMessage}
        onReactMessage={handleReactMessage}
        onForwardMessage={handleForwardMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        onProfileClick={handleProfileClick}
        onContactClick={handleContactClick}
        onTyping={handleTyping}
      />
      
      {showProfile && formattedActiveChat && (
        <UserProfile
          user={formattedActiveChat}
          isOpen={showProfile}
          onClose={handleProfileClose}
          onUpdateStatus={handleStatusUpdate}
          onEditProfile={() => setShowProfileManagement(true)}
        />
      )}
      
      {showOwnProfile && (
        <UserProfile
          user={{}}
          isOpen={showOwnProfile}
          onClose={handleProfileClose}
          onUpdateStatus={handleStatusUpdate}
          onEditProfile={() => setShowProfileManagement(true)}
          isOwnProfile={true}
        />
      )}
      
      {showContactManagement && formattedActiveChat && (
        <ContactManagement
          chat={formattedActiveChat}
          isOpen={showContactManagement}
          onClose={handleContactClose}
          onBlock={handleBlockContact}
          onUnblock={handleUnblockContact}
          onMute={handleMuteContact}
          onUnmute={handleUnmuteContact}
        />
      )}
      
      {showProfileManagement && (
        <ProfileManagement
          isOpen={showProfileManagement}
          onClose={() => setShowProfileManagement(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default App;
