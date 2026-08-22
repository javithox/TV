# TV IPTV — versión preparada para Android

Este ZIP contiene:
- `backend/`: backend Express actualizado con `/api/channels`, `/api/categories`, autenticación por token y proxy restringido a hosts de canales cargados.
- `frontend/`: frontend web conservado y actualizado para consumir `/api/channels`.
- `mobile/`: base de aplicación React Native para Android/Android TV con reproductor nativo `react-native-video`.

## Importante
El ZIP no incluye `node_modules`, secretos ni un APK ya compilado.

### Backend
1. `cd backend`
2. Copia `.env.example` a `.env` y cambia `USER_TOKEN`.
3. Ajusta `M3U_URLS`.
4. `npm install`
5. `npm start`

### Frontend web
1. `cd frontend`
2. Copia `.env.example` a `.env`
3. Configura `VITE_API_URL` y `VITE_USER_TOKEN`.
4. `npm install`
5. `npm run dev`

### Mobile
La carpeta `mobile` contiene el código JS y la configuración base. En este ZIP no se incluye `mobile/android/` generado por el CLI para evitar congelar un template nativo incompleto. Para crear el wrapper nativo exacto de React Native 0.87, genera un proyecto nuevo con el CLI 0.87 y reemplaza su `src/`, `package.json`, `index.js`, `app.json`, `babel.config.js` y `metro.config.js` por los de esta carpeta. Después instala dependencias y genera el APK.

React Native 0.87 fue publicado en agosto de 2026 y requiere Node 22+, Android Gradle Plugin 9 y Kotlin 2.0+. 

Para un teléfono Android físico, cambia `mobile/src/config.js`:
- desarrollo: `http://IP_DEL_PC:3000`
- producción: `https://TU_DOMINIO_API`

Para el emulador Android, `10.0.2.2` apunta al localhost del PC.

## Seguridad
No vuelvas a subir `.env`, `.env.local` ni tokens reales a GitHub. Genera un token largo y aleatorio para producción.


## Playlist Chile integrada

El backend usa por defecto la playlist de Chile de IPTV-org:
`https://iptv-org.github.io/iptv/countries/cl.m3u`

También puedes cambiarla mediante `M3U_URLS` en `.env`/`.env.local`.
