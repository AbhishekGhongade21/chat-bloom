import React, { useState, useEffect } from 'react';
import './ContactManagement.css';
import { userAPI } from '../services/api';

const ContactManagement = ({ chat, isOpen, onClose, onBlock, onMute, onUnblock, onUnmute }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Extract real user info from chat participants
  const getContactInfo = () => {
    if (!chat.participants || chat.participants.length === 0) {
      return {
        name: 'Unknown User',
        email: 'No email',
        phone: 'No phone',
        lastSeen: 'Never',
        online: false,
        avatar: '?'
      };
    }

    // Get the other participant (not current user)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser._id || currentUser.id;
    
    const otherParticipant = chat.participants.find(p => 
      p.user && p.user._id !== currentUserId
    );

    if (!otherParticipant || !otherParticipant.user) {
      return {
        name: 'Unknown User',
        email: 'No email',
        phone: 'No phone',
        lastSeen: 'Never',
        online: false,
        avatar: '?'
      };
    }

    const user = otherParticipant.user;
    return {
      userId: user._id,
      name: user.name || 'Unknown',
      email: user.email || 'No email',
      phone: user.phone || 'Not provided',
      lastSeen: user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : 'Never',
      online: chat.online || false,
      avatar: user.name ? user.name.charAt(0).toUpperCase() : '?'
    };
  };

  const contactInfo = getContactInfo();

  // Fetch detailed user information when modal opens
  useEffect(() => {
    if (isOpen && contactInfo.userId) {
      fetchUserDetails(contactInfo.userId);
    }
  }, [isOpen, contactInfo.userId]);

  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await userAPI.getUserById(userId);
      if (response.data.success) {
        setUserDetails(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get final contact info combining chat data and user details
  const getFinalContactInfo = () => {
    if (userDetails) {
      return {
        name: userDetails.name || contactInfo.name,
        email: userDetails.email || 'No email provided',
        phone: userDetails.phone || 'No phone provided',
        lastSeen: userDetails.lastSeen ? new Date(userDetails.lastSeen).toLocaleDateString() : contactInfo.lastSeen,
        online: contactInfo.online,
        avatar: userDetails.name ? userDetails.name.charAt(0).toUpperCase() : contactInfo.avatar,
        location: userDetails.location || 'Not provided',
        joined: userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown',
        bio: userDetails.bio || 'No bio available'
      };
    }
    return contactInfo;
  };

  const finalContactInfo = getFinalContactInfo();

  return (
    <div className="contact-management-overlay" onClick={onClose}>
      <div className="contact-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Contact Information</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="contact-info">
          <div className="contact-avatar">
            <div className="avatar-circle">{finalContactInfo.avatar}</div>
            <div className={`status-indicator ${finalContactInfo.online ? 'online' : 'offline'}`}></div>
          </div>
          <div className="contact-details">
            <h4>{finalContactInfo.name}</h4>
            <span className="contact-status">{finalContactInfo.online ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
          <button
            className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            Support
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'info' && (
            <div className="info-section">
              {loading && <div className="loading-indicator">Loading user details...</div>}
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{finalContactInfo.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{finalContactInfo.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location</span>
                <span className="info-value">{finalContactInfo.location}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Joined</span>
                <span className="info-value">{finalContactInfo.joined}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Seen</span>
                <span className="info-value">{finalContactInfo.lastSeen}</span>
              </div>
              <div className="info-item bio-item">
                <span className="info-label">Bio</span>
                <span className="info-value">{finalContactInfo.bio}</span>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="privacy-section">
              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Block Contact</h4>
                  <p>Blocked contacts will not be able to call you or send you messages</p>
                </div>
                <button 
                  className={`block-btn ${chat.blocked ? 'blocked' : ''}`}
                  onClick={chat.blocked ? onUnblock : onBlock}
                >
                  {chat.blocked ? 'Unblock' : 'Block'}
                </button>
              </div>

              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Mute Notifications</h4>
                  <p>You won't receive notifications from this contact</p>
                </div>
                <button 
                  className={`mute-btn ${chat.muted ? 'muted' : ''}`}
                  onClick={chat.muted ? onUnmute : onMute}
                >
                  {chat.muted ? 'Unmute' : 'Mute'}
                </button>
              </div>

              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Disappearing Messages</h4>
                  <p>Messages will disappear after they've been viewed</p>
                </div>
                <select className="disappearing-select">
                  <option>Off</option>
                  <option>24 hours</option>
                  <option>7 days</option>
                  <option>90 days</option>
                </select>
              </div>

              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Report Contact</h4>
                  <p>Report this contact for spam or abuse</p>
                </div>
                <button className="report-btn">Report</button>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="support-section">
              <div className="support-item">
                <h4>Add to Favorites</h4>
                <p>Quick access to your favorite contacts</p>
                <button className="favorite-btn">Add to Favorites</button>
              </div>

              <div className="support-item">
                <h4>Share Contact</h4>
                <p>Share this contact with others</p>
                <button className="share-btn">Share</button>
              </div>

              <div className="support-item">
                <h4>Export Chat</h4>
                <p>Download your chat history</p>
                <button className="export-btn">Export</button>
              </div>

              <div className="support-item">
                <h4>Clear Chat</h4>
                <p>Remove all messages from this chat</p>
                <button className="clear-btn">Clear Chat</button>
              </div>

              <div className="support-item danger">
                <h4>Delete Contact</h4>
                <p>Remove this contact and delete all messages</p>
                <button className="delete-btn">Delete Contact</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactManagement;
