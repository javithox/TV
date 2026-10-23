# Docker y comunicación entre servicios

La solución incluye dos imágenes: `nexustv-app:local`, construida desde `Dockerfile` y que sirve el frontend y el backend Express/tRPC, y `mysql:8.4`, que almacena la biblioteca. `compose.yaml` agrega además un contenedor temporal `migrate` que usa la misma imagen de la app para aplicar las migraciones antes de iniciar el servidor.

## Preparar y arrancar

1. Copia `.env.example` a `.env`.
2. Reemplaza `MYSQL_PASSWORD` y `MYSQL_ROOT_PASSWORD` por valores aleatorios diferentes (por ejemplo, generados con `openssl rand -hex 32`). Mantén ambos valores URL-safe. Configura también los cuatro valores `MANUS_*` del proyecto y asegúrate de que el callback `https://<tu-dominio>/api/oauth/callback` esté permitido para ese proyecto.
3. Ejecuta `docker compose -f compose.yaml up --build -d`.
4. Comprueba el servicio con `curl http://localhost:3000/api/health` (o el puerto elegido en `APP_PORT`) y revisa `docker compose -f compose.yaml logs -f app`.

El acceso y el alta de cuentas siguen usando el proveedor Manus; Compose no crea contraseñas de aplicación ni una cuenta de prueba. El navegador debe abrir la aplicación mediante el dominio HTTPS registrado/permitido para que el callback OAuth funcione. Un `localhost` local puede servir para comprobar la salud y el renderizado, pero no se debe asumir que Manus aceptará ese callback.

## Red, base de datos y datos persistentes

Compose conecta `app`, `migrate` y `db` a la red bridge `app_db`. El backend se conecta a `db:3306` usando el nombre DNS interno del servicio; la base de datos no publica ningún puerto en el host. Solo se publica el puerto web configurable de la app. El healthcheck de MySQL debe aprobar antes de correr migraciones, y la app espera a que el servicio `migrate` termine con éxito.

Los datos de MySQL permanecen en el volumen nombrado `mysql_data`, incluso al recrear contenedores. Para apagar sin borrar datos: `docker compose -f compose.yaml down`. **No** ejecutes `docker compose down -v` salvo que quieras eliminar permanentemente ese volumen y toda la biblioteca guardada.

## Relación con WebDev gestionado

El Preview y la publicación de Manus continúan usando la base MySQL gestionada por el proyecto; no necesitan `.env` local ni Compose. La conexión Compose usa el hostname `db` únicamente dentro de la red local Docker. En ambos casos, las migraciones del proyecto son aditivas y la biblioteca permanece separada por usuario.
