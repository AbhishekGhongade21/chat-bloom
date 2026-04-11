import React, { useState } from 'react';
import './ThemeSettings.css';

const ThemeSettings = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [customColors, setCustomColors] = useState({
    primary: currentTheme.primary || '#667eea',
    secondary: currentTheme.secondary || '#764ba2',
    background: currentTheme.background || '#1a1a2e',
    accent: currentTheme.accent || '#0f3460'
  });

  const wallpapers = [
    { id: 1, name: 'Gradient Purple', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 2, name: 'Ocean Blue', preview: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' },
    { id: 3, name: 'Sunset Orange', preview: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 4, name: 'Forest Green', preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    { id: 5, name: 'Galaxy', preview: 'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)' },
    { id: 6, name: 'Midnight', preview: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' }
  ];

  const colorPresets = [
    { name: 'Purple Dream', primary: '#667eea', secondary: '#764ba2' },
    { name: 'Ocean Blue', primary: '#2196F3', secondary: '#1976D2' },
    { name: 'Sunset', primary: '#ff6b6b', secondary: '#feca57' },
    { name: 'Forest', primary: '#11998e', secondary: '#38ef7d' },
    { name: 'Galaxy', primary: '#654ea3', secondary: '#eaafc8' },
    { name: 'Monochrome', primary: '#2c3e50', secondary: '#34495e' }
  ];

  const handleColorChange = (colorType, value) => {
    setCustomColors(prev => ({ ...prev, [colorType]: value }));
  };

  const applyCustomTheme = () => {
    onThemeChange({
      ...currentTheme,
      ...customColors,
      custom: true
    });
    onClose();
  };

  const applyWallpaper = (wallpaper) => {
    onThemeChange({
      ...currentTheme,
      wallpaper: wallpaper.preview,
      wallpaperName: wallpaper.name
    });
  };

  const resetTheme = () => {
    setCustomColors({
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#1a1a2e',
      accent: '#0f3460'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="theme-settings-overlay" onClick={onClose}>
      <div className="theme-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Theme Settings</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            Colors
          </button>
          <button
            className={`tab-btn ${activeTab === 'wallpapers' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallpapers')}
          >
            Wallpapers
          </button>
          <button
            className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Presets
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'colors' && (
            <div className="colors-section">
              <div className="color-customizer">
                <div className="color-input-group">
                  <label>Primary Color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={customColors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={customColors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="color-text"
                      placeholder="#667eea"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label>Secondary Color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={customColors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={customColors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="color-text"
                      placeholder="#764ba2"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label>Background Color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={customColors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={customColors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="color-text"
                      placeholder="#1a1a2e"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label>Accent Color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={customColors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="color-text"
                      placeholder="#0f3460"
                    />
                  </div>
                </div>
              </div>

              <div className="color-actions">
                <button className="reset-btn" onClick={resetTheme}>Reset</button>
                <button className="apply-btn" onClick={applyCustomTheme}>Apply</button>
              </div>
            </div>
          )}

          {activeTab === 'wallpapers' && (
            <div className="wallpapers-section">
              <div className="wallpapers-grid">
                {wallpapers.map((wallpaper) => (
                  <div
                    key={wallpaper.id}
                    className="wallpaper-item"
                    onClick={() => applyWallpaper(wallpaper)}
                    style={{ background: wallpaper.preview }}
                  >
                    <div className="wallpaper-overlay">
                      <span className="wallpaper-name">{wallpaper.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="presets-section">
              <div className="presets-grid">
                {colorPresets.map((preset, index) => (
                  <div
                    key={index}
                    className="preset-item"
                    onClick={() => {
                      setCustomColors({
                        primary: preset.primary,
                        secondary: preset.secondary,
                        background: '#1a1a2e',
                        accent: '#0f3460'
                      });
                    }}
                  >
                    <div className="preset-preview">
                      <div
                        className="preset-gradient"
                        style={{
                          background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                        }}
                      ></div>
                    </div>
                    <span className="preset-name">{preset.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
