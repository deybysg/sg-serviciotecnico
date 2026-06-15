# Para cambiar la contraseña de superadmin usar esto en la terminal 
# donde esta el 123456 ahi va la nueva contraseña deseada
cd "C:\Users\54381\Desktop\GASTON\TPI\sistema-sg 5.0\backend"
npx babel-node scripts/set-superadmin-password.js 123456 
Te lo explico simple y al grano.

Qué hice
- Creé un script en el backend (set-superadmin-password.js) que:
  - Se conecta a tu MongoDB usando el .env.
  - Busca al usuario con rol `superadmin` (prioriza el que está marcado como `isProtected: true`).
  - Hashea la nueva contraseña con `bcrypt` (por seguridad, no se guarda en texto plano).
  - Guarda el cambio en la base.

Cómo lo usás
1) Asegurate de tener MongoDB activo (local o Atlas) y `MONGODB_URI` bien puesto en .env.
2) En PowerShell, ejecutá:

```powershell
cd "C:\Users\54381\Desktop\GASTON\TPI\sistema-sg 5.0\backend"
npx babel-node scripts/set-superadmin-password.js NUEVA_CONTRASENA
```

Ejemplo:
```powershell
npx babel-node scripts/set-superadmin-password.js 123456
```

Qué esperar
- Si todo sale bien: “Contraseña actualizada para el superadmin: superadmin”.
- Si no encuentra superadmin: te lo dice; revisá que exista en la base.
- Si falla conexión: revisá MongoDB y el `MONGODB_URI`.

Alternativa rápida
- Si el superadmin tiene email y SMTP configurado, podés usar “¿Olvidaste tu contraseña?” desde la UI y restablecer por email.

Listo: con eso ya podés iniciar sesión como `superadmin` usando la nueva contraseña (mínimo 6 caracteres).

# Backend - Sistema de Servicio Técnico

Backend en Express + MongoDB para el sistema de gestión de servicios técnicos.

## 🚀 Instalación

```bash
cd backend
npm install
```

## ⚙️ Configuración

Crear archivo `.env` en la raíz de `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/ServicioTecnico
PORT=4000
```

## 📊 Migración de datos desde db.json

Para migrar todos los datos del archivo `db.json` (de la raíz del proyecto) a MongoDB:

```bash
npm run migrate
```

Este script:
- ✅ Hashea todas las contraseñas con bcrypt (contraseñas muy cortas se convierten a "123456")
- ✅ Marca al superadmin con `isProtected: true`
- ✅ Mapea las referencias clienteId → ObjectId
- ✅ Normaliza fechas a formato Date
- ✅ Deduplica carritos por username
- ✅ Crea todas las colecciones: usuarios, productos, clientes, servicios, ventas, carts

## 🏃 Ejecutar en desarrollo

```bash
npm run dev
```

El servidor estará en `http://localhost:4000`

## 📁 Estructura de modelos

### Usuarios
- username (único)
- password (hash)
- role: "user" | "admin" | "superadmin"
- isProtected: boolean

### Productos
- nombre
- categoria: "celulares" | "computadoras" | "accesorios"
- precio
- stock
- descripcion
- imagen

### Clientes
- nombreCompleto
- celular
- correo
- direccion
- serviciosRealizados: [ObjectId Servicio]

### Servicios
- cliente: ObjectId Cliente
- marcaProducto
- tipoServicio: "celulares" | "computadora" | "parlantes" | "otros"
- detalles
- presupuesto: { items[], subtotal, iva, total }
- estado: "pendiente" | "entregado"
- fechaEntrada
- fechaSalida

### Ventas
- username
- fechaCompra
- totalVenta
- metodoPago
- estado: "Completado" | "Cancelado"
- productosComprados: [{ productId, nombre, categoria, precioUnitario, cantidad, subtotal }]

### Carts
- _id: username (string)
- username
- items: [{ id, nombre, categoria, precio, cantidad }]
- updatedAt

## 🔌 Endpoints disponibles (actuales)

- `GET/POST/PUT/DELETE /api/productos`
- `GET/POST/PUT/DELETE /api/usuarios`

## 📝 Próximos pasos

1. Crear controladores y rutas para clientes, servicios, ventas y carts
2. Implementar autenticación JWT
3. Agregar middlewares de autorización por rol
4. Crear endpoints de estadísticas (agregaciones)
5. Actualizar frontend para consumir esta API

## 🛠️ Tecnologías

- Express 5
- Mongoose 8
- Bcrypt (hash de contraseñas)
- Babel (ES6 modules)
- Morgan (logs)
- CORS
- Dotenv
