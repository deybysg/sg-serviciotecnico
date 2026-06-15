# 🚀 Deploy en Render

## Requisitos previos
- Tener cuenta en [Render](https://render.com)
- Tu repositorio en GitHub/GitLab

## Pasos para deployar el backend

### 1. Subir código a GitHub
```bash
git add .
git commit -m "Preparar para deploy en Render"
git push origin main
```

### 2. Crear Web Service en Render
1. Iniciá sesión en [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conectá tu repositorio de GitHub/GitLab
4. Seleccioná el directorio `/backend` (si es un monorepo)

### 3. Configurar el servicio

| Campo | Valor |
|-------|-------|
| **Name** | `sistema-sg-backend` (o el nombre que prefieras) |
| **Environment** | `Node` |
| **Region** | `Oregon (US West)` (cerca de tu PostgreSQL) |
| **Branch** | `main` (o tu branch principal) |
| **Root Directory** | `backend` (si es monorepo) o `.` (si solo es backend) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (o Starter si necesitas más recursos) |

### 4. Variables de entorno (Environment Variables)

Agregá estas variables en Render Dashboard → **Environment** → **Add Environment Variable** (una por una):

#### 🔴 OBLIGATORIAS (sin estas no funciona)

| Variable | Valor actual | Descripción |
|----------|--------------|-------------|
| `DB_PROVIDER` | `postgres` | Base de datos principal (postgres o mongo) |
| `DATABASE_URL` | `postgresql://serviciotecnico_db_user:w99gmZaRkh0PRg1tY886h7rCzpf9wESP@dpg-d8o23i3bc2fs73a8eaa0-a.oregon-postgres.render.com/serviciotecnico_db` | URL de PostgreSQL en Render |
| `JWT_SECRET` | `tu_clave_secreta_super_segura` | Clave secreta para tokens (¡cambiá esto!) |
| `PORT` | `10000` | Puerto (Render asigna uno automáticamente, pero puede ser cualquier número) |

#### 🟡 IMPORTANTES (funcionalidad reducida sin estas)

| Variable | Valor actual | Descripción |
|----------|--------------|-------------|
| `FRONTEND_URL` | `https://tu-frontend-url.vercel.app` | URL de tu frontend para CORS (¡cambiá esto!) |
| `BACKEND_URL` | `https://sistema-sg-backend.onrender.com` | URL de este backend (Render te la da) |
| `MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-2588827446907989-112013-c858b942fa99bc8ebf1f05dc4c551501-3004659960` | Token de MercadoPago |
| `EMAIL_USER` | `gastonituartedef@gmail.com` | Email para notificaciones |
| `EMAIL_PASSWORD` | `xfwlymyfwquappkh` | Contraseña de aplicación de Gmail |
| `SMTP_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `SMTP_PORT` | `587` | Puerto SMTP |
| `SMTP_FROM` | `Sistema SG <gastonituartedef@gmail.com>` | Remitente de emails |
| `STORE_NAME` | `Sistema SG` | Nombre de la tienda |

#### 🟢 OPCIONALES (solo si usás MongoDB)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | URL de MongoDB Atlas (si usás Mongo en vez de PostgreSQL) |

#### 🟢 OPCIONALES (solo si usás PostgreSQL local)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `PGHOST` | `localhost` | Host PostgreSQL (no necesario si usás DATABASE_URL) |
| `PGPORT` | `5432` | Puerto PostgreSQL |
| `PGDATABASE` | `servicio_tecnico` | Nombre de la base de datos |
| `PGUSER` | `postgres` | Usuario PostgreSQL |
| `PGPASSWORD` | `deyby1234` | Contraseña PostgreSQL |
| `PG_SSL` | `true` | SSL obligatorio para conexiones externas |

---

**⚠️ CAMBIOS IMPORTANTES PARA PRODUCCIÓN:**

1. **`JWT_SECRET`**: Cambiá `tu_clave_secreta_super_segura` por una clave aleatoria larga (mínimo 32 caracteres). Usá un generador de contraseñas.

2. **`FRONTEND_URL`**: Cambiá por la URL real de tu frontend cuando lo deployes. Ejemplos:
   - Vercel: `https://sistema-sg.vercel.app`
   - Netlify: `https://sistema-sg.netlify.app`
   - Render: `https://sistema-sg.onrender.com`

3. **`BACKEND_URL`**: Render te da una URL automática después del deploy. Copiala y pegala acá. Ejemplo: `https://sistema-sg-backend.onrender.com`

4. **`MERCADOPAGO_ACCESS_TOKEN`**: Si usás MercadoPago en producción, usá el token real de producción (empieza con `APP_USR-` para producción).

### 5. Deploy automático
Render detectará automáticamente tu `package.json` y ejecutará:
```bash
npm install
npm start
```

### 6. Verificar que funcione
Una vez deployado, accedé a:
```
https://tu-backend-url.onrender.com/api/health/db
```

Debería mostrar los conteos de la base de datos.

### 7. Configurar el frontend
En tu frontend (en Vercel/Netlify/etc.), configurá la variable de entorno:
```env
VITE_API_URL=https://tu-backend-url.onrender.com/api
```

---

## 📋 Endpoints disponibles

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/health/db` | Verificación de salud y conteo de registros |
| `POST /api/auth/login` | Login de usuarios |
| `POST /api/auth/register` | Registro de usuarios |
| `GET /api/productos` | Listar productos |
| `POST /api/productos` | Crear producto |
| `GET /api/servicios` | Listar servicios |
| `POST /api/servicios` | Crear servicio |
| `GET /api/clientes` | Listar clientes |
| `POST /api/clientes` | Crear cliente |
| `GET /api/ventas` | Historial de ventas |
| `POST /api/carts` | Gestión de carritos |
| `POST /api/mercadopago/create-preference` | Crear preferencia de pago |

---

## ⚠️ Notas importantes

1. **Plan Free**: El servidor se "duerme" después de 15 minutos de inactividad. El primer request después de dormir puede tardar 30-60 segundos.

2. **PostgreSQL**: Ya tenés una base de datos PostgreSQL en Render configurada. No hace falta crear otra.

3. **MongoDB**: Si preferís usar MongoDB, cambiá `DB_PROVIDER=mongo` y configurá `MONGODB_URI` con tu cluster de MongoDB Atlas.

4. **CORS**: El backend ya está configurado para aceptar peticiones de tu frontend. Si cambiás la URL del frontend, actualizá `FRONTEND_URL`.

5. **SSL**: Render maneja SSL automáticamente (HTTPS). No hace falta configurar nada.

---

## 🔧 Troubleshooting

**Error: "Cannot find module"**
- Verificá que `npm install` se ejecute correctamente en el build.

**Error de conexión a PostgreSQL**
- Verificá que `DATABASE_URL` esté correctamente configurada.
- Asegurate de que la base de datos PostgreSQL esté activa en Render.

**CORS errors**
- Verificá que `FRONTEND_URL` coincida exactamente con la URL de tu frontend (incluyendo `https://`)

**Token JWT no válido**
- Asegurate de que `JWT_SECRET` sea la misma en el backend y en el frontend (si la tenés hardcodeada)

---

## 📝 Cambios recientes para Render

- ✅ Script `start` agregado en `package.json`
- ✅ Puerto dinámico (`process.env.PORT`)
- ✅ CORS configurado con `FRONTEND_URL`
- ✅ `dotenv` configurado para variables de entorno
- ✅ PostgreSQL conectado y funcionando

---

¡Listo para deploy! 🚀
