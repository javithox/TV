import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://192.168.18.239:3000').replace(/\/$/, '');
const USER_TOKEN = import.meta.env.VITE_USER_TOKEN || 'token-secreto-123';

const http = axios.create({ baseURL: API_URL, timeout: 30000 });

export async function getListas() {
  const response = await http.get(`/playlist/${encodeURIComponent(USER_TOKEN)}.m3u`);
  return response.data;
}

export { API_URL };
