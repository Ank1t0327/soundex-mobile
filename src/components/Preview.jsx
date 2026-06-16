import React, { useState } from 'react';

function Preview({ item, onPlay, onTrailer, onAddWatchlist }) {
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');

  return (
    <div className="preview">
      <h2 className="preview-title">
        {item.t} {item.y && `(${item.y})`}
      </h2>
      
      {item.s && (
        <p className="preview-desc">{item.s}</p>
      )}

      {item.type === 'tvSeries' && (
        <div className="tv-controls">
          <div className="tv-control-group">
            <label>Season:</label>
            <input
              type="number"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              min="1"
              data-season={season}
            />
          </div>
          <div className="tv-control-group">
            <label>Episode:</label>
            <input
              type="number"
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              min="1"
              data-episode={episode}
            />
          </div>
        </div>
      )}

      <div className="preview-buttons">
        <button className="btn btn-play" onClick={() => onPlay({ season, episode })}>
          ▶ PLAY
        </button>
        <button className="btn btn-trailer" onClick={onTrailer}>
          🎬 TRAILER
        </button>
        <button className="btn btn-watchlist" onClick={onAddWatchlist}>
          ★ LATER
        </button>
      </div>
    </div>
  );
}

export default Preview;
