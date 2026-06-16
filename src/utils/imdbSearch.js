const IMDB_SUGGESTS_BASE = 'https://v2.sg.media-imdb.com/suggests';

let activeRequestId = 0;

export function cleanSearchQuery(searchQuery) {
  return searchQuery
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function parseImdbResults(data) {
  const payload = data?.d
    ? data
    : (data?.contents ? JSON.parse(data.contents || '{}') : data);

  const results = [];
  if (payload?.d) {
    payload.d.forEach(item => {
      if (item.id && item.id.startsWith('tt')) {
        const img = item.i?.imageUrl
          || (Array.isArray(item.i) ? item.i[0] : '')
          || '';

        results.push({
          id: item.id,
          t: item.l || 'Unknown',
          y: String(item.y || ''),
          s: item.s || '',
          type: item.qid || 'movie',
          img
        });
      }
    });
  }
  return results;
}

export function fetchImdbSuggestions(searchQuery) {
  const queryClean = cleanSearchQuery(searchQuery);
  if (!queryClean) {
    return Promise.resolve([]);
  }

  const requestId = ++activeRequestId;

  return new Promise((resolve, reject) => {
    const callbackName = `imdb$${queryClean}`;
    const firstChar = queryClean[0];
    const scriptUrl = `${IMDB_SUGGESTS_BASE}/${encodeURIComponent(firstChar)}/${encodeURIComponent(queryClean)}.json`;

    let script;
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (script?.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (Object.prototype.hasOwnProperty.call(window, callbackName)) {
        delete window[callbackName];
      }
    };

    window[callbackName] = (data) => {
      if (requestId !== activeRequestId) {
        return;
      }
      cleanup();
      resolve(parseImdbResults(data));
    };

    script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => {
      if (requestId !== activeRequestId) {
        return;
      }
      cleanup();
      reject(new Error('IMDb search request failed'));
    };

    timeoutId = setTimeout(() => {
      if (requestId !== activeRequestId) {
        return;
      }
      cleanup();
      reject(new Error('IMDb search timed out'));
    }, 10000);

    document.head.appendChild(script);
  });
}
