import { useEffect, useMemo, useState } from 'react';
import ReactPlayer from 'react-player';
import { getChannels, getPlaylist, getStreamUrl } from './services/api';
import { parseM3U } from './utils/m3uParser';
import './App.css';

function App() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadChannels() {
      setLoading(true);
      setError('');
      try {
        let data = await getChannels();
        if (!data.length) data = parseM3U(await getPlaylist());
        if (active) {
          setChannels(data);
          setSelectedChannel(data[0] || null);
        }
      } catch (err) {
        if (active) setError(err.message || 'No se pudieron cargar los canales.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadChannels();
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => ['Todos', ...new Set(channels.map((channel) => channel.group || 'General'))], [channels]);
  const filteredChannels = useMemo(() => channels.filter((channel) => {
    const matchesQuery = (channel.title || '').toLowerCase().includes(query.toLowerCase());
    const matchesGroup = group === 'Todos' || (channel.group || 'General') === group;
    return matchesQuery && matchesGroup;
  }), [channels, group, query]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div><p className="eyebrow">TV STREAMING</p><h1>PK TV</h1></div>
        <span className="status-pill">{channels.length} canales</span>
      </header>
      <section className="content-grid">
        <aside className="channel-panel">
          <div className="toolbar">
            <input aria-label="Buscar canal" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal..." />
            <select aria-label="Filtrar por grupo" value={group} onChange={(event) => setGroup(event.target.value)}>
              {groups.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          {loading && <p className="message">Cargando canales...</p>}
          {error && <p className="message error">{error}</p>}
          {!loading && !error && filteredChannels.length === 0 && <p className="message">No hay canales para este filtro.</p>}
          <div className="channel-list">
            {filteredChannels.map((channel) => (
              <button className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`} key={channel.id || channel.url} onClick={() => setSelectedChannel(channel)}>
                {channel.logo ? <img src={channel.logo} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="channel-fallback">TV</span>}
                <span><strong>{channel.title}</strong><small>{channel.group || 'General'}</small></span>
              </button>
            ))}
          </div>
        </aside>
        <section className="player-panel">
          <div className="player-heading"><div><p className="eyebrow">EN VIVO</p><h2>{selectedChannel?.title || 'Selecciona un canal'}</h2></div>{selectedChannel?.group && <span className="group-label">{selectedChannel.group}</span>}</div>
          <div className="player-frame">
            {selectedChannel ? <ReactPlayer className="player" url={getStreamUrl(selectedChannel)} controls playing width="100%" height="100%" /> : <p className="message">Selecciona un canal para comenzar.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
