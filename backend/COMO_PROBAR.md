# 🧪 Cómo probar la API de Autenticación JWT

## Opción 1: Con PowerShell (Windows)

### 1. Login con superadmin
```powershell
$body = @{
    username = "superadmin"
    password = "1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method Post -Body $body -ContentType "application/json"

# Ver respuesta
$response

# Guardar token para siguiente request
$token = $response.token
```

### 2. Obtener perfil con el token
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/me" -Headers $headers
```

### 3. Listar usuarios (requiere admin)
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/usuarios" -Headers $headers
```

### 4. Registrar nuevo usuario
```powershell
$newUser = @{
    username = "test_usuario"
    password = "password123"
    email = "test@test.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" -Method Post -Body $newUser -ContentType "application/json"
```

---

## Opción 2: Con Thunder Client (extensión de VS Code)

1. Instala la extensión "Thunder Client" en VS Code
2. Crea una nueva colección "Auth Tests"
3. Agrega estos requests:

### Request 1: Login
- **Method**: POST
- **URL**: `http://localhost:4000/api/auth/login`
- **Body** (JSON):
```json
{
  "username": "superadmin",
  "password": "1234"
}
```

### Request 2: Get Profile
- **Method**: GET
- **URL**: `http://localhost:4000/api/auth/me`
- **Headers**:
  - Key: `Authorization`
  - Value: `Bearer TU_TOKEN_AQUI`

### Request 3: Listar Usuarios
- **Method**: GET
- **URL**: `http://localhost:4000/api/usuarios`
- **Headers**:
  - Key: `Authorization`
  - Value: `Bearer TU_TOKEN_AQUI`

---

## Opción 3: Con Postman

1. Abre Postman
2. Importa esta colección o crea los requests manualmente

### Login
- POST: `http://localhost:4000/api/auth/login`
- Body (raw JSON):
```json
{
  "username": "superadmin",
  "password": "1234"
}
```

### Get Profile (con token)
- GET: `http://localhost:4000/api/auth/me`
- Headers: `Authorization: Bearer TU_TOKEN`

---

## Opción 4: Desde el navegador (solo GET)

Abre la consola del navegador (F12) y ejecuta:

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'superadmin', password: '1234' })
});

const loginData = await loginResponse.json();
console.log('Login:', loginData);

// Guardar token
const token = loginData.token;

// 2. Get profile
const profileResponse = await fetch('http://localhost:4000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const profileData = await profileResponse.json();
console.log('Profile:', profileData);

// 3. Listar usuarios
const usersResponse = await fetch('http://localhost:4000/api/usuarios', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const usersData = await usersResponse.json();
console.log('Usuarios:', usersData);
```

---

## ✅ Respuestas esperadas

### Login exitoso:
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "673014d8e5fc4b2d441d7890",
    "username": "superadmin",
    "role": "superadmin",
    "isProtected": true
  }
}
```

### Get Profile:
```json
{
  "_id": "673014d8e5fc4b2d441d7890",
  "username": "superadmin",
  "role": "superadmin",
  "isProtected": true,
  "createdAt": "2025-10-28T...",
  "updatedAt": "2025-10-28T..."
}
```

### Error sin token (401):
```json
{
  "mensaje": "No autorizado. Token no proporcionado."
}
```

### Error sin permisos (403):
```json
{
  "mensaje": "No tienes permisos para realizar esta acción."
}
```

---

## 🔥 Quick Test (copiar y pegar)

**En PowerShell:**
```powershell
# Login y guardar token
$loginBody = '{"username":"superadmin","password":"1234"}'
$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token
Write-Host "Token obtenido: $($token.Substring(0,50))..."

# Ver perfil
Invoke-RestMethod -Uri "http://localhost:4000/api/auth/me" -Headers @{Authorization="Bearer $token"}
```

---

## 📝 Notas importantes

1. El backend debe estar corriendo en puerto 4000
2. MongoDB debe estar activo y conectado
3. Los tokens expiran en 7 días (configurable en `src/config.js`)
4. El superadmin está protegido contra edición/eliminación
5. Solo admin y superadmin pueden gestionar usuarios
