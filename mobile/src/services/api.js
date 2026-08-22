import {API_URL, USER_TOKEN} from '../config';

async function request(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {'x-user-token': USER_TOKEN},
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }
  return response.json();
}

export async function getChannels() {
  const data = await request('/api/channels');
  return data.channels ?? [];
}
