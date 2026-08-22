import React, { useEffect, useMemo, useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { getListas } from './services/api'; // <--- Cambiado a getListas
import './App.css';

function App() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const activeBtnRef = useRef(null);

  useEffect(() => {
    // Llamamos directamente a getListas() que descarga y parsea el M3U
    getListas()
      .then((items) => {
        if (!items || items.length === 0) {
          setError('La lista M3U está vacía o el token es incorrecto.');
          return;
        }
        setChannels(items);
        setSelectedChannel(items[0]);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudieron cargar los canales. Verifica el token o el servidor.');
      });
  }, []);

  const filtered = useMemo(
    () => channels.filter(c => c.title.toLowerCase().includes(query.toLowerCase())),
    [channels, query]
  );

  const handleFocus = (e) => {
    e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>PK TV</h2>
        <input
          className="search-input focusable"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar canal..."
        />
        
        {error && <p className="error-msg">{error}</p>}

        <div className="channel-list">
          {filtered.map(channel => {
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
        </div>
      </aside>

      <main className="main-content">
        <h3 className="player-title">
          {selectedChannel?.title || 'Selecciona un canal'}
        </h3>
        
        <div className="player-wrapper">
          {selectedChannel ? (
            <ReactPlayer
              url={selectedChannel.playbackUrl || selectedChannel.url}
              controls
              playing
              width="100%"
              height="100%"
              config={{
                file: {
                  forceHLS: true
                }
              }}
            />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Sin señal seleccionada</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;