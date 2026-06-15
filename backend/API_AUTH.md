# API de Autenticación JWT - Endpoints

## Base URL
```
http://localhost:4000/api
```

## Endpoints disponibles

### 1. POST /api/auth/login
Login de usuario

**Body:**
```json
{
  "username": "superadmin",
  "password": "1234"
}
```

**Respuesta exitosa:**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "superadmin",
    "role": "superadmin",
    "isProtected": true
  }
}
```

### 2. POST /api/auth/register
Registro de nuevo usuario

**Body:**
```json
{
  "username": "nuevo_usuario",
  "password": "password123",
  "email": "usuario@email.com"
}
```

**Respuesta exitosa:**
```json
{
  "mensaje": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "nuevo_usuario",
    "role": "user",
    "isProtected": false
  }
}
```

### 3. GET /api/auth/me
Obtener perfil del usuario autenticado (requiere token)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "superadmin",
  "role": "superadmin",
  "isProtected": true,
  "createdAt": "2025-10-28T...",
  "updatedAt": "2025-10-28T..."
}
```

---

## Rutas protegidas de Usuarios

### GET /api/usuarios
Listar todos los usuarios (requiere token y rol admin/superadmin)

**Headers:**
```
Authorization: Bearer TOKEN_AQUI
```

### POST /api/usuarios
Crear nuevo usuario (requiere token y rol admin/superadmin)

**Headers:**
```
Authorization: Bearer TOKEN_AQUI
```

**Body:**
```json
{
  "username": "nuevo_admin",
  "password": "password123",
  "role": "admin"
}
```

### PUT /api/usuarios/:id
Actualizar usuario (requiere token y rol admin/superadmin, protege al superadmin)

### DELETE /api/usuarios/:id
Eliminar usuario (requiere token y rol admin/superadmin, protege al superadmin)

---

## Cómo usar en el frontend

### 1. Login
```javascript
const response = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: '1234' })
});

const data = await response.json();
// Guardar token en localStorage
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### 2. Hacer requests autenticados
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:4000/api/usuarios', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Rehidratar sesión al cargar la app
```javascript
const token = localStorage.getItem('token');

if (token) {
  const response = await fetch('http://localhost:4000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const user = await response.json();
    // Usuario autenticado, actualizar estado
  } else {
    // Token inválido, limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
```

---

## Probar con cURL

### Login:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"superadmin\",\"password\":\"1234\"}"
```

### Obtener perfil (reemplaza TOKEN_AQUI):
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TOKEN_AQUI"
```

### Listar usuarios (requiere token de admin):
```bash
curl http://localhost:4000/api/usuarios \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

## Códigos de respuesta

- **200**: OK
- **201**: Creado exitosamente
- **400**: Bad Request (datos inválidos)
- **401**: No autorizado (sin token o token inválido)
- **403**: Prohibido (sin permisos para esta acción)
- **404**: No encontrado
- **500**: Error del servidor
