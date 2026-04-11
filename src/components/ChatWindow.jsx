import React, { useEffect, useRef, useState } from 'react';
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
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
        <div className="messages-list" onScroll={handleScroll}>
          <div ref={messagesEndRef} />
          
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
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
