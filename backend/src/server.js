require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const USER_TOKEN = process.env.USER_TOKEN || 'token-secreto-123';

const M3U_FUENTES = (process.env.M3U_URLS || 'https://m3u.cl/lista/CL.m3u,./lista/dragonball.m3u')
    .split(',')
    .map(fuente => fuente.trim());

let canales = [];

app.use(express.static('public'));

async function cargarCanales() {
    console.log('--- INICIANDO CARGA DE LISTAS M3U ---');
    console.log('Fuentes detectadas:', M3U_FUENTES);

    let canalesTemporales = [];

    for (const fuente of M3U_FUENTES) {
        const rutaOUrl = fuente.trim();
        if (!rutaOUrl) continue;

        console.log(`\n🔍 Procesando fuente: "${rutaOUrl}"`);

        try {
            let contenido = '';

            if (rutaOUrl.startsWith('http://') || rutaOUrl.startsWith('https://')) {
                const response = await axios.get(rutaOUrl, { 
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                contenido = response.data;
            } else {
                const rutaAbsoluta = path.resolve(__dirname, rutaOUrl);
                console.log(`📂 Buscando archivo en ruta absoluta: ${rutaAbsoluta}`);
                contenido = await fs.readFile(rutaAbsoluta, 'utf-8');
            }

            contenido = contenido.replace(/^\uFEFF/, '');
            const lineas = contenido.split(/\r?\n/);
            
            let canalActual = {};
            let contadorFuente = 0;

            lineas.forEach(linea => {
                linea = linea.trim();
                if (linea.toUpperCase().startsWith('#EXTINF')) {
                    canalActual.info = linea;
                } else if (linea.startsWith('http://') || linea.startsWith('https://')) {
                    canalActual.url = linea;
                    if (!canalActual.info) {
                        canalActual.info = `#EXTINF:-1, Canal ${canalesTemporales.length + 1}`;
                    }
                    canalesTemporales.push({ ...canalActual });
                    canalActual = {};
                    contadorFuente++;
                }
            });

            console.log(`✅ Canales extraídos de esta fuente: ${contadorFuente}`);

        } catch (error) {
            console.error(`❌ Error en "${rutaOUrl}":`, error.message);
        }
    }

    canales = canalesTemporales;
    console.log(`\n🎉 TOTAL CANALES CARGADOS: ${canales.length}\n------------------------------------`);
}

app.get(`/playlist/${USER_TOKEN}.m3u`, (req, res) => {
    const hostBase = `${req.protocol}://${req.get('host')}`;
    let m3uContent = '#EXTM3U\n';

    canales.forEach(canal => {
        m3uContent += `${canal.info}\n`;
        m3uContent += `${hostBase}/proxy/${encodeURIComponent(canal.url)}\n`; 
    });

    res.header('Content-Type', 'audio/x-mpegurl');
    res.send(m3uContent);
});

const streamProxy = createProxyMiddleware({
    target: 'http://localhost',
    router: function(req) {
        try {
            const rawUrl = req.originalUrl.replace(/^\/proxy\//, '');
            return new URL(decodeURIComponent(rawUrl)).origin;
        } catch (e) {
            return 'http://localhost';
        }
    },
    pathRewrite: function(path, req) {
        try {
            const rawUrl = req.originalUrl.replace(/^\/proxy\//, '');
            const url = new URL(decodeURIComponent(rawUrl));
            return url.pathname + url.search;
        } catch (e) {
            return path;
        }
    },
    changeOrigin: true,
    secure: false,
    onProxyRes: function (proxyRes) {
        delete proxyRes.headers['access-control-allow-origin'];
        delete proxyRes.headers['access-control-allow-methods'];
        
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    },
    onError: function(err, req, res) {
        console.error('⚠️ Falló la conexión al canal:', err.message);
        if (!res.headersSent) res.status(500).send('Error en el stream');
    }
});

app.use('/proxy', (req, res, next) => {
    try {
        const rawUrl = req.originalUrl.replace(/^\/proxy\//, '');
        const urlLimpia = decodeURIComponent(rawUrl);
        new URL(urlLimpia);
        streamProxy(req, res, next);
    } catch (error) {
        res.status(400).send('URL inválida ignorada');
    }
});

app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    await cargarCanales();
});