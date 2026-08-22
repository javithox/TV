import { useEffect, useMemo, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { getListas } from './services/api';
import './App.css';

function App() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const activeBtnRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    getListas()
      .then((items) => {
        if (!mounted) return;
        if (!items || items.length === 0) {
          setError('La lista Dragon Ball Super está vacía o el token es incorrecto.');
          return;
        }
        setChannels(items);
        setSelectedChannel(items[0]);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError('No se pudieron cargar los episodios. Verifica el backend y el token.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return channels;
    return channels.filter((channel) => channel.title.toLowerCase().includes(normalizedQuery));
  }, [channels, query]);

  const handleFocus = (event) => {
    event.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Dragon Ball Super</h2>
        <p className="playlist-count">
          {loading ? 'Cargando episodios…' : `${channels.length} episodios disponibles`}
        </p>
        <input
          className="search-input focusable"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar episodio…"
          aria-label="Buscar episodio"
        />

        {error && <p className="error-msg">{error}</p>}

        <div className="channel-list">
          {filtered.map((channel) => {
            const isSelected = selectedChannel?.id === channel.id;
            return (
              <button
                key={channel.id}
                ref={isSelected ? activeBtnRef : null}
                onClick={() => setSelectedChannel(channel)}
                onFocus={handleFocus}
                className={`channel-btn focusable ${isSelected ? 'active' : ''}`}
              >
                {channel.title}
              </button>
            );
          })}
          {!loading && !error && filtered.length === 0 && (
            <p className="empty-msg">No hay episodios que coincidan con la búsqueda.</p>
          )}
        </div>
      </aside>

      <main className="main-content">
        <h3 className="player-title">{selectedChannel?.title || 'Selecciona un episodio'}</h3>
        <div className="player-wrapper">
          {selectedChannel ? (
            <ReactPlayer
              src={selectedChannel.playbackUrl || selectedChannel.url}
              controls
              playing
              width="100%"
              height="100%"
              playsInline
            />
          ) : (
            <p className="empty-msg">Sin episodio seleccionado</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
