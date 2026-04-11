import React, { useState, useRef, useEffect } from 'react';
import { FaSmile, FaReply, FaEdit, FaShare, FaTrash, FaPlay, FaPause, FaDownload, FaImage, FaFileAudio, FaFileVideo, FaFile } from 'react-icons/fa';
import './MessageBubble.css';

const MessageBubble = ({ 
  message, 
  isSent, 
  onEdit, 
  onDelete, 
  onReply, 
  onReact, 
  onForward,
  isGroup,
  isChannel
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const reactions = ['\u2764\ufe0f', '\ud83d\udc4d', '\ud83d\ude02', '\ud83d\ude2e', '\ud83d\ude22', '\ud83d\udd25'];
  
  const deliveryStatus = {
    sent: '\u2713',
    delivered: '\u2713\u2713',
    read: '\u2713\u2713\u2713'
  };

  const handleEdit = () => {
    if (isEditing && editText.trim() !== message.text) {
      onEdit?.(message.id, editText);
    }
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
    setShowActions(false);
  };

  const handleReply = () => {
    onReply?.(message);
    setShowActions(false);
  };

  const handleForward = () => {
    onForward?.(message);
    setShowActions(false);
  };

  const handleReaction = (emoji) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
    setShowActions(false);
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVideoSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [message.audioUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleVideoTimeUpdate);
      video.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
      video.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        video.removeEventListener('timeupdate', handleVideoTimeUpdate);
        video.removeEventListener('loadedmetadata', handleVideoLoadedMetadata);
        video.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [message.videoUrl]);

  return (
    <div 
      className={`message-bubble ${isSent ? 'sent' : 'received'} ${message.edited ? 'edited' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {message.quoted && (
        <div className="quoted-message">
          <div className="quoted-content">
            <span className="quoted-author">{message.quoted.author}</span>
            <p className="quoted-text">{message.quoted.text}</p>
          </div>
        </div>
      )}
      
      <div className="message-content">
        {isEditing ? (
          <div className="edit-mode">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-input"
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleEdit} className="save-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {(isGroup || isChannel) && !isSent && message.sender && (
              <span className="message-sender">{message.sender}</span>
            )}
            {message.text && <p className="message-text">{message.text}</p>}
            
            {/* Voice Message */}
            {message.audioUrl && (
              <div className="voice-message">
                <audio ref={audioRef} src={message.audioUrl} />
                <div className="voice-controls">
                  <button onClick={handlePlayPause} className="voice-play-btn">
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <div className="voice-progress" onClick={handleSeek}>
                    <div className="voice-progress-bar">
                      <div 
                        className="voice-progress-fill" 
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="voice-duration">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <button onClick={() => handleDownload(message.audioUrl, 'voice-message.mp3')} className="voice-download-btn">
                    <FaDownload />
                  </button>
                </div>
              </div>
            )}
            
            {/* Image */}
            {message.imageUrl && (
              <div className="media-container">
                <img src={message.imageUrl} alt="Shared image" className="message-image" />
                <div className="media-actions">
                  <button onClick={() => handleDownload(message.imageUrl, 'image.jpg')} className="media-download-btn">
                    <FaDownload />
                  </button>
                </div>
              </div>
            )}
            
            {/* Video */}
            {message.videoUrl && (
              <div className="video-container">
                <video ref={videoRef} src={message.videoUrl} className="message-video" />
                <div className="video-controls">
                  <button onClick={handleVideoPlayPause} className="video-play-btn">
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <div className="video-progress" onClick={handleVideoSeek}>
                    <div className="video-progress-bar">
                      <div 
                        className="video-progress-fill" 
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="video-duration">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <button onClick={() => handleDownload(message.videoUrl, 'video.mp4')} className="video-download-btn">
                    <FaDownload />
                  </button>
                </div>
              </div>
            )}
            
            {/* File */}
            {message.fileUrl && (
              <div className="file-container">
                <div className="file-info">
                  <FaFile className="file-icon" />
                  <div className="file-details">
                    <p className="file-name">{message.fileName || 'File'}</p>
                    <p className="file-size">{message.fileSize || 'Unknown size'}</p>
                  </div>
                </div>
                <button onClick={() => handleDownload(message.fileUrl, message.fileName || 'file')} className="file-download-btn">
                  <FaDownload />
                </button>
              </div>
            )}
            <div className="message-footer">
              <span className="message-time">{message.time}</span>
              {isSent && (
                <span className={`delivery-status ${message.status}`}>
                  {deliveryStatus[message.status] || deliveryStatus.sent}
                </span>
              )}
              {message.edited && <span className="edited-indicator">edited</span>}
            </div>
          </>
        )}
        
        {message.reactions && message.reactions.length > 0 && (
          <div className="reactions-bar">
            {message.reactions.map((reaction, index) => (
              <span key={index} className="reaction">
                {reaction.emoji} {reaction.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {showActions && (
        <div className="message-actions">
          <button onClick={() => setShowReactions(!showReactions)} className="action-btn react-btn" title="React">
            <FaSmile />
          </button>
          <button onClick={handleReply} className="action-btn reply-btn" title="Reply">
            <FaReply />
          </button>
          {isSent && (
            <button onClick={handleEdit} className="action-btn edit-btn" title="Edit">
              <FaEdit />
            </button>
          )}
          <button onClick={handleForward} className="action-btn forward-btn" title="Forward">
            <FaShare />
          </button>
          {isSent && (
            <button onClick={handleDelete} className="action-btn delete-btn" title="Delete">
              <FaTrash />
            </button>
          )}
        </div>
      )}

      {showReactions && (
        <div className="reactions-picker">
          {reactions.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleReaction(emoji)}
              className="reaction-option"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
