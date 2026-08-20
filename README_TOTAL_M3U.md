# PK TV con total.m3u

La aplicación está configurada para cargar como fuente principal:

```text
https://m3u.cl/lista/total.m3u
```

La lista fue validada y contiene aproximadamente **1.074 entradas `#EXTINF`**. El backend descarga la lista al iniciar, normaliza sus canales y los expone mediante la playlist protegida de la aplicación.

## Backend

```bash
cd backend
npm install
node server.js
```

La configuración está en `backend/src/.env.local`. Para usar otra lista, cambia `M3U_URLS`:

```dotenv
M3U_URLS=https://m3u.cl/lista/total.m3u
```

## Frontend y APK

```bash
cd frontend
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

El APK de depuración se genera en `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

Para el emulador Android se utiliza `http://10.0.2.2:3000`. En un teléfono físico, cambia `VITE_API_URL` por la IP de tu computador o por una URL HTTPS pública.

La aplicación debe utilizarse únicamente con listas y streams cuya distribución esté autorizada.
