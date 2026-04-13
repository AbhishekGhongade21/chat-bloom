import React from 'react';
import { User, Menu, Plus, X, Sun, Moon, Search, MessageCircle } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({
  chats,
  activeChat,
  setActiveChat,
  searchTerm,
  setSearchTerm,
  isDarkMode,
  setIsDarkMode,
  isOpen,
  setIsOpen,
  onCreateChat,
  onProfileClick
}) => {
  const handleChatClick = (chat) => {
    setActiveChat(chat);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <MessageCircle size={20} strokeWidth={1.5} />
          </div>
          <h2>Bloom</h2>
        </div>
        <div className="sidebar-controls">
          <button className="profile-btn" onClick={onProfileClick}>
            <User size={16} strokeWidth={1.5} />
          </button>
          <button className="theme-toggle" onClick={handleThemeToggle}>
            {isDarkMode ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          </button>
          <button className="create-chat-btn" onClick={onCreateChat}>
            <Plus size={16} strokeWidth={1.5} />
          </button>
          <button
            className="menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="search-icon"><Search size={16} strokeWidth={1.5} /></div>
      </div>

      <div className="chats-list">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
            onClick={() => handleChatClick(chat)}
          >
            <div className="chat-avatar">
              <div className="avatar-circle">
                {chat.avatar}
              </div>
              <div className={`online-indicator ${chat.online ? 'online' : 'offline'}`}></div>
            </div>
            <div className="chat-info">
              <div className="chat-header-row">
                <div className="chat-name-wrapper">
                  <h3 className="chat-name">{chat.name}</h3>
                  {chat.isGroup && <span className="chat-type-badge group">G</span>}
                  {chat.isChannel && <span className="chat-type-badge channel">C</span>}
                </div>
                <span className="chat-time">{chat.time}</span>
              </div>
              <div className="chat-message-row">
                <p className="last-message">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <span className="unread-badge">{chat.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
