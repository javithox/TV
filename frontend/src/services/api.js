import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://10.0.2.2:3000').replace(/\/$/, '');
const USER_TOKEN = import.meta.env.VITE_USER_TOKEN || '';

const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json, text/plain, */*' },
});

export async function getChannels() {
  try {
    const response = await http.get('/api/v1/channels', {
      params: USER_TOKEN ? { token: USER_TOKEN } : undefined,
    });
    return Array.isArray(response.data) ? response.data : response.data.channels || [];
  } catch (error) {
    const detail = error.response?.data?.error || error.message || 'Error de red';
    throw new Error(`No se pudieron cargar los canales: ${detail}`);
  }
}

export async function getPlaylist() {
  const response = await http.get('/playlist.m3u', {
    params: USER_TOKEN ? { token: USER_TOKEN } : undefined,
    responseType: 'text',
  });
  return response.data;
}

export function getStreamUrl(channel) {
  if (!channel) return '';
  if (channel.playbackUrl) return channel.playbackUrl;
  if (channel.id) {
    const token = USER_TOKEN ? `?token=${encodeURIComponent(USER_TOKEN)}` : '';
    return `${API_URL}/api/v1/stream/${encodeURIComponent(channel.id)}${token}`;
  }
  return channel.url || '';
}

export { API_URL };
