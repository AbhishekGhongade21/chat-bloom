import React, { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = ({ 
  chat, 
  messages,
  onSendMessage, 
  isTyping, 
  sidebarOpen, 
  setSidebarOpen,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onReactMessage,
  onForwardMessage,
  replyingTo,
  setReplyingTo,
  onProfileClick,
  onContactClick,
  onTyping
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!chat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <div className="empty-icon">chat</div>
          <h2>Welcome to Chat Bloom</h2>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <ChatHeader 
        chat={chat} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onProfileClick={onProfileClick}
        onContactClick={onContactClick}
      />
      
      <div className="messages-container">
        <div className="messages-list">
          {messages?.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSent={message.sent}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onReply={onReplyMessage}
              onReact={onReactMessage}
              onForward={onForwardMessage}
              isGroup={chat.isGroup}
              isChannel={chat.isChannel}
            />
          ))}
          
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {replyingTo && (
        <div className="reply-indicator">
          <div className="reply-content">
            <span className="reply-label">Replying to {replyingTo.author}</span>
            <p className="reply-text">{replyingTo.text}</p>
          </div>
          <button 
            className="cancel-reply"
            onClick={() => setReplyingTo(null)}
          >
            ×
          </button>
        </div>
      )}
      
      <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
    </div>
  );
};

export default ChatWindow;
