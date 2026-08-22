import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USER_TOKEN = import.meta.env.VITE_USER_TOKEN || '';

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export function parseM3U(m3uText) {
  if (!m3uText || typeof m3uText !== 'string') return [];

  const channels = [];
  let currentChannel = {};

  const lines = m3uText.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.toUpperCase().startsWith('#EXTINF:')) {
      const commaIndex = line.indexOf(',');
      const metadata = commaIndex >= 0 ? line.slice(0, commaIndex) : line;

      currentChannel = {
        title: commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : 'Canal sin nombre',
        logo: metadata.match(/tvg-logo="([^"]*)"/i)?.[1] || '',
        group: metadata.match(/group-title="([^"]*)"/i)?.[1] || 'General',
      };
      continue;
    }

    if (/^https?:\/\//i.test(line)) {
      channels.push({
        id: `channel-${channels.length + 1}`,
        title: currentChannel.title || `Canal ${channels.length + 1}`,
        logo: currentChannel.logo || '',
        group: currentChannel.group || 'General',
        url: line,
        playbackUrl: line,
      });
      currentChannel = {};
    }
  }

  return channels;
}

export async function getListas() {
  // Ajuste para evitar error en caso de que VITE_USER_TOKEN no esté definido
  const token = USER_TOKEN || 'default_token';
  
  const response = await client.get(`/playlist/${encodeURIComponent(token)}.m3u`, {
    responseType: 'text' // <--- CRUCIAL: Fuerza a Axios a recibir texto plano en vez de JSON
  });

  return parseM3U(response.data);
}