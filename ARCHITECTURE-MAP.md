# Mapeo de arquitectura TV.zip → TV Personalizado

## Correspondencias principales

| Modelo del ZIP | Proyecto adaptado | Responsabilidad |
|---|---|---|
| `mobile/src/App.js` | `client/src/App.tsx` + `client/src/pages/Home.tsx` | Entrada de aplicación y composición de la pantalla principal. |
| `mobile/src/screens/HomeScreen.js` | `client/src/pages/Home.tsx` | Contenedor de autenticación, consulta de biblioteca, búsqueda y navegación. |
| `mobile/src/components/ChannelItem.js` | `client/src/components/ChannelItem.tsx` | Componente presentacional reutilizable para cada canal. |
| `mobile/src/services/api.js` | `client/src/services/api.ts` + tRPC | Capa de dominio y acceso tipado a contenido; no se usa token fijo en cliente. |
| `mobile/src/config.js` | `server/_core/env.ts` y configuración Vite | Configuración segura del servidor y variables del entorno. |
| `react-native-video` | `client/src/components/PlayerSurface.tsx` | Vista del reproductor y controles personalizados web. |
| Carga/parsing M3U del backend Express | `server/contentParser.ts` + `server/db.ts` | Análisis, normalización, persistencia y aislamiento por usuario. |
| Endpoint `/api/channels` | Procedimientos `content.list`, `content.add`, `content.sources` | Contratos tRPC protegidos y tipados. |

## Flujo de reproducción

`Home.tsx` obtiene la biblioteca mediante tRPC y selecciona el último canal guardado. `ChannelItem` emite la selección sin conocer el backend. `useHlsPlayer` recibe el canal y controla la carga nativa HLS o `hls.js`, calidad, volumen, fullscreen y estados. `PlayerSurface` solo presenta el video y los controles. Las preferencias se guardan mediante `content.savePreferences`, asociadas a `ctx.user.id`.

## Decisión de seguridad

El ZIP original utiliza un token estático en el cliente móvil. La adaptación conserva su separación `screen → component → service`, pero reemplaza el token fijo por autenticación Manus y procedimientos protegidos. Las fuentes y preferencias se filtran por el usuario autenticado en el servidor.
