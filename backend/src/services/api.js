import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USER_TOKEN = import.meta.env.VITE_USER_TOKEN || 'token-secreto-123';

export const getListas = async () => {
  try {
    const response = await axios.get(`${API_URL}/playlist/${USER_TOKEN}.m3u`);
    return response.data;
  } catch (error) {
    console.error('Error al descargar la lista M3U desde el backend:', error);
    throw error;
  }
};