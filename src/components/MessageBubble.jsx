import React, { useState } from 'react';
import { FaSmile, FaReply, FaEdit, FaShare, FaTrash } from 'react-icons/fa';
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
            <p className="message-text">{message.text}</p>
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
