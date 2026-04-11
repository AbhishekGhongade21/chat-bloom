import React from 'react';
import { FaBars, FaPhone, FaVideo, FaUser, FaEllipsisV, FaInfoCircle } from 'react-icons/fa';
import './ChatHeader.css';

const ChatHeader = ({ chat, sidebarOpen, setSidebarOpen, onProfileClick, onContactClick }) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <button 
          className="menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FaBars />
        </button>
        
        <div className="user-info">
          <div className="user-avatar">
            <div className="avatar-circle">
              {chat.name.charAt(0)}
            </div>
            <div className={`online-indicator ${chat.online ? 'online' : 'offline'}`}></div>
          </div>
          
          <div className="user-details">
            <h3 className="user-name">{chat.name}</h3>
            <span className="user-status">
              {chat.isGroup ? `${chat.memberCount || 0} members` : 
               chat.isChannel ? `${chat.subscriberCount || 0} subscribers` :
               chat.online ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <button 
            className="profile-button"
            onClick={onProfileClick}
          >
            <FaInfoCircle />
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <button className="header-button">
          <FaPhone />
        </button>
        <button className="header-button">
          <FaVideo />
        </button>
        <button className="header-button" onClick={onContactClick}>
          <FaUser />
        </button>
        <button className="header-button">
          <FaEllipsisV />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
