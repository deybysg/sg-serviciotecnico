# 🚀 Guía de Implementación de Mercado Pago

## 📋 Paso 1: Instalar dependencias backend

```bash
cd backend
npm install mercadopago nodemailer pdfkit
```

## 🔑 Paso 2: Obtener credenciales de Mercado Pago

1. Ve a https://www.mercadopago.com.ar/developers
2. Inicia sesión o crea una cuenta
3. Ve a "Tus integraciones" → "Credenciales"
4. Copia el **Access Token** (usa el de prueba primero)

## ⚙️ Paso 3: Configurar variables de entorno

Crea/edita `backend/.env`:

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=tu-access-token-aqui

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Email (para enviar comprobantes)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion-gmail
STORE_NAME=Tu Tienda
```

### Cómo obtener contraseña de aplicación de Gmail:

1. Ve a tu cuenta de Google → Seguridad
2. Activa "Verificación en 2 pasos"
3. Busca "Contraseñas de aplicaciones"
4. Genera una nueva para "Correo"
5. Copia la contraseña de 16 caracteres

## 🔧 Paso 4: Registrar rutas en el backend

Edita `backend/index.js` o donde registres las rutas:

```javascript
import mercadopagoRoutes from './src/routes/mercadopago.routes.js';

// ... otras rutas

app.use('/api/mercadopago', mercadopagoRoutes);
```

## 🌐 Paso 5: Agregar rutas en el frontend

Edita `src/App.jsx`:

```javascript
import PagoExitoso from './pages/PagoExitoso';
import PagoFallido from './pages/PagoFallido';
import PagoPendiente from './pages/PagoPendiente';

// Dentro de <Routes>
<Route path="/pago-exitoso" element={<PagoExitoso />} />
<Route path="/pago-fallido" element={<PagoFallido />} />
<Route path="/pago-pendiente" element={<PagoPendiente />} />
```

## 🧪 Paso 6: Probar en modo prueba

### Tarjetas de prueba de Mercado Pago:

**Aprobada:**
- Número: 5031 7557 3453 0604
- CVV: 123
- Vencimiento: cualquier fecha futura
- Nombre: APRO

**Rechazada:**
- Número: 5031 4332 1540 6351
- CVV: 123
- Vencimiento: cualquier fecha futura
- Nombre: OTHE

## 📧 Paso 7: Configurar webhook para producción

Para recibir notificaciones de pago en producción:

1. Despliega tu backend en un servidor con URL pública (ej: Render, Railway, etc.)
2. En el panel de Mercado Pago → Webhooks
3. Agrega la URL: `https://tu-dominio.com/api/mercadopago/webhook`

## 🎯 Funcionalidades implementadas

✅ **Expiración del carrito (24 horas)**
- Los productos se eliminan automáticamente después de 24h
- Alerta al agregar el primer producto
- Verificación antes de pagar

✅ **Flujo de pago completo**
- Solicitar email de confirmación
- Crear preferencia de pago en MP
- Redirigir a Mercado Pago
- Procesar respuesta (exitoso/fallido/pendiente)

✅ **Email automático con comprobante**
- Se envía al email ingresado
- Incluye PDF con detalles de compra
- Información de retiro en local

✅ **Actualización automática**
- Registra venta en historial
- Reduce stock de productos
- Vacía el carrito

## 🔄 Cómo funciona el flujo:

1. Usuario hace clic en "Finalizar compra"
2. Se solicita email de confirmación
3. Se crea preferencia en Mercado Pago
4. Usuario es redirigido a MP para pagar
5. MP procesa el pago
6. MP envía notificación al webhook
7. Backend recibe notificación:
   - Crea venta en BD
   - Actualiza stock
   - Envía email con comprobante
8. Usuario es redirigido a página de resultado

## ⚠️ Importante para producción

- Cambia las credenciales de prueba por las de producción
- Usa HTTPS en producción
- Configura correctamente el webhook
- Verifica que el email puede enviar correos

## 🐛 Solución de problemas

**Error: "No se pudo crear preferencia"**
- Verifica tu Access Token
- Asegúrate de que las URLs estén correctas

**No llega el email:**
- Verifica las credenciales de Gmail
- Revisa que la contraseña de aplicación sea correcta
- Chequea la carpeta de spam

**Webhook no funciona:**
- Asegúrate de que tu backend sea accesible públicamente
- Verifica los logs del servidor
