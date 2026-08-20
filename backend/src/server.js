const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const USER_TOKEN = process.env.USER_TOKEN || '';
const M3U_FUENTES = (process.env.M3U_URLS || 'https://m3u.cl/lista/total.m3u').split(',').map((item) => item.trim()).filter(Boolean);
let canales = [];

function parseM3U(content) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim());
  const result = [];
  let pending = null;
  for (const line of lines) {
    if (!line) continue;
    if (line.toUpperCase().startsWith('#EXTINF')) {
      const comma = line.indexOf(',');
      const attributes = {};
      const pattern = /([\w-]+)="([^"]*)"/g;
      let match;
      while ((match = pattern.exec(line)) !== null) attributes[match[1]] = match[2];
      pending = { info: line, title: comma >= 0 ? line.slice(comma + 1).trim() : attributes['tvg-name'] || 'Canal' };
    } else if (/^https?:\/\//i.test(line)) {
      result.push({ id: String(result.length + 1), ...(pending || { info: '#EXTINF:-1,Canal', title: `Canal ${result.length + 1}` }), url: line });
      pending = null;
    }
  }
  return result;
}

async function loadChannels() {
  const loaded = [];
  for (const source of M3U_FUENTES) {
    try {
      const content = /^https?:\/\//i.test(source)
        ? (await axios.get(source, { timeout: 30000, headers: { 'User-Agent': 'PK-TV/1.0' } })).data
        : await fs.readFile(path.resolve(__dirname, source), 'utf8');
      loaded.push(...parseM3U(content));
    } catch (error) {
      console.error(`Error cargando ${source}: ${error.message}`);
    }
  }
  canales = loaded.map((channel, index) => ({ ...channel, id: String(index + 1) }));
  console.log(`Canales cargados: ${canales.length}`);
}

function authorized(req) {
  return !USER_TOKEN || req.get('x-api-token') === USER_TOKEN || req.query.token === USER_TOKEN;
}
function auth(req, res, next) {
  if (authorized(req)) return next();
  return res.status(401).send('Token inválido o ausente');
}

app.disable('x-powered-by');
app.use(express.static(path.resolve(__dirname, '../public')));
app.get('/health', (_req, res) => res.json({ ok: true, channels: canales.length }));
app.get(`/playlist/${USER_TOKEN}.m3u`, auth, (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const lines = ['#EXTM3U'];
  for (const channel of canales) {
    lines.push(channel.info);
    lines.push(`${host}/proxy/${encodeURIComponent(channel.url)}`);
  }
  res.type('audio/x-mpegurl').send(`${lines.join('\n')}\n`);
});

const proxy = createProxyMiddleware({
  target: 'http://localhost',
  changeOrigin: true,
  secure: false,
  router: (req) => {
    const raw = decodeURIComponent(req.originalUrl.replace(/^\/proxy\//, ''));
    return new URL(raw).origin;
  },
  pathRewrite: (requestPath, req) => {
    const raw = decodeURIComponent(req.originalUrl.replace(/^\/proxy\//, ''));
    const parsed = new URL(raw);
    return `${parsed.pathname}${parsed.search}`;
  },
  onProxyRes: (proxyRes) => { proxyRes.headers['access-control-allow-origin'] = '*'; },
});
app.use('/proxy', auth, (req, res, next) => {
  try { new URL(decodeURIComponent(req.originalUrl.replace(/^\/proxy\//, ''))); proxy(req, res, next); }
  catch { res.status(400).send('URL inválida'); }
});

app.listen(PORT, async () => {
  console.log(`PK TV API en http://localhost:${PORT}`);
  await loadChannels();
});
