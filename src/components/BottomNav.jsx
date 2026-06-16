import React from 'react';

function BottomNav({ onHistoryClick, onWatchlistClick }) {
  return (
    <div className="bottom-nav">
      <button className="nav-btn" onClick={onWatchlistClick}>
        ★ WATCH LIST
      </button>
      <button className="nav-btn" onClick={onHistoryClick}>
        🕒 HISTORY
      </button>
    </div>
  );
}

export default BottomNav;
