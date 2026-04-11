import React, { useState, useRef, useCallback } from 'react';
import './FileShare.css';

const FileShare = ({ onFileSelect, isOpen, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                          file.type.startsWith('video/') || 
                          file.type.startsWith('audio/') ||
                          file.type === 'application/pdf' ||
                          file.type.includes('document') ||
                          file.type.includes('text');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    const filesWithPreview = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setPreviewFiles(prev => [...prev, ...filesWithPreview]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (id) => {
    setPreviewFiles(prev => prev.filter(file => file.id !== id));
  };

  const sendFiles = () => {
    if (previewFiles.length > 0) {
      const fileNames = previewFiles.map(f => f.name).join(', ');
      onFileSelect(`\ud83d\udcce Shared files: ${fileNames}`);
      setPreviewFiles([]);
      onClose();
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video_file';
    if (type.startsWith('audio/')) return 'audio_file';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('document')) return 'description';
    return 'insert_drive_file';
  };

  if (!isOpen) return null;

  return (
    <div className="file-share-overlay" onClick={onClose}>
      <div className="file-share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-share-header">
          <h3>Share Files</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drop-zone-content">
            <div className="drop-icon">cloud_upload</div>
            <p>Drag & drop files here or click to browse</p>
            <p className="drop-hint">Images, videos, audio, documents (Max 10MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />
          <button 
            className="browse-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </button>
        </div>

        {previewFiles.length > 0 && (
          <div className="file-preview-section">
            <h4>Files to Share ({previewFiles.length})</h4>
            <div className="file-preview-list">
              {previewFiles.map((file) => (
                <div key={file.id} className="file-preview-item">
                  {file.preview ? (
                    <img src={file.preview} alt={file.name} className="file-preview-image" />
                  ) : (
                    <div className="file-preview-icon">
                      <span>{getFileIcon(file.type)}</span>
                    </div>
                  )}
                  <div className="file-preview-info">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{file.size}</p>
                  </div>
                  <button 
                    className="remove-file-btn"
                    onClick={() => removeFile(file.id)}
                  >
                    close
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="file-share-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className={`send-btn ${previewFiles.length > 0 ? 'active' : ''}`}
            onClick={sendFiles}
            disabled={previewFiles.length === 0}
          >
            Send {previewFiles.length > 0 && `(${previewFiles.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileShare;
