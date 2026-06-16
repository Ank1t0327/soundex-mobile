import React from 'react';

function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Search movies and TV shows..."
        value={value}
        onChange={onChange}
        autoFocus
      />
    </div>
  );
}

export default SearchBar;
