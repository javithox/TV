import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { getListas } from './services/api';
import { parseM3U } from './utils/m3uParser';

function App() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    async function loadChannels() {
      try {
        const m3uData = await getListas();
        const parsedChannels = parseM3U(m3uData);
        setChannels(parsedChannels);
        if (parsedChannels.length > 0) {
          setSelectedChannel(parsedChannels[0]);
        }
      } catch (err) {
        console.error('No se pudieron cargar los canales');
      }
    }
    loadChannels();
  }, []);

  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif', padding: '20px' }}>
      {/* Panel izquierdo: Lista de reproducciones */}
      <div style={{ width: '30%', borderRight: '1px solid #ccc', paddingRight: '15px' }}>
        <h2>Lista PK TV</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {channels.map((channel, idx) => (
            <li
              key={idx}
              onClick={() => setSelectedChannel(channel)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: selectedChannel === channel ? '#007bff' : '#f0f0f0',
                color: selectedChannel === channel ? '#fff' : '#000',
                marginBottom: '5px',
                borderRadius: '4px'
              }}
            >
              {channel.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Panel derecho: Reproductor de Video */}
      <div style={{ width: '70%', paddingLeft: '20px' }}>
        <h2>{selectedChannel ? selectedChannel.title : 'Selecciona un canal'}</h2>
        {selectedChannel && (
          <ReactPlayer
            url={selectedChannel.url}
            controls
            playing
            width="100%"
            height="480px"
          />
        )}
      </div>
    </div>
  );
}

export default App;