import React, { useState, useRef, useEffect } from 'react';
import { FaSmile, FaMicrophone, FaMicrophoneSlash, FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import FileShare from './FileShare';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showFileShare, setShowFileShare] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (onTyping) {
      onTyping(e.target.value.length > 0);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Send voice message
        onSendMessage(`\ud83c\udfa4 Voice message (${formatTime(recordingTime)})`);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Fallback to text mode
      setIsVoiceMode(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isRecording) {
      stopRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="message-input-container">
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-animation">
            <div className="recording-dot"></div>
            <div className="recording-dot"></div>
            <div className="recording-dot"></div>
          </div>
          <span className="recording-time">{formatTime(recordingTime)}</span>
          <button 
            type="button" 
            className="stop-recording-btn"
            onClick={stopRecording}
          >
            \u23f9\ufe0f Stop
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-wrapper">
          <button 
            type="button" 
            className="emoji-button"
            onClick={() => {
              // Emoji picker functionality (UI only)
              console.log('Emoji picker clicked');
            }}
          >
            <FaSmile />
          </button>
          
          {!isVoiceMode ? (
            <>
              <input
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="message-input"
              />
              
              <button 
                type="button"
                className="voice-mode-btn"
                onClick={toggleVoiceMode}
                title="Voice message"
              >
                <FaMicrophone />
              </button>
            </>
          ) : (
            <button 
              type="button"
              className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title="Hold to record"
            >
              {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
          )}
          
          {!isVoiceMode && (
            <>
              <button 
                type="button"
                className="file-share-btn"
                onClick={() => setShowFileShare(true)}
                title="Share files"
              >
                <FaPaperclip />
              </button>
              
              <button 
                type="submit" 
                className={`send-button ${message.trim() ? 'active' : ''}`}
                disabled={!message.trim()}
              >
                <FaPaperPlane />
              </button>
            </>
          )}
        </div>
      </form>
      
      {showFileShare && (
        <FileShare
          isOpen={showFileShare}
          onClose={() => setShowFileShare(false)}
          onFileSelect={onSendMessage}
        />
      )}
    </div>
  );
};

export default MessageInput;
