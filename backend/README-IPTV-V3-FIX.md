# TV Android Ready V3 — Backend corregido

Ejecutar:

    node --check server.js
    node server.js

Endpoints:
- GET /health
- GET /api/playlist?token=TU_USER_TOKEN
- GET /api/channels?token=TU_USER_TOKEN
- GET /api/categories?token=TU_USER_TOKEN
- GET /playlist/TU_USER_TOKEN.m3u

Fuentes remotas incluidas:
- https://iptv-org.github.io/iptv/countries/cl.m3u
- https://m3u.cl/lista/CL.m3u

También carga automáticamente `backend/src/lista/*.m3u` y `*.m3u8`.


## Token conectado al frontend

La app móvil y la interfaz web de este paquete ya usan el mismo USER_TOKEN definido en `backend/.env` para autenticarse contra el backend. No publiques este token en repositorios públicos.
