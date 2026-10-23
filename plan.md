# Plan de implementación — TV Personalizado

## Alcance y decisiones

Integrar en el proyecto Web gestionado la aplicación TV Personalizado del ZIP adjunto, conservar sus flujos actuales de reproducción HLS, biblioteca personal y preferencias, e implementar login, registro a través del proveedor de identidad Manus y logout. Usar el backend React/Express/tRPC/Drizzle existente y MySQL gestionado para guardar las cuentas de identidad y la biblioteca aislada por usuario. Añadir empaquetado reproducible en Docker y un Compose de desarrollo/autohospedaje que conecte el servidor de la app con MySQL por una red privada.

Por defecto se conserva el inicio de sesión de Manus del starter WebDev; el alta de cuenta se ofrece dentro del flujo del proveedor. No almacenar contraseñas propias ni reemplazar la identidad Manus por credenciales locales. La sesión de la aplicación valida JWT HS256, vencimiento e `appId` con secretos proporcionados por la plataforma; cookie `webdev_app_session` HttpOnly, `SameSite=None; Secure` para Preview HTTPS y respaldo por Authorization en Preview cuando las cookies de terceros estén bloqueadas. El callback valida `state`/nonce de un solo uso y retorna a una ruta fija.

La MySQL gestionada sigue siendo la base del Preview y del despliegue gestionado. Docker Compose aporta, de forma separada, una instancia local de MySQL para ejecución con Docker: un servicio web Node sirve frontend y API; el servicio MySQL solo es accesible por la red bridge de Compose, no publica su puerto en el host, se declara sano antes de iniciar la app y conserva los datos en volumen. El `Dockerfile` de producción compila el frontend y el backend dentro de una imagen de aplicación y sigue usando `PORT` y `/api/health`. Compose configura `DATABASE_URL` con el hostname de servicio `db`; secretos de OAuth solo se inyectan por entorno y no se incluyen en el repositorio.

Las migraciones serán aditivas: conservar la migración de usuarios del starter y añadir las tablas fuente/canales/preferencias requeridas. No borrar datos, no usar cuentas simuladas y no ejecutar operaciones de prueba destructivas sobre la base compartida de desarrollo/producción.

## Diseño

Se conserva sin rediseño la identidad visual ciberpunk/neón de la app adjunta: fondo oscuro, acentos cian y magenta, HUD compacto, reproducción como foco y navegación responsive. El login y el registro se presentan como acciones claras dentro de esa experiencia; la cuenta activa y el cierre de sesión aparecen en la navegación. El tono y las etiquetas permanecen en español.

## Estructura del proyecto

- `client/src/pages/Home.tsx`: experiencia existente de TV, estados de autenticación, biblioteca y puntos de acceso a login/registro.
- `client/src/_core/hooks/useAuth.ts`, `client/src/const.ts`, `client/src/main.tsx`: estado de sesión del cliente y flujo OAuth del starter, preservando el protocolo Preview.
- `server/_core/oauth.ts`, `server/_core/sdk.ts`, `server/_core/cookies.ts`, `server/_core/context.ts`: callback, verificación de sesión y cookies del backend administrado.
- `server/routers.ts`, `server/db.ts`, `server/contentParser.ts`: endpoints tRPC, persistencia y aislamiento de biblioteca por usuario.
- `drizzle/schema.ts`, `drizzle/*.sql`: usuarios, fuentes, canales, preferencias y migraciones aditivas.
- `Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`: imagen del servidor, MySQL local, red y configuración sin credenciales reales.
- `README.md`, `TODO.md`: comandos de ejecución y alcance entregado.

## Dependencias y servicio

Reutilizar las dependencias, pin de pnpm y servicios administrados del proyecto. No agregar proveedor de contraseñas externo. La app integrada expone el frontend y `/api/*` desde Express en el puerto configurado; Compose usa `db:3306` solo dentro de su red. El Preview usa la MySQL gestionada. La publicación requiere la imagen del servidor y conserva la capacidad server/database ya seleccionada al inicializar el proyecto.
