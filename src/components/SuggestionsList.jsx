import React from 'react';

function SuggestionsList({ suggestions, onSelect }) {
  return (
    <div className="suggestions-list">
      {suggestions.map((item, index) => (
        <div
          key={index}
          className="suggestion-item"
          onClick={() => onSelect(item)}
        >
          {item.t} {item.y && `(${item.y})`}
        </div>
      ))}
    </div>
  );
}

export default SuggestionsList;
