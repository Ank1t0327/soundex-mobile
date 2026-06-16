import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import SearchBar from './components/SearchBar';
import SuggestionsList from './components/SuggestionsList';
import Preview from './components/Preview';
import BottomNav from './components/BottomNav';
import Modal from './components/Modal';
import Player from './components/Player';

function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready.');
  const [statusColor, setStatusColor] = useState('#666666');
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);
  const [playerUrl, setPlayerUrl] = useState(null);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const debounceTimer = useRef(null);
  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  const STORAGE_KEY_HISTORY = 'soundex_history';
  const STORAGE_KEY_WATCHLIST = 'soundex_watchlist';

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    const savedWatchlist = localStorage.getItem(STORAGE_KEY_WATCHLIST);

    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    let animationInterval;
    if (isLoading) {
      animationInterval = setInterval(() => {
        setSpinnerIdx(prev => (prev + 1) % spinnerChars.length);
      }, 100);
    }
    return () => clearInterval(animationInterval);
  }, [isLoading, spinnerChars.length]);

  const updateStatus = (text, color = '#888888') => {
    setStatus(text);
    setStatusColor(color);
  };

  const handleInstallPrompt = async () => {
    if (!installPromptEvent) {
      return;
    }

    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      if (choice.outcome === 'accepted') {
        updateStatus('App installed! Thank you.', '#2ecc71');
      } else {
        updateStatus('Install dismissed.', '#e67e22');
      }
    } catch (installError) {
      console.error('Install prompt failed:', installError);
      updateStatus('Install prompt unavailable.', '#e74c3c');
    } finally {
      setInstallPromptEvent(null);
      setIsInstallBannerVisible(false);
    }
  };

  useEffect(() => {
    const beforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      setIsInstallBannerVisible(true);
    };

    const appInstalled = () => {
      updateStatus('PWA installed!', '#2ecc71');
      setInstallPromptEvent(null);
      setIsInstallBannerVisible(false);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPrompt);
    window.addEventListener('appinstalled', appInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPrompt);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, []);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const parseImdbResults = (data) => {
    const payload = data?.d
      ? data
      : (data?.contents ? JSON.parse(data.contents || '{}') : data);

    const results = [];
    if (payload?.d) {
      payload.d.forEach(item => {
        if (item.id && item.id.startsWith('tt')) {
          results.push({
            id: item.id,
            t: item.l || 'Unknown',
            y: String(item.y || ''),
            s: item.s || '',
            type: item.qid || 'movie',
            img: item.i?.imageUrl || ''
          });
        }
      });
    }
    return results;
  };

  const fetchImdbSuggestions = async (searchQuery) => {
    const queryClean = searchQuery
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    if (!queryClean) {
      return [];
    }

    const firstChar = queryClean[0];
    const url = `https://v2.sg.media-imdb.com/suggestion/${encodeURIComponent(firstChar)}/${encodeURIComponent(queryClean)}.json`;

    try {
      const response = await axios.get(url, { timeout: 8000 });
      return parseImdbResults(response.data);
    } catch (primaryErr) {
      console.warn('Direct IMDb request failed, attempting proxies:', primaryErr?.message || primaryErr);

      const proxyBuilders = [
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
      ];

      for (const build of proxyBuilders) {
        const proxyUrl = build(url);
        try {
          const response = await axios.get(proxyUrl, { timeout: 9000 });
          return parseImdbResults(response.data);
        } catch (proxyErr) {
          console.warn('Proxy failed:', proxyUrl, proxyErr?.message || proxyErr);
        }
      }

      throw primaryErr;
    }
  };

  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setCurrentSelection(null);
      setIsLoading(false);
      updateStatus('Ready.', '#666666');
      return;
    }

    setIsLoading(true);
    updateStatus(`Searching ${spinnerChars[spinnerIdx]}`, '#4a90e2');

    try {
      const results = await fetchImdbSuggestions(searchQuery);
      setSuggestions(results);

      if (results.length > 0) {
        updateStatus('Matches found.', '#666666');
      } else {
        updateStatus('No matches found.', '#e74c3c');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      updateStatus('Error searching. Try again.', '#e74c3c');
    } finally {
      setIsLoading(false);
    }
  };

  const buildPlayUrl = (item, season = '1', episode = '1') => {
    let url = `https://playimdb.com/title/${item.id}/`;
    if (item.type === 'tvSeries') {
      url += `${season}/${episode}/`;
    }
    return url;
  };

  const handleSuggestionSelect = (item) => {
    setCurrentSelection(item);
    setQuery(item.t);
    setSuggestions([]);
  };

  const playMovie = ({ season = '1', episode = '1' } = {}) => {
    if (!currentSelection) return;

    const url = buildPlayUrl(currentSelection, season, episode);

    setHistory(prev => {
      const filtered = prev.filter(x => x.id !== currentSelection.id);
      return [currentSelection, ...filtered].slice(0, 20);
    });

    updateStatus('Opening stream...', '#2ecc71');
    setPlayerUrl(url);
  };

  const playTrailer = () => {
    if (!currentSelection) return;

    const trailerQuery = `${currentSelection.t} ${currentSelection.y} official trailer`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(trailerQuery)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const addToWatchlist = () => {
    if (!currentSelection) return;

    const isDuplicate = watchlist.some(item => item.id === currentSelection.id);
    if (isDuplicate) {
      updateStatus('Already in Watch List!', '#e67e22');
      return;
    }

    setWatchlist(prev => [currentSelection, ...prev]);
    updateStatus(`Added '${currentSelection.t}' to Watch List.`, '#e67e22');
  };

  const removeItem = (id, isHistory) => {
    if (isHistory) {
      setHistory(prev => prev.filter(x => x.id !== id));
    } else {
      setWatchlist(prev => prev.filter(x => x.id !== id));
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    setShowModal(null);
  };

  const loadFromList = (item) => {
    setCurrentSelection(item);
    setQuery(item.t);
    setSuggestions([]);
    setShowModal(null);
  };

  const closePlayer = () => {
    setPlayerUrl(null);
    updateStatus('Ready.', '#666666');
  };

  return (
    <div className="app">
      <div className="app-container">
        <div className="header">
          <h1 className="title">S O U N D E X</h1>
        </div>

        <div className="content">
          <SearchBar
            value={query}
            onChange={handleQueryChange}
          />

          {isInstallBannerVisible && (
            <div className="install-banner">
              <div className="install-banner-copy">
                Install Soundex for faster access and offline support.
              </div>
              <button className="btn btn-install" onClick={handleInstallPrompt}>
                INSTALL
              </button>
            </div>
          )}

          {suggestions.length > 0 && (
            <SuggestionsList
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
            />
          )}

          {currentSelection && (
            <Preview
              item={currentSelection}
              onPlay={playMovie}
              onTrailer={playTrailer}
              onAddWatchlist={addToWatchlist}
            />
          )}

          <div className="status-bar" style={{ color: statusColor }}>
            {isLoading && <span className="spinner">{spinnerChars[spinnerIdx]}</span>}
            {status}
          </div>
        </div>
      </div>

      <BottomNav
        onHistoryClick={() => setShowModal('history')}
        onWatchlistClick={() => setShowModal('watchlist')}
        onInstallClick={installPromptEvent ? handleInstallPrompt : undefined}
      />

      {showModal && (
        <Modal
          title={showModal === 'history' ? 'History' : 'Watch List'}
          data={showModal === 'history' ? history : watchlist}
          isHistory={showModal === 'history'}
          onClose={() => setShowModal(null)}
          onSelect={loadFromList}
          onRemove={removeItem}
          onClearHistory={showModal === 'history' ? clearAllHistory : null}
        />
      )}

      {playerUrl && currentSelection && (
        <Player
          url={playerUrl}
          title={currentSelection.t}
          onClose={closePlayer}
        />
      )}
    </div>
  );
}

export default App;
