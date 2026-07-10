# Guía de Migración y Configuración de Servidor VPS con Coolify

Esta guía detalla los pasos para instalar Coolify desde cero en un nuevo VPS y configurar todos los servicios necesarios para **Chatprex** y **Evolution API** utilizando PostgreSQL y Redis.

---

## 1. Arquitectura Recomendada en Coolify

Para maximizar el rendimiento de tu VPS y aprovechar las ventajas de Coolify (como copias de seguridad automáticas, monitoreo y fácil gestión de dominios), configuraremos:

1. **PostgreSQL** (Servicio de Base de Datos gestionado por Coolify)
   - Crearemos dos bases de datos dentro de la misma instancia de Postgres: `chatprex` y `evolution_api`.
2. **Redis** (Servicio de Base de Datos gestionado por Coolify)
   - Utilizado por Evolution API para el manejo de caché y sesiones.
3. **Evolution API** (Aplicación desde Imagen Docker en Coolify)
   - Apuntando a PostgreSQL y Redis.
4. **Backend (Chatprex)** (Aplicación desde Git en Coolify)
   - Dockerfile en la raíz, puerto 3000.
5. **Frontend (Chatprex)** (Aplicación desde Git en Coolify)
   - Dockerfile.frontend, puerto 3000.

---

## 2. Paso 1: Instalación de Coolify en el VPS Limpio

Conéctate a tu nuevo servidor VPS mediante SSH (se recomienda Ubuntu 22.04 LTS o 24.04 LTS limpio) y ejecuta el comando oficial de instalación:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

> [!IMPORTANT]
> Asegúrate de que los puertos **80**, **443** (para tráfico web HTTP/S) y **8000** (para la interfaz web de Coolify) estén abiertos en el firewall del VPS/proveedor.

Una vez finalizada la instalación, ingresa a `http://IP_DE_TU_VPS:8000` y crea tu cuenta de administrador inicial.

---

## 2.5. Paso 1.5: Configurar DNS y Conectar GitHub en Coolify

### A. Configuración de DNS (Dominio)
Antes de que Coolify pueda emitir certificados SSL (HTTPS), debes apuntar tus subdominios a la dirección IP pública de tu VPS en tu proveedor de DNS (Cloudflare, GoDaddy, etc.):
- **Registro A** para el Frontend (ej. `chatprex.com` o `app.chatprex.com`) -> `IP_DE_TU_VPS`
- **Registro A** para el Backend (ej. `api.chatprex.com`) -> `IP_DE_TU_VPS`
- **Registro A** para Evolution API (ej. `evolution.chatprex.com`) -> `IP_DE_TU_VPS`

### B. Conectar GitHub a Coolify
Para que Coolify pueda descargar tu repositorio de forma automática cuando hagas cambios:
1. Ve a **Keys & Sources** en la barra lateral de Coolify -> **Sources** -> **Add**.
2. Selecciona **GitHub App** (Recomendado para repositorios privados y despliegue automático con webhooks) o **GitHub Personal Access Token**.
3. Sigue las instrucciones en pantalla para instalar la App de Coolify en tu cuenta de GitHub y dale acceso al repositorio `crmlucks/chatprex`.

---

## 3. Paso 2: Crear las Bases de Datos en Coolify

En la interfaz de Coolify:
1. Ve a **Projects** -> Selecciona tu proyecto (o crea uno nuevo, ej: `Chatprex`).
2. Haz clic en **New Resource** -> **PostgreSQL**.
3. Configura los valores iniciales (Usuario, Contraseña y Base de Datos por defecto).
4. *Opcional pero recomendado:* Haz clic en **New Resource** -> **Redis** y créalo para la caché de Evolution API.

### Configurar Múltiples Bases de Datos en PostgreSQL
Por defecto, Coolify creará una base de datos (por ejemplo, `coolify` o `postgres`). Para crear las bases de datos individuales de forma limpia:
1. Entra al recurso de PostgreSQL en Coolify.
2. Ve a la pestaña de **Tools** / **Terminal** o conéctate con tu cliente SQL favorito usando la URL de conexión externa provista por Coolify.
3. Ejecuta las siguientes sentencias SQL para crear las bases de datos:
   ```sql
   CREATE DATABASE chatprex;
   CREATE DATABASE evolution_api;
   ```

---

## 4. Paso 3: Desplegar Evolution API

1. En tu proyecto de Coolify, haz clic en **New Resource** -> **Application** -> **Docker Image**.
2. Configura los siguientes campos:
   - **Docker Image**: `evoapicloud/evolution-api:latest`
   - **Exposed Port**: `8080`
   - **Domains**: El subdominio con HTTPS que apuntará a tu API (ej: `https://evolution.tudominio.com`). Coolify gestionará el certificado SSL SSL/TLS automáticamente con Let's Encrypt.

### Variables de Entorno para Evolution API (`.env` en Coolify)
En la sección **Environment Variables** de la aplicación Evolution API en Coolify, agrega lo siguiente (reemplaza los valores correspondientes):

```env
# ──── SERVIDOR ────
SERVER_NAME=evolution
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://evolution.tudominio.com
SERVER_DISABLE_DOCS=false
SERVER_DISABLE_MANAGER=false

# ──── CORS ────
CORS_ORIGIN=*
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true

# ──── BASE DE DATOS (PostgreSQL) ────
DATABASE_PROVIDER=postgresql
# Reemplaza con la URI interna de tu base de datos PostgreSQL en Coolify (disponible en la configuración de la BD)
# Formato: postgresql://<user>:<password>@<postgres-host>:5432/evolution_api
DATABASE_CONNECTION_URI=postgresql://postgres:mi_password_seguro@evolution-postgres:5432/evolution_api
DATABASE_CONNECTION_CLIENT_NAME=evolution

# Configuración de persistencia (Recomendado true para no perder chats/mensajes)
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_HISTORIC=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_IS_ON_WHATSAPP=true
DATABASE_SAVE_IS_ON_WHATSAPP_DAYS=7
DATABASE_DELETE_MESSAGE=false

# ──── REDIS (Caché y Sesiones) ────
CACHE_REDIS_ENABLED=true
# Reemplaza con la URI interna de tu Redis en Coolify (ej: redis://redis-service:6379)
CACHE_REDIS_URI=redis://evolution-redis:6379
CACHE_REDIS_PREFIX_KEY=evolution-cache
CACHE_REDIS_TTL=604800
CACHE_REDIS_SAVE_INSTANCES=true
CACHE_LOCAL_ENABLED=true
CACHE_LOCAL_TTL=86400

# ──── AUTENTICAÇÃO (Token Global) ────
# Genera una clave segura. Esta será la API KEY para autenticar las peticiones a la API
AUTHENTICATION_API_KEY=TU_API_KEY_GLOBAL_SUPER_SECRETA
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false

# ──── LOGS Y IDIOMA ────
LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE
LOG_COLOR=true
LOG_BAILEYS=error
LANGUAGE=es-ES

# ──── INSTANCIAS Y QR ────
DEL_INSTANCE=false
DEL_TEMP_INSTANCES=true
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# ──── WEBSOCKET ────
WEBSOCKET_ENABLED=true
WEBSOCKET_GLOBAL_EVENTS=true
```

> [!TIP]
> En Coolify, puedes definir volúmenes persistentes para que las sesiones de WhatsApp no se desconecten al reiniciar el contenedor.
> Ve a la configuración de la aplicación de Evolution API -> **Storage** -> **Add Volume**:
> - **Mount Path**: `/evolution/instances`
> - **Volume Name**: `evolution_instances`

---

## 5. Paso 4: Desplegar el Backend (Chatprex)

1. En Coolify, haz clic en **New Resource** -> **Application** -> **Public/Private Repository** (según corresponda para tu repositorio de Git).
2. Selecciona la rama (ej: `main`).
3. Especifica los siguientes parámetros:
   - **Build Pack**: `Docker` (Coolify leerá automáticamente el archivo `Dockerfile` en la raíz).
   - **Exposed Port**: `3000`
   - **Domains**: El dominio o subdominio HTTPS para tu API backend (ej: `https://api.chatprex.com`).

### Variables de Entorno para el Backend (`.env` en Coolify)
Agrega estas variables en la sección de **Environment Variables** de la aplicación Backend:

```env
# ──── BASE DE DATOS (PostgreSQL) ────
# Utiliza la URI interna de conexión de Coolify apuntando a la base de datos 'chatprex'
DATABASE_URL=postgresql://postgres:mi_password_seguro@evolution-postgres:5432/chatprex
DB_SSL=false

# ──── JWT ────
# Genera un token aleatorio y seguro
JWT_SECRET=TU_JWT_SECRET_SECRETO_2026

# ──── SERVIDOR ────
PORT=3000
NODE_ENV=production

# Permite certificados auto-firmados internamente si es necesario
NODE_TLS_REJECT_UNAUTHORIZED=0

# ──── EVOLUTION API INTEGRATION ────
# Pon la URL pública de Evolution API o su alias interno de Coolify
EVOLUTION_API_URL=https://evolution.tudominio.com
EVOLUTION_API_TOKEN=TU_API_KEY_GLOBAL_SUPER_SECRETA
EVOLUTION_INSTANCE_NAME=ChatPrex
# URL de webhook a donde Evolution enviará los eventos. Apunta a la ruta del backend expuesta públicamente.
WEBHOOK_URL=https://api.chatprex.com/api/webhook/evolution/webhook

# ──── OPENAI ────
OPENAI_API_KEY=tu_openai_api_key_aqui

# ──── META / WHATSAPP CLOUD API (Opcionales) ────
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_ID=
META_WHATSAPP_VERIFY_TOKEN=whatsapp_verify
META_ACCESS_TOKEN=

# ──── META PIXEL / N8N (Opcionales) ────
META_PIXEL_ID=
N8N_WEBHOOK_URL=
```

---

## 6. Paso 5: Desplegar el Frontend (Chatprex)

1. Crea otra aplicación desde el mismo repositorio Git.
2. Configura los siguientes parámetros en Coolify:
   - **Dockerfile Path**: `Dockerfile.frontend` (ya que está en el subdirectorio frontend y configurado para compilar Vite).
   - **Exposed Port**: `3000`
   - **Domains**: El dominio HTTPS principal donde accederán los usuarios (ej: `https://chatprex.com` o `https://app.chatprex.com`).

### Variables y Argumentos de Construcción (VITAL PARA VITE)
Vite requiere que las variables de entorno de frontend estén presentes durante el tiempo de compilación (**Build Time**).
En la interfaz de Coolify, ve a la aplicación Frontend y agrega la siguiente variable de entorno:

1. **VITE_API_URL**: `https://api.chatprex.com` (La URL pública de tu backend).
2. Asegúrate de marcar la casilla **"Build Variable"** o **"Is Build Time Variable"** en Coolify para que se inyecte correctamente como un `ARG` en el Dockerfile durante la compilación.

---

## 7. Consejos y Diagnóstico Comunes

1. **Conectividad Interna de Docker**:
   Si quieres que el Backend se comunique con Evolution API de forma súper rápida sin salir a internet, puedes usar la red privada de Coolify colocando la URL interna (ej. `http://evolution-api-internal:8080`). Sin embargo, mantén `WEBHOOK_URL` apuntando a la URL pública con SSL para que Evolution API pueda enviar eventos correctamente a través del proxy inverso de Coolify.
2. **Reconexión de WhatsApp**:
   Si despliegas una actualización de la Evolution API, el volumen `/evolution/instances` mantendrá los tokens y credenciales de las sesiones de WhatsApp activas, evitando que tus clientes tengan que volver a escanear el código QR.
3. **Reinicios de Contenedores**:
   Coolify implementa políticas de reinicio automático (`restart: always`). Si el VPS sufre un corte de energía, al encenderse de nuevo, Coolify levantará PostgreSQL, Redis, Evolution API y Chatprex de manera secuencial y automática.
