import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaComment, FaCamera, FaUpload, FaTimesCircle, FaCheckCircle, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import './ProfileManagement.css';
import { userAPI } from '../services/api';

const ProfileManagement = ({ isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    phone: '',
    location: '',
    status: 'offline',
    showLastSeen: true,
    showOnlineStatus: true
  });
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentProfilePicture, setCurrentProfilePicture] = useState('');

  // Load current profile data
  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      if (response.data.success) {
        const user = response.data.user;
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          bio: user.bio || '',
          phone: user.phone || '',
          location: user.location || '',
          status: user.status || 'offline',
          showLastSeen: user.showLastSeen !== false,
          showOnlineStatus: user.showOnlineStatus !== false
        });
        setCurrentProfilePicture(user.profilePicture || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      showMessage('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showMessage('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed', 'error');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('File size must be less than 5MB', 'error');
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Update profile information
      const updateData = {
        name: profileData.name,
        bio: profileData.bio,
        phone: profileData.phone,
        location: profileData.location,
        status: profileData.status,
        showLastSeen: profileData.showLastSeen,
        showOnlineStatus: profileData.showOnlineStatus
      };

      const response = await userAPI.updateProfile(updateData);
      
      if (response.data.success) {
        showMessage('Profile updated successfully!', 'success');
        onUpdate && onUpdate(response.data.user);
      } else {
        showMessage('Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) {
      showMessage('Please select a profile picture first', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      const response = await userAPI.uploadProfilePicture(formData);
      
      if (response.data.success) {
        setCurrentProfilePicture(response.data.profilePicture);
        setPreviewImage(null);
        setProfilePicture(null);
        showMessage('Profile picture updated successfully!', 'success');
        onUpdate && onUpdate(response.data.user);
      } else {
        showMessage('Failed to update profile picture', 'error');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      showMessage(error.response?.data?.message || 'Failed to upload profile picture', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'away': return '#FF9800';
      case 'busy': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return 'dot_circle';
      case 'away': return 'clock';
      case 'busy': return 'times_circle';
      default: return 'circle';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-management-overlay" onClick={onClose}>
      <div className="profile-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profile Settings</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => setActiveTab('photo')}
          >
            Photo
          </button>
          <button
            className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label htmlFor="name"><FaUser /> Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email"><FaEnvelope /> Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="disabled"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label htmlFor="bio"><FaComment /> Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    maxLength={200}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                  <small>{profileData.bio.length}/200 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="phone"><FaPhone /> Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location"><FaMapMarkerAlt /> Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={profileData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status"><FaComment /> Status</label>
                  <div className="status-selector">
                    <select
                      id="status"
                      name="status"
                      value={profileData.status}
                      onChange={handleInputChange}
                    >
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                      <option value="away">Away</option>
                      <option value="busy">Busy</option>
                    </select>
                    <span 
                      className="status-indicator" 
                      style={{ color: getStatusColor(profileData.status) }}
                    >
                      {getStatusIcon(profileData.status)}
                    </span>
                  </div>
                </div>

                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'photo' && (
            <div className="photo-section">
              <div className="current-photo">
                <h4>Current Profile Picture</h4>
                <div className="photo-display">
                  {currentProfilePicture ? (
                    <img src={currentProfilePicture} alt="Current profile" />
                  ) : (
                    <div className="default-avatar">
                      {profileData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="photo-upload">
                <h4><FaCamera /> Upload New Photo</h4>
                <div className="upload-area">
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profilePicture" className="upload-btn">
                    <FaUpload /> Choose Photo
                  </label>
                  <small>Allowed: JPEG, PNG, GIF, WebP (Max 5MB)</small>
                </div>

                {previewImage && (
                  <div className="preview-section">
                    <h5>Preview</h5>
                    <div className="preview-container">
                      <img src={previewImage} alt="Preview" />
                      <div className="preview-actions">
                        <button onClick={handleProfilePictureUpload} disabled={loading}>
                          {loading ? 'Uploading...' : 'Upload Photo'}
                        </button>
                        <button 
                          onClick={() => {
                            setPreviewImage(null);
                            setProfilePicture(null);
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="privacy-section">
              <h4>Privacy Settings</h4>
              
              <div className="privacy-item">
                <div className="privacy-info">
                  <h5><FaEye /> Show Last Seen</h5>
                  <p>Let others see when you were last active</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="showLastSeen"
                    checked={profileData.showLastSeen}
                    onChange={handleInputChange}
                  />
                  <span className="slider">
                    {profileData.showLastSeen ? <FaToggleOn /> : <FaToggleOff />}
                  </span>
                </label>
              </div>

              <div className="privacy-item">
                <div className="privacy-info">
                  <h5><FaEyeSlash /> Show Online Status</h5>
                  <p>Let others see when you're online</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="showOnlineStatus"
                    checked={profileData.showOnlineStatus}
                    onChange={handleInputChange}
                  />
                  <span className="slider">
                    {profileData.showOnlineStatus ? <FaToggleOn /> : <FaToggleOff />}
                  </span>
                </label>
              </div>

              <div className="privacy-info-text">
                <p><strong>Note:</strong> When these settings are disabled, other users won't be able to see your last seen time or online status.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
