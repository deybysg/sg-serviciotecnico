# 📊 API de Estadísticas - Guía de uso

## Endpoints disponibles

Todos requieren autenticación con Bearer token y rol admin/superadmin.

---

## 1. Resumen General

**GET** `/api/estadisticas/resumen?year=2025`

Dashboard principal con totales del año.

### Respuesta:
```json
{
  "year": 2025,
  "ventas": {
    "total": 10085000,
    "cantidad": 10
  },
  "servicios": {
    "total": 76055,
    "cantidad": 13
  },
  "serviciosPendientes": 2,
  "ingresosTotales": 10161055
}
```

### Uso en frontend:
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:4000/api/estadisticas/resumen?year=2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('Ingresos totales:', data.ingresosTotales);
```

---

## 2. Ventas por Categoría

**GET** `/api/estadisticas/ventas/categorias?year=2025`

Distribución de ventas por categoría de productos (para gráfico de torta).

### Respuesta:
```json
{
  "year": "2025",
  "categorias": {
    "celulares": {
      "total": 1200000,
      "cantidad": 2
    },
    "computadoras": {
      "total": 8235000,
      "cantidad": 7
    },
    "accesorios": {
      "total": 650000,
      "cantidad": 1
    }
  }
}
```

### Para gráfico de torta:
```javascript
const response = await fetch('http://localhost:4000/api/estadisticas/ventas/categorias?year=2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { categorias } = await response.json();

// Convertir a array para Chart.js o similar
const chartData = Object.entries(categorias).map(([nombre, data]) => ({
  categoria: nombre,
  total: data.total,
  cantidad: data.cantidad
}));
```

---

## 3. Ventas por Mes

**GET** `/api/estadisticas/ventas/meses?year=2025`

Ventas mensuales del año (para gráfico de barras con detalle por mes).

### Respuesta:
```json
{
  "year": 2025,
  "meses": [
    {
      "mes": 1,
      "nombre": "enero",
      "total": 0,
      "cantidad": 0,
      "ventas": []
    },
    ...
    {
      "mes": 10,
      "nombre": "octubre",
      "total": 10085000,
      "cantidad": 10,
      "ventas": [
        {
          "id": "690179144820e56861696dfa",
          "username": "gabi",
          "fecha": "2025-10-17T06:59:39.701Z",
          "total": 1000000,
          "productos": [
            {
              "productId": "2",
              "nombre": "Notebook Lenovo V15",
              "precioUnitario": 650000,
              "cantidad": 1,
              "subtotal": 650000
            },
            ...
          ]
        },
        ...
      ]
    }
  ]
}
```

### Para gráfico de barras con modal:
```javascript
const response = await fetch('http://localhost:4000/api/estadisticas/ventas/meses?year=2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { meses } = await response.json();

// Para gráfico de barras
const labels = meses.map(m => m.nombre);
const totales = meses.map(m => m.total);

// Al hacer click en una barra, mostrar modal con:
// meses[index].ventas (detalle de cada venta)
```

---

## 4. Servicios por Tipo

**GET** `/api/estadisticas/servicios/tipos?year=2025`

Distribución de servicios entregados por tipo (para gráfico de torta).

### Respuesta:
```json
{
  "year": "2025",
  "tipos": [
    {
      "tipo": "celulares",
      "cantidad": 8,
      "totalIngresos": 51412
    },
    {
      "tipo": "parlantes",
      "cantidad": 3,
      "totalIngresos": 4665
    },
    {
      "tipo": "computadora",
      "cantidad": 1,
      "totalIngresos": 4555
    },
    {
      "tipo": "otros",
      "cantidad": 1,
      "totalIngresos": 0
    }
  ]
}
```

### Para gráfico de torta:
```javascript
const response = await fetch('http://localhost:4000/api/estadisticas/servicios/tipos?year=2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { tipos } = await response.json();

// Filtrar "otros" si no querés mostrarlo
const tiposFiltrados = tipos.filter(t => t.tipo !== 'otros');
```

---

## 5. Servicios por Mes

**GET** `/api/estadisticas/servicios/meses?year=2025`

Servicios entregados por mes (para gráfico de barras con detalle).

### Respuesta:
```json
{
  "year": 2025,
  "meses": [
    {
      "mes": 1,
      "nombre": "enero",
      "cantidad": 0,
      "totalIngresos": 0,
      "servicios": []
    },
    ...
    {
      "mes": 10,
      "nombre": "octubre",
      "cantidad": 13,
      "totalIngresos": 76055,
      "servicios": [
        {
          "id": "690179144820e56861696dfe",
          "cliente": "690179144820e56861696df7",
          "tipo": "celulares",
          "marca": "jhjh",
          "fecha": "2025-10-07T00:00:00.000Z",
          "total": 151510
        },
        ...
      ]
    }
  ]
}
```

### Para gráfico de barras con modal:
```javascript
const response = await fetch('http://localhost:4000/api/estadisticas/servicios/meses?year=2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { meses } = await response.json();

// Para gráfico de barras
const labels = meses.map(m => m.nombre);
const cantidades = meses.map(m => m.cantidad);

// Al hacer click, mostrar modal con:
// meses[index].servicios (detalle de cada servicio)
```

---

## 🎨 Integración con tu frontend actual

### Reemplazar en EstadisticasAdmin.jsx:

**Antes (con db.json):**
```javascript
const res = await fetch("http://localhost:3001/ventas");
const ventas = await res.json();
// Procesar manualmente...
```

**Después (con API):**
```javascript
const token = localStorage.getItem('token');

// Ventas por categoría
const resCateg = await fetch('http://localhost:4000/api/estadisticas/ventas/categorias?year=2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { categorias } = await resCateg.json();

// Ventas por mes
const resMeses = await fetch('http://localhost:4000/api/estadisticas/ventas/meses?year=2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { meses } = await resMeses.json();
```

---

## 📌 Notas importantes

1. **Solo servicios entregados**: Los endpoints de servicios solo cuentan los que tienen `estado: "entregado"` y `fechaSalida` != null.

2. **Filtro por año**: Si no pasás `?year=`, las estadísticas de ventas/servicios por categoría/tipo traen TODOS los años.

3. **Meses vacíos**: Los endpoints por mes siempre devuelven 12 meses. Los que no tienen datos tienen cantidad/total en 0.

4. **Detalle en modales**: Los arrays `ventas` y `servicios` dentro de cada mes contienen todos los registros, listos para mostrar en un modal.

5. **Categorías de productos**: Asegurate que todos los productos en la DB tengan una `categoria` válida ("celulares", "computadoras", "accesorios").

---

## ✅ Backend completo

Con estos endpoints, tu backend está listo para:
- ✅ Autenticación JWT
- ✅ CRUD completo de todos los recursos
- ✅ Estadísticas con agregaciones de MongoDB
- ✅ Filtros por año, mes, usuario
- ✅ Protección de rutas por roles

**Próximo paso**: Actualizar el frontend para consumir esta API en lugar de json-server.
