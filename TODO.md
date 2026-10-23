# TODO del proyecto

## Autenticación de cuentas — implementado
- La aplicación incluye registro de nuevos usuarios mediante el flujo de autenticación Manus, con los datos y validaciones del proveedor.
- La aplicación permite iniciar sesión de forma segura con una cuenta Manus registrada.
- La sesión se mantiene al volver a abrir la app y existe una acción de cierre de sesión. Se usa una cookie de aplicación HttpOnly, `SameSite=None; Secure` y vigencia de un año.
- Ante errores de autenticación, el usuario recibe mensajes comprensibles; las credenciales se validan en el proveedor, no en un sistema paralelo de contraseñas locales.
- Las rutas API que requieren cuenta verifican la sesión y no exponen fuentes, canales o preferencias de otra cuenta.

## Biblioteca personal y continuidad de la app — implementado
- La biblioteca de fuentes/canales y preferencias permanece asociada a la cuenta autenticada para usarla entre sesiones.
- Se conserva la interfaz, navegación y funcionalidades actuales de TV Personalizado: añadir y buscar fuentes, reproducir HLS, guardar preferencias y cerrar sesión.
- El usuario sin sesión puede ver la entrada pública de la app y es dirigido al flujo de acceso al intentar usar funciones privadas.
- Se preserva el esquema de usuarios existente del starter; las tablas de biblioteca se incorporan mediante migraciones aditivas, sin eliminar datos guardados.
- Se comprobó que el ZIP no contiene fuentes/canales en almacenamiento local del navegador; allí solo se guardan preferencias de interfaz, por lo que no hay biblioteca local que reemplazar o migrar.

## Contenedores y comunicación de servicios — implementado
- La app incluye una imagen Docker de producción que compila y ejecuta frontend y backend, escucha el puerto configurable y dispone de `/api/health`.
- Docker Compose levanta la app y una instancia MySQL mediante servicios separados; la app se conecta a MySQL por el nombre de servicio en una red privada.
- MySQL no publica un puerto al host en la configuración predeterminada, cuenta con healthcheck y almacenamiento persistente; la app espera a que MySQL esté sano.
- Las variables de entorno y credenciales locales se documentan sin guardar secretos de autenticación o contraseñas reales en Git.
- El Preview y despliegue gestionado conservan su MySQL administrada; las migraciones compartidas son aditivas y no destructivas.

**Nota de verificación:** Compose se validó sintácticamente y su comunicación interna está declarada; el sandbox no tiene Docker instalado, así que aquí no se ejecutó el build ni el arranque de contenedores. La migración de biblioteca sí se aplicó a la MySQL gestionada y se confirmó la presencia de sus tablas.
