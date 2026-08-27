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

async function post(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'x-user-token': USER_TOKEN},
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `API ${response.status}`);
  return data;
}

export async function getChannels() {
  const data = await request('/api/channels');
  return data.channels ?? [];
}

export async function addSource(url) {
  return post('/api/sources', {url});
}
