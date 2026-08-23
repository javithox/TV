require('dotenv').config();
require('dotenv').config({
  path: '.env.local',
  override: false
});

const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const PORT = Number(process.env.PORT || 3000);
const USER_TOKEN = process.env.USER_TOKEN;

if (!USER_TOKEN) {
  console.warn('⚠️ USER_TOKEN no está configurado.');
}

const M3U_FUENTES = (
  process.env.M3U_URLS ||
  [
    'https://iptv-org.github.io/iptv/countries/cl.m3u',
    'https://m3u.cl/lista/CL.m3u'
  ].join(',')
)
  .split(',')
  .map(f => f.trim())
  .filter(Boolean);

const LOCAL_LISTA_DIR = path.join(__dirname, 'src', 'lista');

let canales = [];
const allowedHosts = new Set();

app.use(express.json());

// Servir public/
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Parsear M3U
 */
function parseM3U(contenido, source) {
  const result = [];

  const lines = contenido
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/);

  let info = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) continue;

    if (line.toUpperCase().startsWith('#EXTINF')) {
      info = line;
      continue;
    }

    if (/^https?:\/\//i.test(line)) {
      const match = info?.match(/#EXTINF:[^,]*,(.*)$/i);

      const title =
        match?.[1]?.trim() ||
        `Canal ${result.length + 1}`;

      const attr = (name) => {
        const regex = new RegExp(
          `${name}="([^"]*)"`,
          'i'
        );

        const m = info?.match(regex);

        return m ? m[1] : '';
      };

      try {
        const url = new URL(line);

        allowedHosts.add(url.hostname);

        result.push({
          id: crypto
            .createHash('sha1')
            .update(`${source}|${line}`)
            .digest('hex')
            .slice(0, 16),

          title,

          url: line,

          group:
            attr('group-title') ||
            'Sin categoría',

          logo:
            attr('tvg-logo') ||
            '',

          tvgId:
            attr('tvg-id') ||
            '',

          source,

          info:
            info ||
            `#EXTINF:-1,${title}`
        });

      } catch (error) {
        console.warn(
          `⚠️ URL inválida ignorada: ${line}`
        );
      }

      info = null;
    }
  }

  return result;
}

/**
 * Cargar M3U locales desde src/lista
 */
async function cargarListasLocales() {
  const result = [];

  try {
    await fs.mkdir(LOCAL_LISTA_DIR, {
      recursive: true
    });

    const archivos = await fs.readdir(
      LOCAL_LISTA_DIR,
      {
        withFileTypes: true
      }
    );

    for (const archivo of archivos) {
      if (!archivo.isFile()) continue;

      const ext = path
        .extname(archivo.name)
        .toLowerCase();

      if (ext !== '.m3u' && ext !== '.m3u8') {
        continue;
      }

      const ruta = path.join(
        LOCAL_LISTA_DIR,
        archivo.name
      );

      try {
        const contenido =
          await fs.readFile(
            ruta,
            'utf8'
          );

        const parsed =
          parseM3U(
            contenido,
            ruta
          );

        result.push(...parsed);

        console.log(
          `📁 ${archivo.name}: ${parsed.length} canales`
        );

      } catch (error) {
        console.error(
          `❌ ${archivo.name}: ${error.message}`
        );
      }
    }

  } catch (error) {
    console.error(
      `❌ Error leyendo ${LOCAL_LISTA_DIR}: ${error.message}`
    );
  }

  return result;
}

/**
 * Descargar listas remotas
 */
async function cargarCanales() {
  const temporales = [];

  console.log('🌐 Cargando listas M3U...');

  for (const fuente of M3U_FUENTES) {
    try {
      let contenido = '';

      if (/^https?:\/\//i.test(fuente)) {

        console.log(`⬇️ Descargando: ${fuente}`);

        const response = await axios.get(
          fuente,
          {
            timeout: 30000,
            responseType: 'text',
            maxContentLength:
              100 * 1024 * 1024,

            headers: {
              'User-Agent':
                'Mozilla/5.0 TV-App/1.0'
            }
          }
        );

        contenido = response.data;

      } else {

        contenido =
          await fs.readFile(
            path.resolve(
              __dirname,
              fuente
            ),
            'utf8'
          );
      }

      const parsed =
        parseM3U(
          contenido,
          fuente
        );

      temporales.push(...parsed);

      console.log(
        `✅ ${fuente}: ${parsed.length} canales`
      );

    } catch (error) {

      console.error(
        `❌ Error en ${fuente}: ${error.message}`
      );
    }
  }

  // Listas locales
  const locales =
    await cargarListasLocales();

  temporales.push(...locales);

  // Eliminar duplicados
  const vistos = new Set();

  canales = temporales.filter(canal => {

    const key =
      `${canal.title}|${canal.url}`;

    if (vistos.has(key)) {
      return false;
    }

    vistos.add(key);

    return true;
  });

  console.log(
    `🎉 TOTAL CANALES: ${canales.length}`
  );

  console.log(
    `🌐 HOSTS PERMITIDOS: ${allowedHosts.size}`
  );
}

/**
 * Autenticación
 */
function requireToken(req, res, next) {

  if (!USER_TOKEN) {
    return res.status(503).json({
      error:
        'USER_TOKEN no configurado en Render'
    });
  }

  const supplied =
    req.get('x-user-token') ||
    req.query.token;

  if (supplied !== USER_TOKEN) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  next();
}

/**
 * Construir playlist
 */
function buildPlaylist(req) {

  const hostBase =
    `${req.protocol}://${req.get('host')}`;

  return canales.map(canal => ({
    ...canal,

    playbackUrl:
      `${hostBase}/proxy/${encodeURIComponent(canal.url)}`
  }));
}

/**
 * Health check
 */
app.get('/health', (req, res) => {

  res.json({
    ok: true,
    channels: canales.length,
    service: 'PK TV API'
  });
});

/**
 * API canales
 */
app.get(
  '/api/channels',
  requireToken,
  (req, res) => {

    const playlist =
      buildPlaylist(req);

    res.json({
      success: true,
      total: playlist.length,
      channels: playlist
    });
  }
);

/**
 * API playlist
 */
app.get(
  '/api/playlist',
  requireToken,
  (req, res) => {

    const playlist =
      buildPlaylist(req);

    res.json({
      success: true,
      total: playlist.length,
      channels: playlist
    });
  }
);

/**
 * Categorías
 */
app.get(
  '/api/categories',
  requireToken,
  (req, res) => {

    const categories = [
      ...new Set(
        canales.map(
          c =>
            c.group ||
            'Sin categoría'
        )
      )
    ].sort();

    res.json({
      success: true,
      total: categories.length,
      categories
    });
  }
);

/**
 * Playlist M3U
 *
 * /playlist/TOKEN.m3u
 */
app.get(
  '/playlist/:token.m3u',
  (req, res) => {

    if (
      !USER_TOKEN ||
      req.params.token !== USER_TOKEN
    ) {
      return res
        .status(401)
        .send('No autorizado');
    }

    const hostBase =
      `${req.protocol}://${req.get('host')}`;

    let m3u = '#EXTM3U\n';

    for (const canal of canales) {

      m3u +=
        `${canal.info || `#EXTINF:-1,${canal.title}`}\n`;

      m3u +=
        `${hostBase}/proxy/${encodeURIComponent(canal.url)}\n`;
    }

    res
      .type('audio/x-mpegurl')
      .send(m3u);
  }
);

/**
 * Proxy de streams
 */
const streamProxy =
  createProxyMiddleware({

    target: 'http://localhost',

    router(req) {

      const raw =
        req.originalUrl
          .replace(/^\/proxy\//, '');

      const url =
        new URL(
          decodeURIComponent(raw)
        );

      if (
        !allowedHosts.has(
          url.hostname
        )
      ) {
        throw new Error(
          'Host no permitido'
        );
      }

      return url.origin;
    },

    pathRewrite(
      pathname,
      req
    ) {

      const raw =
        req.originalUrl
          .replace(/^\/proxy\//, '');

      const url =
        new URL(
          decodeURIComponent(raw)
        );

      return (
        `${url.pathname}${url.search}`
      );
    },

    changeOrigin: true,

    secure: true,

    onProxyRes(proxyRes) {

      proxyRes.headers[
        'access-control-allow-origin'
      ] = '*';

      proxyRes.headers[
        'access-control-allow-methods'
      ] = 'GET, OPTIONS';
    },

    onError(err, req, res) {

      console.error(
        '⚠️ Error de stream:',
        err.message
      );

      if (!res.headersSent) {
        res
          .status(502)
          .send('Error en el stream');
      }
    }
  });

app.use(
  '/proxy',
  (req, res, next) => {

    try {

      const raw =
        req.originalUrl
          .replace(/^\/proxy\//, '');

      const url =
        new URL(
          decodeURIComponent(raw)
        );

      if (
        !allowedHosts.has(
          url.hostname
        )
      ) {
        return res
          .status(403)
          .send('Host no permitido');
      }

      return streamProxy(
        req,
        res,
        next
      );

    } catch (error) {

      console.error(
        '❌ Proxy:',
        error.message
      );

      return res
        .status(400)
        .send('URL inválida');
    }
  }
);

/**
 * Arrancar servidor
 *
 * IMPORTANTE PARA RENDER:
 * 0.0.0.0
 * process.env.PORT
 */
app.listen(
  PORT,
  '0.0.0.0',
  async () => {

    console.log(
      `🚀 PK TV API escuchando en puerto ${PORT}`
    );

    console.log(
      `📺 Fuentes configuradas: ${M3U_FUENTES.length}`
    );

    try {

      await cargarCanales();

    } catch (error) {

      console.error(
        '❌ Error cargando canales:',
        error.message
      );
    }
  }
);