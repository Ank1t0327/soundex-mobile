import React, { useEffect, useRef } from 'react';

function Player({ url, title, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const container = containerRef.current;
    const enterFullscreen = async () => {
      if (!container) return;

      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }
      } catch {
        // Fullscreen may be blocked until user interaction; playback still works.
      }
    };

    enterFullscreen();

    if (window.screen.orientation?.lock) {
      window.screen.orientation.lock('landscape').catch(() => {});
    }

    return () => {
      document.body.style.overflow = '';

      if (window.screen.orientation?.unlock) {
        window.screen.orientation.unlock();
      }

      const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      if (exitFullscreen && (document.fullscreenElement || document.webkitFullscreenElement)) {
        exitFullscreen.call(document).catch(() => {});
      }
    };
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handleOpenSameTab = () => {
    window.location.assign(url);
  };

  return (
    <div className="player-overlay" ref={containerRef}>
      <div className="player-toolbar">
        <span className="player-title">{title}</span>
        <button type="button" className="player-close" onClick={handleClose} aria-label="Close player">
          ✕
        </button>
      </div>
      <iframe
        className="player-frame"
        src={url}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="origin"
      />
      <button type="button" className="player-fallback" onClick={handleOpenSameTab}>
        Player not loading? Tap to open
      </button>
    </div>
  );
}

export default Player;
