# TV Personalizado — NEXUS

Aplicación React/Express/tRPC para explorar una biblioteca privada de fuentes y canales HLS. Conserva el diseño neón del proyecto original y añade cuentas Manus, sesión de aplicación y persistencia MySQL por usuario.

## Autenticación y datos

El acceso y el registro se realizan mediante el flujo seguro de Manus; la app no guarda contraseñas propias. Las fuentes, canales y preferencias se guardan en MySQL y las operaciones privadas se aíslan por la identidad autenticada. La sesión usa la cookie `webdev_app_session` y el cierre de sesión elimina esa cookie. El Preview y el despliegue gestionado usan la base MySQL del proyecto, con migraciones Drizzle versionadas.

## Desarrollo WebDev

Con el entorno gestionado del proyecto: `pnpm dev` inicia la app en el puerto configurado (3000 por defecto), `pnpm db:migrate` aplica las migraciones pendientes, `pnpm check` verifica TypeScript, `pnpm test` ejecuta las pruebas y `pnpm build` compila frontend y backend.

La ruta de salud no autenticada es `GET /api/health`; las páginas se declaran en `GET /manus-routes.json`. Las variables privadas de plataforma permanecen en el servidor.

## Docker

Para levantar app y MySQL en contenedores separados, configurar `.env` y ejecutar Compose, consulta [DOCKER.md](./DOCKER.md). MySQL queda solo en la red de Compose, con volumen persistente; el puerto web es configurable. No publiques credenciales de `.env`.
