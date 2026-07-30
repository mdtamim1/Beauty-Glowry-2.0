import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

const NoteSuggestionField = ({ value, onChange, onSave, placeholder, label, type = 'customer' }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  // Load suggestions from localStorage
  useEffect(() => {
    const key = `notes_${type}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSuggestions(parsed.slice(0, 5));
      } catch (e) {
        console.error('Error loading suggestions:', e);
      }
    }
  }, [type]);

  // Auto-save note when changed
  const handleNoteChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle blur to save note
  const handleBlur = () => {
    setIsFocused(false);
    setShowSuggestions(false);
    if (value && value.trim()) {
      saveNoteToHistory(value);
    }
  };

  // Save note to history
  const saveNoteToHistory = (noteText) => {
    if (!noteText.trim()) return;

    const key = `notes_${type}`;
    const stored = localStorage.getItem(key);
    let existing = [];

    try {
      existing = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error parsing stored notes:', e);
    }

    // Avoid duplicates - only add if not already at the top
    if (existing[0] !== noteText) {
      const newList = [noteText, ...existing.filter(n => n !== noteText)].slice(0, 5);
      localStorage.setItem(key, JSON.stringify(newList));
      setSuggestions(newList);
    }
  };

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!value.trim() || !isFocused) return suggestions;
    return suggestions.filter(s =>
      s.toLowerCase().includes(value.toLowerCase())
    );
  }, [value, suggestions, isFocused]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions && filteredSuggestions.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowSuggestions(true);
      setSelectedIndex(0);
      return;
    }

    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        break;
      case 'Enter':
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          e.preventDefault();
          onChange(filteredSuggestions[selectedIndex]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setIsFocused(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .note-field-wrapper {
          position: relative;
        }

        .note-field-label {
          font-size: 11px;
          font-weight: 700;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 5px;
        }

        .note-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .note-textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1.5px solid #e2e8f0;
          border-radius: 6px;
          font-size: 12px;
          font-family: inherit;
          background: white;
          transition: all 0.2s ease;
          color: #2d3748;
          resize: vertical;
          min-height: 60px;
          padding-right: 32px;
        }

        .note-textarea:focus {
          outline: none;
          border-color: #1a365d;
          background: #f7fafc;
          box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.1);
        }

        .note-suggestions-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f4f8;
          border-radius: 4px;
          color: #1a365d;
          font-size: 12px;
          pointer-events: none;
          transition: all 0.2s ease;
        }

        .note-textarea:focus ~ .note-suggestions-icon {
          background: #1a365d;
          color: white;
        }

        .note-suggestions-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #cbd5e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .note-suggestion-item {
          padding: 10px 12px;
          border-bottom: 1px solid #f0f4f8;
          cursor: pointer;
          font-size: 12px;
          color: #4a5568;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .note-suggestion-item:last-child {
          border-bottom: none;
        }

        .note-suggestion-item:hover {
          background: #f7fafc;
          color: #1a365d;
        }

        .note-suggestion-item.selected {
          background: #e0ebf5;
          color: #1a365d;
          font-weight: 700;
        }

        .note-suggestion-item::before {
          content: '📌';
          flex-shrink: 0;
          font-size: 12px;
        }

        .note-suggestion-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .note-suggestion-hint {
          padding: 8px 12px;
          font-size: 10px;
          color: #a0aec0;
          text-align: center;
          font-style: italic;
        }

        .note-suggestions-dropdown::-webkit-scrollbar {
          width: 4px;
        }

        .note-suggestions-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }

        .note-suggestions-dropdown::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 2px;
        }

        .note-suggestions-dropdown::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      ` }} />

      <div className="note-field-wrapper">
        <label className="note-field-label">{label}</label>
        <div className="note-input-container">
          <textarea
            className="note-textarea"
            value={value}
            onChange={handleNoteChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (filteredSuggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={handleBlur}
            placeholder={placeholder}
          />
          {(isFocused && filteredSuggestions.length > 0) && (
            <div className="note-suggestions-icon">
              💡
            </div>
          )}
        </div>

        {showSuggestions && isFocused && filteredSuggestions.length > 0 && (
          <div className="note-suggestions-dropdown">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`note-suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="note-suggestion-text">{suggestion}</span>
              </div>
            ))}
            <div className="note-suggestion-hint">
              ↑ ↓ to navigate • Enter to select • Esc to close
            </div>
          </div>
        )}

        {isFocused && filteredSuggestions.length === 0 && suggestions.length === 0 && (
          <div className="note-suggestions-dropdown">
            <div className="note-suggestion-hint">
              Start typing or press ↓ to see suggestions
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteSuggestionField;
