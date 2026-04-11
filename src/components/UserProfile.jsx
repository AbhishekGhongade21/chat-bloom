import React, { useState } from 'react';
import { FaTimes, FaEdit, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaComment, FaImage, FaCog, FaVolumeMute, FaVolumeUp, FaEye, FaEyeSlash } from 'react-icons/fa';
import './UserProfile.css';

const UserProfile = ({ user, isOpen, onClose, onUpdateStatus, onEditProfile, isOwnProfile = false }) => {
  // Get current user data if showing own profile
  const getCurrentUserData = () => {
    if (isOwnProfile) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        name: currentUser.name || 'Unknown',
        avatar: currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?',
        status: currentUser.status || 'Happy',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        bio: currentUser.bio || '',
        lastSeen: currentUser.lastSeen,
        showLastSeen: currentUser.showLastSeen,
        showOnlineStatus: currentUser.showOnlineStatus
      };
    }
    return user;
  };

  const displayUser = getCurrentUserData();

  const [activeTab, setActiveTab] = useState('about');
  const [statusMessage, setStatusMessage] = useState(displayUser.status || '');
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const statusOptions = [
    { emoji: '\ud83d\ude0a', text: 'Happy', color: '#4ade80' },
    { emoji: '\ud83d\ude14', text: 'Sad', color: '#60a5fa' },
    { emoji: '\ud83d\ude34', text: 'Sleepy', color: '#a78bfa' },
    { emoji: '\ud83d\ude80', text: 'Busy', color: '#f87171' },
    { emoji: '\u2615', text: 'Coffee', color: '#fbbf24' },
    { emoji: '\ud83d\udcda', text: 'Working', color: '#34d399' },
    { emoji: '\ud83c\udfae', text: 'Gaming', color: '#f472b6' },
    { emoji: '\ud83c\udfb5', text: 'Music', color: '#fb923c' }
  ];

  const handleStatusUpdate = (status) => {
    setStatusMessage(status);
    setIsEditingStatus(false);
    onUpdateStatus?.(status);
  };

  const getStatusDisplay = () => {
    const status = statusOptions.find(s => s.text === statusMessage);
    return status || { emoji: '\ud83d\ude0a', text: 'Happy', color: '#4ade80' };
  };

  if (!isOpen) return null;

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-large">{displayUser.avatar}</div>
            <div className="status-indicator large online"></div>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{displayUser.name}</h2>
            <div className="profile-status">
              {isEditingStatus ? (
                <div className="status-editor">
                  <div className="status-options">
                    {statusOptions.map((status, index) => (
                      <button
                        key={index}
                        onClick={() => handleStatusUpdate(status.text)}
                        className="status-option"
                        style={{ borderColor: status.color }}
                      >
                        <span>{status.emoji}</span>
                        <span>{status.text}</span>
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsEditingStatus(false)}
                    className="cancel-status-btn"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="status-display" onClick={() => setIsEditingStatus(true)}>
                  <span>{getStatusDisplay().emoji}</span>
                  <span>{statusMessage || 'Happy'}</span>
                  <button className="edit-status-btn"><FaEdit /></button>
                </div>
              )}
            </div>
          </div>
          <div className="profile-actions">
            <button className="edit-profile-btn" onClick={onEditProfile}>
              <FaEdit /> Edit Profile
            </button>
            <button className="close-profile-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            Media
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'about' && (
            <div className="about-section">
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{displayUser.email || `${(displayUser.name || 'user').toLowerCase().replace(' ', '.')}@example.com`}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone</span>
                <span className="info-value">{displayUser.phone || '+1 234 567 8900'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location</span>
                <span className="info-value">{displayUser.location || 'San Francisco, CA'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Seen</span>
                <span className="info-value">{displayUser.lastSeen ? new Date(displayUser.lastSeen).toLocaleString() : 'Never'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className="info-value">{displayUser.status || 'Available'}</span>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="media-section">
              <div className="media-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="media-item">
                    <div className="media-placeholder">Image {i}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <div className="setting-item">
                <span className="setting-label">Notifications</span>
                <button className="toggle-switch active"></button>
              </div>
              <div className="setting-item">
                <span className="setting-label">Sound Effects</span>
                <button className="toggle-switch active"></button>
              </div>
              <div className="setting-item">
                <span className="setting-label">Online Status</span>
                <button className="toggle-switch active"></button>
              </div>
              <div className="setting-item">
                <span className="setting-label">Read Receipts</span>
                <button className="toggle-switch"></button>
              </div>
              <div className="setting-item">
                <span className="setting-label">Profile Photo</span>
                <button className="action-btn">Change</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
