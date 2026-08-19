require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const USER_TOKEN = process.env.USER_TOKEN || '';
const M3U_FUENTES = (process.env.M3U_URLS || './lista/dbz.m3u,./lista/ DragonBallSuper.m3u').split(',').map((value) => value.trim()).filter(Boolean);
const ALLOWED_HOSTS = new Set((process.env.STREAM_ALLOWED_HOSTS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));

let canales = [];
let lastLoadedAt = null;

function isAuthorized(req) {
  if (!USER_TOKEN) return true;
  const token = req.get('x-api-token') || req.query.token || '';
  return token === USER_TOKEN;
}

function requireAuth(req, res, next) {
  if (isAuthorized(req)) return next();
  return res.status(401).json({ error: 'Token inválido o ausente' });
}

function isAllowedUrl(value) {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return ALLOWED_HOSTS.size === 0 || ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function parseM3U(content) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim());
  const result = [];
  let pending = null;
  for (const line of lines) {
    if (!line) continue;
    if (line.toUpperCase().startsWith('#EXTINF')) {
      const commaIndex = line.indexOf(',');
      const metadata = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
      const title = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : 'Canal';
      const getAttribute = (name) => {
        const match = metadata.match(new RegExp(`${name}="([^"]*)"`, 'i'));
        return match ? match[1] : '';
      };
      pending = { title: getAttribute('tvg-name') || title || 'Canal', logo: getAttribute('tvg-logo'), group: getAttribute('group-title') || 'General' };
    } else if (/^https?:\/\//i.test(line)) {
      if (isAllowedUrl(line)) result.push({ id: String(result.length + 1), ...(pending || { title: `Canal ${result.length + 1}`, logo: '', group: 'General' }), sourceUrl: line });
      pending = null;
    }
  }
  return result;
}

async function loadSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await axios.get(source, { timeout: 15000, responseType: 'text', headers: { 'User-Agent': 'PK-TV/1.0' } });
    return response.data;
  }
  return fs.readFile(path.resolve(__dirname, source), 'utf8');
}

async function cargarCanales() {
  const loaded = [];
  for (const source of M3U_FUENTES) {
    try {
      loaded.push(...parseM3U(await loadSource(source)));
    } catch (error) {
      console.error(`No se pudo cargar ${source}: ${error.message}`);
    }
  }
  canales = loaded.map((channel, index) => ({ ...channel, id: String(index + 1) }));
  lastLoadedAt = new Date().toISOString();
  console.log(`Canales cargados: ${canales.length}`);
}

function channelById(id) {
  return canales.find((channel) => channel.id === String(id));
}

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/api/v1/health', (_req, res) => res.json({ ok: true, channels: canales.length, lastLoadedAt }));

app.get('/api/v1/channels', requireAuth, (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({ channels: canales.map(({ sourceUrl, ...channel }) => ({ ...channel, playbackUrl: `${base}/api/v1/stream/${channel.id}${USER_TOKEN ? `?token=${encodeURIComponent(USER_TOKEN)}` : ''}` })) });
});

app.get('/api/v1/stream/:id', requireAuth, async (req, res) => {
  const channel = channelById(req.params.id);
  if (!channel || !isAllowedUrl(channel.sourceUrl)) return res.status(404).json({ error: 'Canal no encontrado' });
  try {
    const upstream = await axios.get(channel.sourceUrl, { responseType: 'stream', timeout: 20000, maxContentLength: Infinity, maxBodyLength: Infinity, headers: { 'User-Agent': 'PK-TV/1.0', Accept: '*/*' } });
    if (upstream.headers['content-type']) res.setHeader('Content-Type', upstream.headers['content-type']);
    if (upstream.headers['cache-control']) res.setHeader('Cache-Control', upstream.headers['cache-control']);
    res.status(upstream.status);
    upstream.data.on('error', (error) => { if (!res.headersSent) res.status(502); console.error(`Error de stream ${channel.id}: ${error.message}`); });
    req.on('close', () => upstream.data.destroy());
    upstream.data.pipe(res);
  } catch (error) {
    if (!res.headersSent) res.status(502).json({ error: 'No se pudo conectar con el stream' });
  }
});

app.get('/playlist.m3u', requireAuth, (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const lines = ['#EXTM3U'];
  for (const channel of canales) {
    lines.push(`#EXTINF:-1 tvg-name="${channel.title.replaceAll('"', '')}" tvg-logo="${channel.logo || ''}" group-title="${channel.group.replaceAll('"', '')}",${channel.title}`);
    lines.push(`${base}/api/v1/stream/${channel.id}${USER_TOKEN ? `?token=${encodeURIComponent(USER_TOKEN)}` : ''}`);
  }
  res.type('audio/x-mpegurl').send(`${lines.join('\n')}\n`);
});

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, async () => {
  console.log(`Servidor PK TV escuchando en http://localhost:${PORT}`);
  await cargarCanales();
});
