import React from 'react';
import { Menu, Phone, Video, User, MoreVertical, Info } from 'lucide-react';
import './ChatHeader.css';

const ChatHeader = ({ chat, sidebarOpen, setSidebarOpen, onProfileClick, onContactClick }) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <button 
          className="menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={18} strokeWidth={1.5} />
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
            <Info size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <button className="header-button">
          <Phone size={18} strokeWidth={1.5} />
        </button>
        <button className="header-button">
          <Video size={18} strokeWidth={1.5} />
        </button>
        <button className="header-button" onClick={onContactClick}>
          <User size={18} strokeWidth={1.5} />
        </button>
        <button className="header-button">
          <MoreVertical size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
