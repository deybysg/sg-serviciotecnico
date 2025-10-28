# 📋 Sistema SG - Tablero de Proyecto

> **Proyecto:** Sistema de Gestión de Servicios y Ventas  
> **Stack:** React + Vite + json-server  
> **Estado:** En desarrollo activo  
> **Última actualización:** 27 de octubre de 2025

---

## 🎯 COLUMNA 1: COMPLETADAS ✅

### ✅ Comprobante de Ventas Personalizado
**Prioridad:** Alta 🔴  
**Categoría:** Frontend / Documentos  
**Estado:** ✅ Completado

**Descripción:**
- Sistema de comprobantes específico para ventas sin QR
- Diseño moderno y profesional
- Botones de imprimir/descargar funcionales
- Overlay responsive que se adapta a móviles
- Información completa de la venta (productos, totales, fecha, cliente)

**Archivos modificados:**
- `src/pages/ComprobanteVenta.jsx`
- `src/pages/ComprobanteVenta.css`
- `src/App.jsx` (ruta `/comprobante/:id`)

---

### ✅ Modal de Compras con Overlay
**Prioridad:** Alta 🔴  
**Categoría:** Frontend / UX  
**Estado:** ✅ Completado

**Descripción:**
- Página MisCompras con resumen de compras
- Botón "Ver historial" que abre modal overlay
- Lista de compras con detalles expandibles
- Botón "Ver comprobante" por cada compra
- DisplayId visual corto para mejor UX
- Formateo de moneda y fechas en español

**Archivos modificados:**
- `src/pages/MisComprasModal.jsx`
- `src/pages/MisComprasModal.css`

---

### ✅ Estilos Responsive Móvil
**Prioridad:** Media 🟡  
**Categoría:** Frontend / UI  
**Estado:** ✅ Completado

**Descripción:**
- Botón cerrar (X) fijo en la parte superior
- Estilos completamente responsive para móviles
- Media queries para <=480px y <=768px
- Scroll horizontal automático en tablas
- Paddings optimizados para pantallas pequeñas
- Botones táctiles más grandes en móvil

**Archivos modificados:**
- `src/pages/MisComprasModal.css`

---

## 🔄 COLUMNA 2: EN PROGRESO 🚧

### 🎨 Estilos Responsivos para Desktop
**Prioridad:** Media 🟡  
**Categoría:** Frontend / UI  
**Estado:** 🔄 En progreso (80%)

**Descripción:**
Añadir media queries para pantallas grandes (min-width: 1024px) que mejoren la experiencia en desktop:
- Ampliar ancho del modal (max-width: 1200px)
- Ajustar paddings para aprovechar espacio
- Mejorar visualización de tablas con más columnas
- Posicionar botón cerrar dentro del contenido del modal
- Grid de productos más espacioso

**Archivos a modificar:**
- `src/pages/MisComprasModal.css`

**Tareas pendientes:**
- [ ] Agregar media query @media (min-width: 1024px)
- [ ] Expandir ancho del modal
- [ ] Ajustar grid de productos
- [ ] Mejorar espaciado de botones

---

## 📝 COLUMNA 3: POR HACER (ALTA PRIORIDAD) 🔴

### 🔐 Sistema de Admin/SuperAdmin
**Prioridad:** Alta 🔴  
**Categoría:** Backend / Seguridad  
**Estimación:** 2-3 días

**Descripción:**
Implementar roles jerárquicos completos con tres niveles de acceso:

**Backend:**
- Middleware de validación de roles
- Rutas protegidas según nivel de acceso
- Endpoints para CRUD de usuarios (solo superadmin)
- Validación que impida modificar/eliminar superadmin
- Seed de superadmin inicial en db.json

**Frontend:**
- Actualizar `PrivateRoute.jsx` para aceptar arrays de roles
- Ocultar/mostrar opciones según rol del usuario
- Panel "Crear Admin" visible solo para superadmin
- Modificar `Admin.jsx` con permisos condicionales

**Archivos a modificar:**
- `src/context/AuthContext.jsx`
- `src/components/PrivateRoute.jsx`
- `src/pages/Admin.jsx`
- `db.json` (seed superadmin)
- Backend middleware (crear nuevo)

**Criterios de aceptación:**
- [ ] SuperAdmin puede crear/editar/eliminar admins
- [ ] Admin puede gestionar productos/servicios pero no usuarios
- [ ] User solo puede ver su historial y hacer compras
- [ ] SuperAdmin no puede ser eliminado ni degradado

---

### 🛒 Carrito - Integración Completa
**Prioridad:** Alta 🔴  
**Categoría:** Frontend / Backend  
**Estimación:** 3-4 días

**Descripción:**
Restaurar y mejorar la funcionalidad completa del carrito de compras:

**Funcionalidades:**
- Persistencia en localStorage + sincronización con backend
- Checkout flow completo con validaciones
- Validación de stock antes de agregar
- Cálculo automático de subtotales, impuestos y descuentos
- Aplicar cupones de descuento
- Confirmación de compra con generación de comprobante
- Actualización de inventario post-venta

**Archivos a crear/modificar:**
- `src/context/CartContext.jsx` (reactivar)
- `src/pages/Carrito.jsx` (mejorar)
- `src/pages/Checkout.jsx` (crear nuevo)
- `src/services/cartService.js` (expandir)

**Criterios de aceptación:**
- [ ] Agregar/quitar productos funciona correctamente
- [ ] Stock se valida en tiempo real
- [ ] Totales se calculan automáticamente
- [ ] Compra genera venta en db.json
- [ ] Inventario se actualiza post-compra

---

### 📄 Sistema de Descarga PDF
**Prioridad:** Alta 🔴  
**Categoría:** Frontend  
**Estimación:** 1-2 días

**Descripción:**
Implementar generación y descarga real de comprobantes en PDF:

**Funcionalidades:**
- Usar jsPDF para generar PDF del comprobante
- Incluir logo de la empresa (configurable)
- Datos completos de la venta
- Tabla de productos formateada
- Información fiscal (CUIT, dirección)
- Botón de descarga funcional (no solo alert)
- Opción de enviar por email

**Archivos a modificar:**
- `src/pages/ComprobanteVenta.jsx`
- `src/services/pdfGenerator.js` (crear nuevo)

**Dependencias:**
- jsPDF (ya instalado)
- html2canvas (ya instalado)

**Criterios de aceptación:**
- [ ] Botón Descargar genera PDF real
- [ ] PDF incluye toda la información de la venta
- [ ] Diseño del PDF es profesional
- [ ] Funciona en todos los navegadores

---

## 📝 COLUMNA 4: POR HACER (MEDIA PRIORIDAD) 🟡

### 📊 Dashboard Admin - Estadísticas en Tiempo Real
**Prioridad:** Media 🟡  
**Categoría:** Frontend / Backend  
**Estimación:** 3-5 días

**Descripción:**
Mejorar EstadisticasAdmin.jsx con gráficos interactivos y KPIs:

**Funcionalidades:**
- Gráficos de ventas (Chart.js o Recharts)
- KPIs: ventas diarias/mensuales/anuales
- Productos más vendidos (top 10)
- Ingresos totales y proyecciones
- Filtros por rango de fechas
- Comparación de períodos
- Exportar reportes a PDF/Excel
- Dashboard responsive

**Librerías a instalar:**
- `recharts` o `chart.js`
- `react-to-print` para exportar

**Archivos a modificar:**
- `src/admin/EstadisticasAdmin.jsx`
- `src/admin/EstadisticasAdmin.css`

---

### 🔍 Búsqueda Avanzada y Filtros
**Prioridad:** Media 🟡  
**Categoría:** Frontend / UX  
**Estimación:** 2-3 días

**Descripción:**
Implementar sistema de búsqueda y filtros avanzados:

**Funcionalidades:**
- Búsqueda con debounce (300ms)
- Filtros por categoría, precio, disponibilidad
- Ordenamiento (precio, fecha, popularidad)
- Paginación eficiente (lazy loading)
- Resultados en tiempo real
- Guardar filtros en URL (query params)
- Limpiar filtros con un click

**Componentes a crear:**
- `src/components/SearchBar.jsx`
- `src/components/FilterPanel.jsx`
- `src/components/ProductGrid.jsx`

**Archivos a modificar:**
- `src/pages/Productos.jsx`
- `src/pages/Servicios.jsx`

---

### 🔔 Sistema de Notificaciones
**Prioridad:** Media 🟡  
**Categoría:** Frontend / Backend  
**Estimación:** 3-4 días

**Descripción:**
Crear sistema de notificaciones in-app:

**Funcionalidades:**
- Notificaciones de actualización de pedidos
- Cambios de estado de servicios
- Mensajes del admin
- Badge con contador de no leídas
- Panel de historial de notificaciones
- Marcado como leído/no leído
- Eliminar notificaciones
- Notificaciones push (opcional con service worker)

**Componentes a crear:**
- `src/components/NotificationBell.jsx`
- `src/components/NotificationPanel.jsx`
- `src/context/NotificationContext.jsx`

**Backend:**
- Endpoint GET /notificaciones/:userId
- Endpoint PATCH /notificaciones/:id (marcar leído)

---

### 📱 Progressive Web App (PWA)
**Prioridad:** Media 🟡  
**Categoría:** Frontend / DevOps  
**Estimación:** 2-3 días

**Descripción:**
Convertir la aplicación en PWA instalable:

**Funcionalidades:**
- Service Worker para cache y offline
- manifest.json completo
- Iconos en todos los tamaños necesarios
- Splash screen personalizado
- Funcionamiento offline básico (páginas visitadas)
- Actualización automática del service worker
- Notificaciones push (integrado con sistema de notificaciones)

**Archivos a crear:**
- `public/manifest.json`
- `public/service-worker.js`
- `public/icons/` (múltiples tamaños)

**Plugin Vite:**
- `vite-plugin-pwa`

---

## 📝 COLUMNA 5: POR HACER (BAJA PRIORIDAD) 🟢

### 💳 Integración de Pasarelas de Pago
**Prioridad:** Baja 🟢  
**Categoría:** Backend / Integraciones  
**Estimación:** 5-7 días

**Descripción:**
Integrar MercadoPago o Stripe para pagos reales:

**Funcionalidades:**
- Checkout seguro con formulario de pago
- Webhooks para confirmación automática
- Estado de pago en tiempo real
- Historial de transacciones
- Reintegros y devoluciones
- Métodos de pago: tarjeta, transferencia, QR

**Configuración:**
- Crear cuenta en MercadoPago Developers
- Configurar credenciales (public_key, access_token)
- Configurar webhook URL
- Testing con ambiente sandbox

---

### 📧 Sistema de Emails Automáticos
**Prioridad:** Baja 🟢  
**Categoría:** Backend  
**Estimación:** 3-4 días

**Descripción:**
Configurar envío automático de emails:

**Tipos de emails:**
- Confirmación de compra
- Actualizaciones de estado de servicio
- Recuperación de contraseña
- Newsletters y promociones
- Recordatorios de carrito abandonado

**Herramientas:**
- nodemailer + Gmail SMTP o SendGrid
- Plantillas HTML profesionales
- Variables dinámicas en templates

---

### 🔒 Hardening de Seguridad
**Prioridad:** Baja 🟢 (Alta cuando vaya a producción)  
**Categoría:** Backend / Seguridad  
**Estimación:** 4-5 días

**Checklist de seguridad:**
- [ ] Hash de contraseñas con bcrypt
- [ ] JWT para autenticación (reemplazar localStorage simple)
- [ ] Validación y sanitización de todos los inputs
- [ ] Protección CSRF
- [ ] Rate limiting en endpoints críticos
- [ ] HTTPS en producción
- [ ] Helmet.js para headers de seguridad
- [ ] Auditoría de dependencias (npm audit)
- [ ] Variables de entorno para secrets

---

### 📸 Sistema de Carga de Imágenes
**Prioridad:** Baja 🟢  
**Categoría:** Backend / Frontend  
**Estimación:** 3-4 días

**Descripción:**
Implementar upload y optimización de imágenes:

**Funcionalidades:**
- Upload desde admin de productos/servicios
- Validación de tamaño (max 5MB) y formato (jpg, png, webp)
- Compresión automática
- Redimensionamiento para thumbnails
- Almacenamiento en Cloudinary o AWS S3
- Lazy loading en el frontend
- Placeholder mientras carga

**Librerías:**
- `react-dropzone` para upload
- `sharp` para procesamiento (backend)
- Cloudinary SDK

---

### 📊 Google Analytics y Tracking
**Prioridad:** Baja 🟢  
**Categoría:** Analytics  
**Estimación:** 1-2 días

**Descripción:**
Integrar Google Analytics 4 o Plausible:

**Métricas a trackear:**
- Páginas vistas
- Conversiones (compras completadas)
- Funnel de ventas
- Tiempo en página
- Bounce rate
- Eventos personalizados (agregar al carrito, ver producto)

**Implementación:**
- Google Analytics 4 con gtag.js
- React GA4 wrapper
- Event tracking en componentes clave

---

### 🧪 Suite de Testing Completa
**Prioridad:** Baja 🟢 (Alta cuando crezca el equipo)  
**Categoría:** Testing / QA  
**Estimación:** 5-7 días

**Descripción:**
Implementar testing automatizado:

**Tipos de tests:**
- Unit tests (Vitest/Jest) para funciones puras
- Integration tests (React Testing Library) para componentes
- E2E tests (Playwright/Cypress) para flujos críticos
- Coverage mínimo: 70%
- CI/CD con GitHub Actions que corra tests automáticamente

**Flows críticos a testear:**
- Login/Logout
- Agregar al carrito y checkout
- Crear producto (admin)
- Cambiar estado de servicio

---

### 🗄️ Migración a Base de Datos Real
**Prioridad:** Baja 🟢 (Alta cuando escale)  
**Categoría:** Backend / Database  
**Estimación:** 7-10 días

**Descripción:**
Migrar de json-server a PostgreSQL o MongoDB:

**Tareas:**
- Diseñar schema/modelo de datos
- Configurar ORM (Prisma/Sequelize para SQL, Mongoose para Mongo)
- Crear migraciones
- Definir relaciones entre entidades
- Crear índices para optimización
- Configurar backups automáticos
- Escribir queries optimizadas
- Transacciones para operaciones críticas

**Schema principales:**
- Usuarios (con hash de password)
- Productos
- Servicios
- Ventas (con relación a productos)
- Carritos
- Notificaciones

---

### 🚀 Deploy a Producción
**Prioridad:** Baja 🟢 (Alta cuando esté listo)  
**Categoría:** DevOps  
**Estimación:** 2-3 días

**Descripción:**
Configurar deploy en servicios cloud:

**Frontend:**
- Vercel o Netlify
- Build optimizado
- Variables de entorno
- Dominio custom
- SSL automático
- CDN global

**Backend:**
- Render o Railway
- Base de datos managed (PostgreSQL en Render)
- Variables de entorno seguras
- Monitoring con Sentry
- Logs centralizados
- Health checks

**CI/CD:**
- GitHub Actions para deploy automático
- Preview deployments en PRs
- Rollback automático en caso de error

---

### 📱 Chat en Vivo con Socket.io
**Prioridad:** Baja 🟢  
**Categoría:** Backend / Frontend  
**Estimación:** 5-6 días

**Descripción:**
Implementar chat en tiempo real usuario-admin:

**Funcionalidades:**
- Conexión WebSocket con Socket.io
- Chat uno a uno (usuario - admin)
- Historial de conversaciones persistente
- Notificación de mensajes nuevos
- Indicador de "escribiendo..."
- Adjuntar imágenes
- Estado online/offline
- Panel de admin con lista de chats activos

**Stack:**
- Socket.io (backend y cliente)
- Componentes React para UI
- Almacenar mensajes en base de datos

---

### 🎯 Optimización SEO
**Prioridad:** Baja 🟢  
**Categoría:** Frontend / Marketing  
**Estimación:** 2-3 días

**Descripción:**
Mejorar SEO para posicionamiento:

**Optimizaciones:**
- Meta tags dinámicos por página
- Generar sitemap.xml automáticamente
- robots.txt configurado
- Structured Data (JSON-LD) para productos
- URLs amigables (slugs en lugar de IDs)
- Open Graph tags para redes sociales
- Twitter Cards
- Lighthouse score >90

**Herramientas:**
- react-helmet-async para meta tags
- Sitemap generator
- Google Search Console

---

### 📦 Control de Inventario Avanzado
**Prioridad:** Baja 🟢  
**Categoría:** Backend / Admin  
**Estimación:** 4-5 días

**Descripción:**
Sistema completo de gestión de inventario:

**Funcionalidades:**
- Alertas automáticas de stock bajo
- Reserva temporal de stock al agregar al carrito
- Actualización automática post-venta
- Historial de movimientos de inventario
- Reportes de inventario exportables
- Predicción de reposición (básica con promedio de ventas)
- Múltiples ubicaciones/almacenes (opcional)

**Panel Admin:**
- Vista de productos con stock actual
- Gráfico de movimientos
- Filtros por categoría y estado

---

### 🎨 Modo Oscuro/Claro
**Prioridad:** Baja 🟢  
**Categoría:** Frontend / UI  
**Estimación:** 2-3 días

**Descripción:**
Implementar theme switcher:

**Funcionalidades:**
- Toggle entre modo oscuro y claro
- Persistencia de preferencia en localStorage
- Respeto de preferencia del sistema (prefers-color-scheme)
- Transiciones suaves entre temas
- Paleta de colores accesible (WCAG AA)
- Iconos y botones adaptados al tema

**Implementación:**
- Context API para manejar tema global
- CSS variables para colores
- Toggle en Navbar

---

## 📊 RESUMEN DEL PROYECTO

### Estadísticas Generales
- **Total de tareas:** 23
- **Completadas:** 3 (13%)
- **En progreso:** 1 (4%)
- **Pendientes:** 19 (83%)

### Por Prioridad
- **Alta 🔴:** 4 tareas
- **Media 🟡:** 5 tareas
- **Baja 🟢:** 11 tareas

### Por Categoría
- **Frontend:** 9 tareas
- **Backend:** 7 tareas
- **UI/UX:** 4 tareas
- **Seguridad:** 2 tareas
- **DevOps:** 2 tareas
- **Integraciones:** 2 tareas

### Stack Tecnológico Actual
- **Frontend:** React 19 + Vite
- **Routing:** React Router DOM 7
- **State:** Context API
- **Styling:** CSS modules
- **UI Components:** React Icons, SweetAlert2
- **Backend (temporal):** json-server
- **PDF:** jsPDF, html2canvas
- **QR Codes:** qrcode, qrcode.react

---

## 🎯 ROADMAP SUGERIDO

### Fase 1: Core Features (1-2 semanas)
1. ✅ Estilos responsive desktop
2. 🔐 Sistema de roles Admin/SuperAdmin
3. 🛒 Carrito completo
4. 📄 Descarga de PDF

### Fase 2: Admin Tools (2-3 semanas)
5. 📊 Dashboard con estadísticas
6. 🔍 Búsqueda y filtros avanzados
7. 🔔 Sistema de notificaciones
8. 📦 Control de inventario

### Fase 3: Growth Features (3-4 semanas)
9. 📱 PWA
10. 💳 Pasarela de pagos
11. 📧 Emails automáticos
12. 📸 Upload de imágenes

### Fase 4: Scale & Production (4-6 semanas)
13. 🔒 Hardening de seguridad
14. 🗄️ Migración a DB real
15. 🧪 Testing completo
16. 🚀 Deploy a producción

### Fase 5: Advanced Features (ongoing)
17. 📱 Chat en vivo
18. 🎯 SEO optimization
19. 📊 Analytics
20. 🎨 Modo oscuro

---

## 📞 CONTACTO Y RECURSOS

### Links Útiles
- 📂 [Repositorio GitHub](https://github.com/Gaston5901/PROYECTO-FF)
- 📖 [Documentación React](https://react.dev)
- 📖 [Documentación Vite](https://vitejs.dev)
- 📖 [React Router](https://reactrouter.com)

### Equipo
- **Desarrollador:** Gastón
- **Proyecto:** Sistema SG
- **Fecha inicio:** 2025

---

> 💡 **Tip:** Este documento está vivo y debe actualizarse regularmente. Cada vez que completes una tarea, márcala como ✅ y mueve a la columna "Completadas".

> 🚀 **Próximos pasos inmediatos:** Completar estilos desktop y comenzar con el sistema de roles para asegurar la app antes de agregar más features.
