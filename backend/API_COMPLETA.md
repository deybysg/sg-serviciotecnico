# 📚 API Completa - Sistema de Servicio Técnico

## Base URL
```
http://localhost:4000/api
```

---

## 🔐 Autenticación (Auth)

### POST /api/auth/login
Login de usuario
- **Público**: Sí
- **Body**: `{ username, password }`
- **Respuesta**: `{ mensaje, token, user }`

### POST /api/auth/register
Registro de nuevo usuario
- **Público**: Sí
- **Body**: `{ username, password, email? }`
- **Respuesta**: `{ mensaje, token, user }`

### GET /api/auth/me
Obtener perfil del usuario autenticado
- **Auth**: Bearer token requerido
- **Respuesta**: Usuario sin password

---

## 👥 Usuarios

**Requiere**: Bearer token + rol admin/superadmin

### GET /api/usuarios
Listar todos los usuarios

### GET /api/usuarios/:id
Obtener un usuario por ID

### POST /api/usuarios
Crear nuevo usuario
- **Body**: `{ username, password, role }`

### PUT /api/usuarios/:id
Actualizar usuario (protege superadmin)
- **Body**: `{ username?, password?, role? }`

### DELETE /api/usuarios/:id
Eliminar usuario (protege superadmin)

---

## 📦 Productos

### GET /api/productos
Listar todos los productos
- **Público**: Sí

### GET /api/productos/:id
Obtener un producto por ID
- **Público**: Sí

### POST /api/productos
Crear producto
- **Auth**: Bearer token + rol admin/superadmin
- **Body**: `{ nombre, categoria, precio, stock, descripcion, imagen }`

### PUT /api/productos/:id
Actualizar producto
- **Auth**: Bearer token + rol admin/superadmin
- **Body**: Campos a actualizar

### DELETE /api/productos/:id
Eliminar producto
- **Auth**: Bearer token + rol admin/superadmin

---

## 👤 Clientes

**Requiere**: Bearer token + rol admin/superadmin

### GET /api/clientes
Listar todos los clientes (con servicios poblados)

### GET /api/clientes/:id
Obtener un cliente por ID

### POST /api/clientes
Crear cliente
- **Body**: `{ nombreCompleto, celular, correo, direccion }`

### PUT /api/clientes/:id
Actualizar cliente
- **Body**: Campos a actualizar

### DELETE /api/clientes/:id
Eliminar cliente

---

## 🔧 Servicios

**Requiere**: Bearer token + rol admin/superadmin

### GET /api/servicios
Listar todos los servicios (con cliente poblado)

### GET /api/servicios/:id
Obtener un servicio por ID

### POST /api/servicios
Crear servicio
- **Body**:
```json
{
  "cliente": "ObjectId del cliente",
  "marcaProducto": "string",
  "tipoServicio": "celulares|computadora|parlantes|otros",
  "detalles": "string",
  "presupuesto": {
    "items": [{ "descripcion": "string", "costo": 0 }],
    "subtotal": 0,
    "iva": 0,
    "total": 0
  },
  "estado": "pendiente|entregado",
  "fechaEntrada": "Date"
}
```

### PUT /api/servicios/:id
Actualizar servicio
- **Body**: Campos a actualizar

### PATCH /api/servicios/:id/entregar
Marcar servicio como entregado
- Setea `estado: "entregado"` y `fechaSalida: Date.now()`

### DELETE /api/servicios/:id
Eliminar servicio (también lo quita del cliente)

---

## 💰 Ventas

### GET /api/ventas
Listar todas las ventas
- **Auth**: Bearer token + rol admin/superadmin
- **Query params opcionales**:
  - `username`: filtrar por usuario
  - `year`: filtrar por año
  - `month`: filtrar por mes (1-12)

### GET /api/ventas/:id
Obtener una venta por ID
- **Auth**: Bearer token + rol admin/superadmin

### POST /api/ventas
Crear venta
- **Auth**: Bearer token (cualquier usuario)
- **Body**:
```json
{
  "username": "string",
  "totalVenta": 0,
  "metodoPago": "string",
  "estado": "Completado|Cancelado",
  "productosComprados": [
    {
      "productId": "string",
      "nombre": "string",
      "categoria": "string",
      "precioUnitario": 0,
      "cantidad": 0,
      "subtotal": 0
    }
  ]
}
```

### GET /api/ventas/usuario/:username
Obtener ventas de un usuario específico
- **Auth**: Bearer token
- Usuario puede ver sus propias compras

---

## 🛒 Carritos (Carts)

**Requiere**: Bearer token

### GET /api/carts?username=USERNAME
Obtener carrito por username
- Si no existe, crea uno vacío

### POST /api/carts
Crear o actualizar carrito
- **Body**:
```json
{
  "username": "string",
  "items": [
    {
      "id": "string",
      "nombre": "string",
      "categoria": "string",
      "precio": 0,
      "cantidad": 0
    }
  ]
}
```

### PATCH /api/carts/:username/limpiar
Limpiar carrito (vaciar items)

---

## 📊 Estadísticas

**Requiere**: Bearer token + rol admin/superadmin

### GET /api/estadisticas/resumen
Obtener resumen general del año
- **Query params opcionales**:
  - `year`: año (default: año actual)
- **Respuesta**:
```json
{
  "year": 2025,
  "ventas": { "total": 10000000, "cantidad": 50 },
  "servicios": { "total": 500000, "cantidad": 30 },
  "serviciosPendientes": 5,
  "ingresosTotales": 10500000
}
```

### GET /api/estadisticas/ventas/categorias
Ventas agrupadas por categoría de producto
- **Query params opcionales**:
  - `year`: año (default: todos)
- **Respuesta**:
```json
{
  "year": "2025",
  "categorias": {
    "celulares": { "total": 5000000, "cantidad": 20 },
    "computadoras": { "total": 3000000, "cantidad": 10 },
    "accesorios": { "total": 200000, "cantidad": 50 }
  }
}
```

### GET /api/estadisticas/ventas/meses
Ventas agrupadas por mes
- **Query params opcionales**:
  - `year`: año (default: año actual)
- **Respuesta**:
```json
{
  "year": 2025,
  "meses": [
    {
      "mes": 1,
      "nombre": "enero",
      "total": 500000,
      "cantidad": 5,
      "ventas": [{ "id": "...", "username": "...", "fecha": "...", "total": 100000, "productos": [...] }]
    },
    ...
  ]
}
```

### GET /api/estadisticas/servicios/tipos
Servicios entregados agrupados por tipo
- **Query params opcionales**:
  - `year`: año (default: todos)
- **Respuesta**:
```json
{
  "year": "2025",
  "tipos": [
    { "tipo": "celulares", "cantidad": 50, "totalIngresos": 300000 },
    { "tipo": "computadora", "cantidad": 20, "totalIngresos": 150000 },
    { "tipo": "parlantes", "cantidad": 10, "totalIngresos": 50000 }
  ]
}
```

### GET /api/estadisticas/servicios/meses
Servicios entregados agrupados por mes
- **Query params opcionales**:
  - `year`: año (default: año actual)
- **Respuesta**:
```json
{
  "year": 2025,
  "meses": [
    {
      "mes": 1,
      "nombre": "enero",
      "cantidad": 5,
      "totalIngresos": 50000,
      "servicios": [{ "id": "...", "cliente": "...", "tipo": "celulares", ... }]
    },
    ...
  ]
}
```

---

## 📊 Resumen de Autorizaciones

| Endpoint | Público | User | Admin | SuperAdmin |
|----------|---------|------|-------|------------|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| POST /auth/register | ✅ | ✅ | ✅ | ✅ |
| GET /auth/me | - | ✅ | ✅ | ✅ |
| GET /productos | ✅ | ✅ | ✅ | ✅ |
| POST/PUT/DELETE productos | - | - | ✅ | ✅ |
| Usuarios (todos) | - | - | ✅ | ✅ |
| Clientes (todos) | - | - | ✅ | ✅ |
| Servicios (todos) | - | - | ✅ | ✅ |
| GET /ventas | - | - | ✅ | ✅ |
| POST /ventas | - | ✅ | ✅ | ✅ |
| GET /ventas/usuario/:username | - | ✅* | ✅ | ✅ |
| Carts (todos) | - | ✅ | ✅ | ✅ |
| Estadísticas (todos) | - | - | ✅ | ✅ |

*Usuario solo puede ver sus propias ventas

---

## 🔒 Headers de Autenticación

Para endpoints protegidos, incluir:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Ejemplos de uso

### Login y uso del token
```javascript
// 1. Login
const loginRes = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: '1234' })
});
const { token } = await loginRes.json();

// 2. Usar token en requests protegidos
const clientesRes = await fetch('http://localhost:4000/api/clientes', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const clientes = await clientesRes.json();
```

### Crear un servicio
```javascript
const servicioRes = await fetch('http://localhost:4000/api/servicios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cliente: '690179144820e56861696df8',
    marcaProducto: 'Samsung',
    tipoServicio: 'celulares',
    detalles: 'Cambio de pantalla',
    presupuesto: {
      items: [{ descripcion: 'Pantalla AMOLED', costo: 15000 }],
      subtotal: 15000,
      iva: 0,
      total: 15000
    },
    estado: 'pendiente',
    fechaEntrada: new Date()
  })
});
```

### Registrar una venta
```javascript
const ventaRes = await fetch('http://localhost:4000/api/ventas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'gaston',
    totalVenta: 350000,
    metodoPago: 'Tarjeta',
    estado: 'Completado',
    productosComprados: [
      {
        productId: '1',
        nombre: 'Samsung Galaxy A54',
        categoria: 'celulares',
        precioUnitario: 350000,
        cantidad: 1,
        subtotal: 350000
      }
    ]
  })
});
```

---

## ✅ Estado del proyecto

- ✅ Autenticación JWT completa
- ✅ Usuarios CRUD con protección de superadmin
- ✅ Productos CRUD con validaciones
- ✅ Clientes CRUD
- ✅ Servicios CRUD + marcar entregado
- ✅ Ventas con filtros por usuario/fecha
- ✅ Carritos por usuario
- ✅ Estadísticas completas (agregaciones por mes, categoría, tipo)

---

## 📝 Próximos pasos

1. ✅ ~~Crear endpoints de estadísticas (agregaciones)~~
2. Actualizar frontend para consumir esta API
3. Agregar validaciones adicionales
4. Implementar paginación en listados
5. Agregar más filtros y búsquedas
