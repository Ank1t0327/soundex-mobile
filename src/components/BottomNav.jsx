import React from 'react';

function BottomNav({ onHistoryClick, onWatchlistClick, onInstallClick }) {
  return (
    <div className="bottom-nav">
      <button className="nav-btn" onClick={onWatchlistClick}>
        ★ WATCH LIST
      </button>
      <button className="nav-btn" onClick={onHistoryClick}>
        🕒 HISTORY
      </button>
      {onInstallClick && (
        <button className="nav-btn nav-btn-install" onClick={onInstallClick}>
          ⬇ INSTALL
        </button>
      )}
    </div>
  );
}

export default BottomNav;
