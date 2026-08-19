# PK TV preparado para Android

Este proyecto quedó adaptado para generar un APK usando **React + Vite + Capacitor**. El frontend se empaqueta dentro de Android y el backend Express se ejecuta en un servidor separado. El backend no se ejecuta dentro del teléfono.

## Estructura

`frontend/` contiene la interfaz y la plataforma Android generada. `backend/` contiene la API de canales, el parser M3U y el proxy restringido de reproducción. Los archivos `.env.example` documentan las variables necesarias sin incluir credenciales nuevas.

## Ejecutar el backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Antes de usar producción, cambia `USER_TOKEN` y define `STREAM_ALLOWED_HOSTS` con los dominios autorizados. Si se dejan los dominios vacíos, el backend admite cualquier destino HTTP/HTTPS que aparezca en las listas M3U; esto es práctico para pruebas, pero no es la configuración recomendada para publicar.

## Ejecutar el frontend en desarrollo

Para el emulador Android, `10.0.2.2` apunta al computador anfitrión. Para un teléfono físico, cambia `VITE_API_URL` por la IP LAN del computador o, preferiblemente, por una URL HTTPS pública.

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Generar y abrir Android

```bash
cd frontend
npm install
npm run build
npx cap sync android
npx cap open android
```

La carpeta `frontend/android` ya está incluida en este ZIP. En Android Studio se puede ejecutar en un dispositivo o generar un APK firmado.

## Generar un APK de depuración

```bash
cd frontend
npm run android:debug
```

El archivo generado queda en:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Configurar una compilación de producción

Crea `frontend/.env.production` con la API de producción antes de ejecutar `npm run build`:

```dotenv
VITE_API_URL=https://api.example.com
VITE_USER_TOKEN=token-de-produccion
```

No introduzcas tokens permanentes dentro del APK como mecanismo de seguridad. Todo valor compilado en la aplicación puede extraerse; la protección real debe estar en el backend, con tokens rotables, validación de dominios y HTTPS.

## Validaciones realizadas

El frontend compila correctamente con Vite y pasa Oxlint sin errores. El backend pasa la comprobación de sintaxis de Node.js. La plataforma Android fue generada con Capacitor y se produjo correctamente un APK de depuración mediante Gradle.

La aplicación debe usarse únicamente con listas y streams cuya distribución esté autorizada.
