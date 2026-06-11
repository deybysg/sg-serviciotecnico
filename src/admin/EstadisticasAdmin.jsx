import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FaMoneyBillWave, FaShoppingCart, FaBoxOpen } from 'react-icons/fa';
import './EstadisticasAdmin.css';
import { api } from '../services/api';
import { useRef } from 'react';
import { shortId, toIdString } from '../utils/id';

// =================================================================
// 1. CONSTANTES Y FUNCIONES DE UTILIDAD
// =================================================================

const SERVICE_COLORS = {
    'celulares': '#4CAF50',
    'computadora': '#2196F3',
    'parlantes': '#FF9800',
    'otros': '#9C27B0',
};

const KNOWN_SERVICE_TYPES = ['celulares', 'computadora', 'parlantes', 'otros'];

const CATEGORY_COLORS = {
    'celulares': '#e74c3c',
    'computadoras': '#3498db',
    'accesorios': '#f39c12'
};

const getCategoryColor = (cat) => CATEGORY_COLORS[cat.toLowerCase()] || '#3498db';

const LOCALE = 'es-AR';


/**
 * Formatea un número como moneda.
 */
const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return '$0';
    return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(Number(value));
};

// =================================================================
// 2. LÓGICA DE CÁLCULO DE SERVICIOS (Tu función original)
// =================================================================

const analyzeServiceData = (services, filterYear, filterMonth) => {
    const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
    const activeServicesCount = services.filter(s => s.estado !== 'entregado').length;
    let filteredServices = services;

    if (filterYear && filterYear !== 'Todos') {
        filteredServices = filteredServices.filter(s =>
            s.fechaSalida && new Date(s.fechaSalida).getFullYear().toString() === filterYear
        );
    }
    if (filterMonth && filterMonth !== 'Todos') {
        filteredServices = filteredServices.filter(s =>
            s.fechaSalida && (new Date(s.fechaSalida).getMonth() + 1).toString().padStart(2, '0') === filterMonth
        );
    }

    const calculableServices = filteredServices.filter(s => s.presupuesto?.total > 0);

    const totalRevenue = calculableServices
        .filter(s => s.estado === 'entregado')
        .reduce((sum, s) => sum + s.presupuesto.total, 0);

    const deliveredServicesCount = filteredServices.filter(s => s.estado === 'entregado').length;

    let totalServiceDays = 0;
    let completedServicesWithDates = 0;

    filteredServices.filter(s => s.estado === 'entregado' && s.fechaEntrada && s.fechaSalida)
        .forEach(s => {
            const entry = new Date(s.fechaEntrada);
            const exit = new Date(s.fechaSalida);
            if (exit >= entry) {
                const diffTime = Math.abs(exit.getTime() - entry.getTime());
                const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY);
                totalServiceDays += diffDays;
                completedServicesWithDates += 1;
            }
        });

    const avgServiceDays = completedServicesWithDates > 0
        ? (totalServiceDays / completedServicesWithDates).toFixed(1)
        : 'N/A';

    const monthlyRevenueMap = {};
    const monthlyServiceDetails = {};

    // Usar filteredServices en lugar de calculableServices para incluir todos los servicios entregados
    filteredServices
        .filter(s => s.estado === 'entregado' && s.fechaSalida)
        .forEach(s => {
            const date = new Date(s.fechaSalida);
            const yearMonthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });

            const precioServicio = s.presupuesto?.total || 0;
            monthlyRevenueMap[yearMonthKey] = (monthlyRevenueMap[yearMonthKey] || 0) + precioServicio;

            if (!monthlyServiceDetails[yearMonthKey]) {
                monthlyServiceDetails[yearMonthKey] = {
                    label: monthLabel,
                    revenue: 0,
                    services: []
                };
            }
            monthlyServiceDetails[yearMonthKey].revenue += precioServicio;
            monthlyServiceDetails[yearMonthKey].services.push({
                id: s.id,
                tipo: s.tipoServicio || 'Otros',
                precio: precioServicio,
                fecha: s.fechaSalida,
                marca: s.marcaProducto || 'N/A'
            });
        });

    const monthlySalesData = Object.keys(monthlyRevenueMap)
        .sort()
        .map(key => ({
            key,
            month: monthlyServiceDetails[key].label,
            revenue: monthlyRevenueMap[key],
            details: monthlyServiceDetails[key].services
        }));

    // Gráfico de torta: solo servicios entregados con fechaSalida (respetando filtros de año/mes)
    const deliveredFilteredServices = filteredServices.filter(s => s.estado === 'entregado' && s.fechaSalida);
    
    const serviceTypeDistributionMap = deliveredFilteredServices.reduce((acc, s) => {
        const tipo = s.tipoServicio?.toLowerCase() || 'otros';
        const finalType = KNOWN_SERVICE_TYPES.includes(tipo) ? tipo : 'otros';

        acc[finalType] = (acc[finalType] || 0) + 1;
        return acc;
    }, {});

    const totalServicesForPie = Object.values(serviceTypeDistributionMap).reduce((sum, count) => sum + count, 0);

    const serviceTypeDistribution = Object.keys(serviceTypeDistributionMap)
        .map((type) => ({
            type,
            count: serviceTypeDistributionMap[type],
            percentage: totalServicesForPie > 0 ? ((serviceTypeDistributionMap[type] / totalServicesForPie) * 100).toFixed(1) : 0,
            color: SERVICE_COLORS[type] || SERVICE_COLORS['otros']
        }))
        .sort((a, b) => b.count - a.count)
        .filter(item => parseFloat(item.percentage) > 0);

    let currentAngle = 0;
    const gradientSegments = serviceTypeDistribution.map(item => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + (parseFloat(item.percentage) * 3.6);
        currentAngle = endAngle;
        return `${item.color} ${startAngle}deg ${endAngle}deg`;
    });

    const conicGradientCSS = gradientSegments.length > 0
        ? `conic-gradient(${gradientSegments.join(', ')})`
        : `var(--card-bg)`;

    return {
        totalRevenue,
        activeServicesCount,
        deliveredServicesCount,
        avgServiceDays,
        monthlySalesData,
        serviceTypeDistribution,
        totalServicesForPie,
        conicGradientCSS
    };
};

// =================================================================
// 3. NUEVA LÓGICA DE CÁLCULO DE VENTAS (Añadido Filtrado y Agrupación Mensual)
// =================================================================

const analyzeSalesData = (sales, filterYear, filterMonth) => {
    let filteredSales = sales;

    // Asumimos que la propiedad de fecha de venta es 'fechaCompra'
    if (filterYear && filterYear !== 'Todos') {
        filteredSales = filteredSales.filter(s =>
            s.fechaCompra && new Date(s.fechaCompra).getFullYear().toString() === filterYear
        );
    }
    if (filterMonth && filterMonth !== 'Todos') {
        filteredSales = filteredSales.filter(s =>
            s.fechaCompra && (new Date(s.fechaCompra).getMonth() + 1).toString().padStart(2, '0') === filterMonth
        );
    }
    
    let totalVendido = 0;
    let cantidadVentas = filteredSales.length;
    const productosVendidosMap = new Map();
    const monthlyRevenueMap = {};
    const categoryDistributionMap = {};

    filteredSales.forEach(venta => {
        totalVendido += venta.totalVenta || 0; 
        
        // Agrupación mensual para el gráfico
        if (venta.fechaCompra) {
            const date = new Date(venta.fechaCompra);
            const yearMonthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
            
            if (!monthlyRevenueMap[yearMonthKey]) {
                monthlyRevenueMap[yearMonthKey] = {
                    month: monthLabel,
                    revenue: 0,
                    details: []
                };
            }
            monthlyRevenueMap[yearMonthKey].revenue += venta.totalVenta || 0;
            monthlyRevenueMap[yearMonthKey].details.push({
                id: venta.id,
                username: venta.username,
                total: venta.totalVenta,
                fecha: venta.fechaCompra,
                productosComprados: venta.productosComprados || []
            });
        }


        // Conteo de productos para la métrica "Más Vendido" y categorías
        venta.productosComprados?.forEach(producto => {
            const nombre = producto.nombre;
            const cantidad = producto.cantidad || 1;
            
            if (productosVendidosMap.has(nombre)) {
                productosVendidosMap.set(nombre, productosVendidosMap.get(nombre) + cantidad);
            } else {
                productosVendidosMap.set(nombre, cantidad);
            }
            
            // Distribución por categoría
            const categoria = producto.categoria || 'accesorios';
            categoryDistributionMap[categoria] = (categoryDistributionMap[categoria] || 0) + cantidad;
        });
    });

    // Encontrar el producto más vendido
    let productoMasVendido = 'N/A';
    let cantidadProductosVendidos = 0;
    
    for (const [nombre, cantidad] of productosVendidosMap.entries()) {
        if (cantidad > cantidadProductosVendidos) {
            cantidadProductosVendidos = cantidad;
            productoMasVendido = nombre;
        }
    }
    
    // Preparar datos para el gráfico de barras
    const monthlySalesData = Object.keys(monthlyRevenueMap)
        .sort()
        .map(key => monthlyRevenueMap[key]);

    // Calcular distribución por categoría para gráfico de torta
    const totalProductos = Object.values(categoryDistributionMap).reduce((sum, count) => sum + count, 0);

    const categoryDistribution = Object.keys(categoryDistributionMap)
        .map(cat => ({
            category: cat,
            count: categoryDistributionMap[cat],
            percentage: totalProductos > 0 ? ((categoryDistributionMap[cat] / totalProductos) * 100).toFixed(1) : 0,
            color: getCategoryColor(cat)
        }))
        .sort((a, b) => b.count - a.count)
        .filter(item => parseFloat(item.percentage) > 0);

    // Crear conic-gradient para el gráfico de torta
    let currentAngle = 0;
    const gradientSegments = categoryDistribution.map(item => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + (parseFloat(item.percentage) * 3.6);
        currentAngle = endAngle;
        return `${item.color} ${startAngle}deg ${endAngle}deg`;
    });

    const conicGradientCSS = gradientSegments.length > 0
        ? `conic-gradient(${gradientSegments.join(', ')})`
        : `var(--card-bg)`;

    return {
        totalVendido,
        cantidadVentas,
        productoMasVendido: cantidadProductosVendidos > 0 ? `${productoMasVendido} (${cantidadProductosVendidos} uds)` : 'N/A',
        cantidadProductosVendidos,
        monthlySalesData,
        categoryDistribution,
        totalProductos,
        conicGradientCSS
    };
};

// =================================================================
// 4. COMPONENTE: Vista de Estadísticas de SERVICIOS (Refactorizado)
// =================================================================

const EstadisticasServiciosView = ({ 
    stats, 
    filterYear, 
    setFilterYear, 
    filterMonth, 
    setFilterMonth, 
    availableYears, 
    availableMonths,
    setSelectedMonthData,
    maxRevenue 
}) => {
    
    if (!stats || (stats.totalRevenue === 0 && stats.activeServicesCount === 0 && stats.deliveredServicesCount === 0)) {
        return <div className="estdash-nodata">No hay datos de Servicios disponibles para generar estadísticas en el periodo seleccionado.</div>;
    }
    
    return (
        <>
            {/* --- FILTROS --- */}
            <div className="estdash-filters">
                <div className="estdash-filter-group">
                    <label htmlFor="filterYear">Año:</label>
                    <select
                        id="filterYear"
                        value={filterYear}
                        onChange={(e) => {
                            setFilterYear(e.target.value);
                            setFilterMonth('Todos');
                        }}
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="estdash-filter-group">
                    <label htmlFor="filterMonth">Mes:</label>
                    <select
                        id="filterMonth"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        disabled={filterYear === 'Todos'}
                    >
                        {availableMonths.map(month => (
                            <option
                                key={month.value || month}
                                value={month.value || month}
                            >
                                {month.label || month}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- Key Metrics Grid --- */}
            <div className="estdash-kpi-grid">
                {/* Tarjetas de Servicios */}
                <div className="estdash-kpi-card kpi-revenue">
                    <div className="estdash-kpi-value">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="estdash-kpi-label">Ingresos Totales (Servicios Entregados)</div>
                    <span className="estdash-kpi-icon">💰</span>
                </div>

                <div className="estdash-kpi-card kpi-active">
                    <div className="estdash-kpi-value">{stats.activeServicesCount}</div>
                    <div className="estdash-kpi-label">Equipos en Taller (Activos)</div>
                    <span className="estdash-kpi-icon">🔧</span>
                </div>

                <div className="estdash-kpi-card kpi-delivered">
                    <div className="estdash-kpi-value">{stats.deliveredServicesCount}</div>
                    <div className="estdash-kpi-label">Total de Servicios Entregados</div>
                    <span className="estdash-kpi-icon">✅</span>
                </div>

                <div className="estdash-kpi-card kpi-avgdays">
                    <div className="estdash-kpi-value">{stats.avgServiceDays} días</div>
                    <div className="estdash-kpi-label">Promedio de Días en Servicio</div>
                    <span className="estdash-kpi-icon">⏳</span>
                </div>
            </div>

            {/* --- Charts Row --- */}
            <div className="estdash-charts-row">

                {/* Bloque 1: Gráfico de Barras - Ingresos Mensuales de SERVICIOS */}
                <div className="estdash-chart chart-services-monthly">
                    <h2>Ingresos por Mes (Servicios)</h2>
                    <p className="estdash-chart-subtitle">Ganancias de servicios entregados por periodo</p>
                    <div className="estdash-bar-chart">
                        {stats.monthlySalesData.length === 0 ? (
                            <p className="estdash-nochart">No hay datos de ingresos para el periodo seleccionado.</p>
                        ) : (
                            stats.monthlySalesData.map((data, index) => (
                                <div
                                    key={index}
                                    className="estdash-bar bar-service"
                                    style={{ height: `${(data.revenue / maxRevenue) * 90}%` }}
                                    title={`Total: ${formatCurrency(data.revenue)}. Click para ver detalle.`}
                                    onClick={() => setSelectedMonthData(data)}
                                >
                                    <span className="bar-val">{formatCurrency(data.revenue).replace('$', '').slice(0, -3)}</span>
                                    <span className="bar-label">{data.month.toUpperCase()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Bloque 2: Gráfico de Torta - Distribución por Tipo de Servicio */}
                <div className="estdash-chart chart-services-pie">
                    <h2>Distribución por Tipo de Servicio</h2>
                    <p className="estdash-chart-subtitle">Proporción de equipos por categoría</p>
                    {stats.totalServicesForPie === 0 ? (
                                     <p className="estdash-nochart">No hay servicios para mostrar en el gráfico de torta.</p>
                    ) : (
                        <div className="estdash-pie-row">
                            <div className="estdash-pie">
                                <div
                                    className="estdash-pie-fill"
                                    style={{ background: stats.conicGradientCSS }}
                                ></div>
                            </div>
                            <div className="estdash-legend">
                                {stats.serviceTypeDistribution.map((data, index) => (
                                    <div key={index} className="legend-item">
                                        <span className="legend-color" style={{ backgroundColor: data.color }}></span>
                                        <span className="legend-label">
                                            {data.type.charAt(0).toUpperCase() + data.type.slice(1)} ({data.percentage}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// =================================================================
// 5. NUEVO COMPONENTE: Vista de Estadísticas de VENTAS (Con Filtros y Gráfico)
// =================================================================

const EstadisticasVentasView = ({ 
    salesStats, 
    loading, 
    error,
    filterYear, 
    setFilterYear, 
    filterMonth, 
    setFilterMonth, 
    availableYears, 
    availableMonths,
    setSelectedMonthData,
    maxRevenue
}) => {
    
    if (loading) return <div className="estdash-loading">Cargando Estadísticas de Ventas...</div>;
    if (error) return <div className="estdash-error">{error}</div>;

    if (!salesStats || salesStats.cantidadVentas === 0) {
        return <div className="estdash-nodata">No hay datos de Ventas de Productos registrados en el periodo seleccionado.</div>;
    }
    
    // Eliminada línea duplicada: const maxSalesRevenue ya viene por props como maxRevenue

    return (
        <>
            {/* --- FILTROS --- */}
            <div className="estdash-filters">
                <div className="estdash-filter-group">
                    <label htmlFor="filterSalesYear">Año:</label>
                    <select
                        id="filterSalesYear"
                        value={filterYear}
                        onChange={(e) => {
                            setFilterYear(e.target.value);
                            setFilterMonth('Todos');
                        }}
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="estdash-filter-group">
                    <label htmlFor="filterSalesMonth">Mes:</label>
                    <select
                        id="filterSalesMonth"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        disabled={filterYear === 'Todos'}
                    >
                        {availableMonths.map(month => (
                            <option
                                key={month.value || month}
                                value={month.value || month}
                            >
                                {month.label || month}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="estdash-kpi-grid kpi-sales-grid">
                
                {/* Tarjeta 1: Total Vendido */}
                <div className="estdash-kpi-card kpi-sales-1">
                    <FaMoneyBillWave className="estdash-kpi-icon sales-icon-1" />
                    <div className="stat-info">
                        <div className="estdash-kpi-value">{formatCurrency(salesStats.totalVendido)}</div>
                        <div className="estdash-kpi-label">Total Recaudado (Ventas)</div>
                    </div>
                </div>
                
                {/* Tarjeta 2: Cantidad de Ventas */}
                <div className="estdash-kpi-card kpi-sales-2">
                    <FaShoppingCart className="estdash-kpi-icon sales-icon-2" />
                    <div className="stat-info">
                        <div className="estdash-kpi-value">{salesStats.cantidadVentas}</div>
                        <div className="estdash-kpi-label">Transacciones de Ventas</div>
                    </div>
                </div>

                {/* Tarjeta 3: Producto Más Vendido */}
                <div className="estdash-kpi-card kpi-sales-3">
                    <FaBoxOpen className="estdash-kpi-icon sales-icon-3" />
                    <div className="stat-info">
                        <div className="estdash-kpi-producto">{salesStats.productoMasVendido}</div>
                        <div className="estdash-kpi-label">Producto Líder (Unidades)</div>
                    </div>
                </div>
                
                <div className="estdash-kpi-card kpi-sales-4">
                    <div className="estdash-kpi-value">{salesStats.cantidadProductosVendidos}</div>
                    <div className="estdash-kpi-label">Total de Items Vendidos</div>
                    <span className="estdash-kpi-icon">📦</span>
                </div>
            </div>
            
            {/* --- Charts Row (Solo un Bloque de Gráfico) --- */}
            <div className="estdash-charts-row">
                {/* Bloque 1: Gráfico de Barras - Ingresos Mensuales de VENTAS */}
                <div className="estdash-chart chart-sales-monthly">
                    <h2>Ingresos por Mes (Ventas)</h2>
                    <p className="estdash-chart-subtitle">Ganancias de productos vendidos por periodo</p>
                    <div className="estdash-bar-chart">
                        {salesStats.monthlySalesData.length === 0 ? (
                            <p className="estdash-nochart">No hay datos de ingresos para el periodo seleccionado.</p>
                        ) : (
                            salesStats.monthlySalesData.map((data, index) => (
                                <div
                                    key={index}
                                    className="estdash-bar bar-sales"
                                    style={{ height: `${(data.revenue / maxRevenue) * 90}%` }}
                                    title={`Total: ${formatCurrency(data.revenue)}. Click para ver detalle.`}
                                    onClick={() => setSelectedMonthData(data)}
                                >
                                    <span className="bar-val">{formatCurrency(data.revenue).replace('$', '').slice(0, -3)}</span>
                                    <span className="bar-label">{data.month.toUpperCase()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* Gráfico de Torta - Distribución por Categoría de Ventas */}
                <div className="estdash-chart chart-sales-pie">
                    <h2>Distribución por Categoría (Ventas)</h2>
                    <p className="estdash-chart-subtitle">Proporción de productos vendidos por categoría</p>
                    {salesStats.totalProductos === 0 ? (
                        <p className="estdash-nochart">No hay productos para mostrar en el gráfico de torta.</p>
                    ) : (
                        <div className="estdash-pie-row">
                            <div className="estdash-pie">
                                <div
                                    className="estdash-pie-fill"
                                    style={{ background: salesStats.conicGradientCSS }}
                                ></div>
                            </div>
                            <div className="estdash-legend">
                                {salesStats.categoryDistribution.map((data, index) => (
                                    <div key={index} className="legend-item">
                                        <span className="legend-color" style={{ backgroundColor: data.color }}></span>
                                        <span className="legend-label">
                                            {data.category.charAt(0).toUpperCase() + data.category.slice(1)} ({data.percentage}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}


// =================================================================
// 6. COMPONENTE PRINCIPAL: EstadisticasAdmin (con manejo de estados para ambos filtros)
// =================================================================

function EstadisticasAdmin() {
    // Estado principal para la vista (servicios o ventas)
    const [viewMode, setViewMode] = useState('servicios'); // 'servicios' o 'ventas'

    // --- Estados para Servicios ---
    const [allServices, setAllServices] = useState([]);
    const [filterYearServicios, setFilterYearServicios] = useState('Todos');
    const [filterMonthServicios, setFilterMonthServicios] = useState('Todos');
    const [loadingServices, setLoadingServices] = useState(true);
    const [errorServices, setErrorServices] = useState(null);
    const [selectedMonthData, setSelectedMonthData] = useState(null);

    // --- Estados para Ventas ---
    const [allSales, setAllSales] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [filterYearVentas, setFilterYearVentas] = useState('Todos');
    const [filterMonthVentas, setFilterMonthVentas] = useState('Todos');
    const [loadingSales, setLoadingSales] = useState(true);
    const [errorSales, setErrorSales] = useState(null);
    const [selectedMonthSalesData, setSelectedMonthSalesData] = useState(null);

    // --- Fetch de Datos con Backend Real y JWT ---
    const fetchAllData = useCallback(async (endpoint, setter, errorSetter, loadingSetter, dataType) => {
        loadingSetter(true);
        errorSetter(null);
        try {
            const data = await api.get(endpoint);
            
            // Normalizar _id a id
            const normalizedData = (Array.isArray(data) ? data : []).map(item => ({
                ...item,
                id: item._id || item.id
            }));
            
            setter(normalizedData);
        } catch (err) {
            console.error(`Fallo al obtener datos de ${dataType}:`, err);
            errorSetter(`No se pudieron cargar ${dataType}. ${err.message || 'Revise la API.'}`);
            
            // Toast de error
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: `Error al cargar ${dataType}`,
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            loadingSetter(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData('/servicios', setAllServices, setErrorServices, setLoadingServices, 'servicios');
        fetchAllData('/ventas', setAllSales, setErrorSales, setLoadingSales, 'ventas');
        // Cargar usuarios para filtrar ventas huérfanas
        (async () => {
            try {
                const users = await api.get('/usuarios');
                setAllUsers(Array.isArray(users) ? users : []);
            } catch (e) {
                // Silenciar: si falla, se muestran todas las ventas
                setAllUsers([]);
            }
        })();
    }, [fetchAllData]);

    // --- Lógica de Filtros (Comunes para Servicios) ---
    const { availableYears: availableYearsServicios, availableMonths: availableMonthsServicios } = useMemo(() => {
        const years = new Set(allServices.map(s => s.fechaSalida && new Date(s.fechaSalida).getFullYear().toString()).filter(Boolean));
        const availableYears = ['Todos', ...Array.from(years).sort((a,b) => b - a)];

        const months = new Set(
            allServices
                .filter(s => s.fechaSalida && new Date(s.fechaSalida).getFullYear().toString() === filterYearServicios)
                .map(s => (new Date(s.fechaSalida).getMonth() + 1).toString().padStart(2, '0'))
                .filter(Boolean)
        );
        const availableMonths = ['Todos', ...Array.from(months)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(m => ({
                value: m,
                label: new Date(2000, parseInt(m) - 1, 1).toLocaleString('es-ES', { month: 'long' })
            }))];
            
        return { availableYears, availableMonths };
    }, [allServices, filterYearServicios]);

    // --- Lógica de Filtros (Comunes para Ventas) ---
    const existingUsernames = useMemo(() => new Set(allUsers.map(u => u.username)), [allUsers]);
    const filteredAllSales = useMemo(() => allSales.filter(v => existingUsernames.size ? existingUsernames.has(v.username) : true), [allSales, existingUsernames]);

    const { availableYears: availableYearsVentas, availableMonths: availableMonthsVentas } = useMemo(() => {
        const years = new Set(filteredAllSales.map(s => s.fechaCompra && new Date(s.fechaCompra).getFullYear().toString()).filter(Boolean));
        const availableYears = ['Todos', ...Array.from(years).sort((a,b) => b - a)];

        const months = new Set(
            filteredAllSales
                .filter(s => s.fechaCompra && new Date(s.fechaCompra).getFullYear().toString() === filterYearVentas)
                .map(s => (new Date(s.fechaCompra).getMonth() + 1).toString().padStart(2, '0'))
                .filter(Boolean)
        );
        const availableMonths = ['Todos', ...Array.from(months)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(m => ({
                value: m,
                label: new Date(2000, parseInt(m) - 1, 1).toLocaleString('es-ES', { month: 'long' })
            }))];
            
        return { availableYears, availableMonths };
    }, [filteredAllSales, filterYearVentas]);

    // --- Cálculo de Estadísticas ---
    const statsServicios = useMemo(() => {
        if (!allServices.length) return null;
        return analyzeServiceData(allServices, filterYearServicios, filterMonthServicios);
    }, [allServices, filterYearServicios, filterMonthServicios]);
    
    const statsVentas = useMemo(() => {
        if (!filteredAllSales.length) return null;
        return analyzeSalesData(filteredAllSales, filterYearVentas, filterMonthVentas);
    }, [filteredAllSales, filterYearVentas, filterMonthVentas]);

    
    const maxRevenueServicios = useMemo(() => {
        if (!statsServicios) return 1000;
        return Math.max(...statsServicios.monthlySalesData.map(d => d.revenue), 1000);
    }, [statsServicios]);
    
    const maxRevenueVentas = useMemo(() => {
        if (!statsVentas || !statsVentas.monthlySalesData.length) return 1000;
        return Math.max(...statsVentas.monthlySalesData.map(d => d.revenue), 1000);
    }, [statsVentas]);
    
    
    // --- Renderizado de Carga Global ---
    if (loadingServices && loadingSales) {
        return <div className="estdash-loading">Cargando todos los datos estadísticos...</div>;
    }


    return (
        <div className="estdash-page" id="estdash-root">
            <header className="estdash-header">
                <h1 className="title-bold">📊 Panel de Estadísticas</h1>
                <p>Resumen de rendimiento del taller y ventas de productos.</p>
            </header>

            {/* --- NAVEGACIÓN DE PESTAÑAS (TABS) --- */}
            <div className="estdash-tabs">
                <button
                    className={`estdash-tab-btn ${viewMode === 'servicios' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('servicios')}
                >
                    Estadísticas de Servicios
                </button>
                <button
                    className={`estdash-tab-btn ${viewMode === 'ventas' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('ventas')}
                >
                    Estadísticas de Ventas
                </button>
            </div>
            
            <div className="estdash-content">
                {viewMode === 'servicios' && (
                    <EstadisticasServiciosView
                        stats={statsServicios}
                        filterYear={filterYearServicios}
                        setFilterYear={setFilterYearServicios}
                        filterMonth={filterMonthServicios}
                        setFilterMonth={setFilterMonthServicios}
                        availableYears={availableYearsServicios}
                        availableMonths={availableMonthsServicios}
                        setSelectedMonthData={setSelectedMonthData}
                        maxRevenue={maxRevenueServicios}
                    />
                )}
                
                {viewMode === 'ventas' && (
                    <EstadisticasVentasView
                        salesStats={statsVentas}
                        loading={loadingSales}
                        error={errorSales}
                        filterYear={filterYearVentas}
                        setFilterYear={setFilterYearVentas}
                        filterMonth={filterMonthVentas}
                        setFilterMonth={setFilterMonthVentas}
                        availableYears={availableYearsVentas}
                        availableMonths={availableMonthsVentas}
                        setSelectedMonthData={setSelectedMonthSalesData}
                        maxRevenue={maxRevenueVentas}
                    />
                )}
            </div>

            {/* --- MODAL DE DETALLE DE SERVICIOS --- */}
            {selectedMonthData && (
                <MonthlyServiceDetailModal
                    data={selectedMonthData}
                    onClose={() => setSelectedMonthData(null)}
                />
            )}
            
            {/* --- MODAL DE DETALLE DE VENTAS --- */}
            {selectedMonthSalesData && (
                <MonthlySalesDetailModal
                    data={selectedMonthSalesData}
                    onClose={() => setSelectedMonthSalesData(null)}
                />
            )}
        </div>
    );
}

// =================================================================
// 7. COMPONENTE: Modal de Detalle de Servicios (Se mantiene igual)
// =================================================================

const MonthlyServiceDetailModal = ({ data, onClose }) => {
    return (
        <div className="estdash-modal-overlay" onClick={onClose}>
            <div className="estdash-modal" onClick={e => e.stopPropagation()}>
                <div className="estdash-modal-header">
                    <h2>Servicios Entregados en {data.month.toUpperCase()}</h2>
                    <button className="estdash-modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="estdash-modal-summary">
                    <p>Total Ingresos: <strong>{formatCurrency(data.revenue)}</strong></p>
                    <p>Total Servicios: <strong>{data.details.length}</strong></p>
                </div>

                <div className="estdash-modal-list">
                    {data.details.length === 0 ? (
                        <p className="modal-nodata">No se encontraron servicios entregados para este mes.</p>
                    ) : (
                        <table className="estdash-modal-table">
                            <thead>
                                <tr>
                                    <th>ID/Fecha</th>
                                    <th>Tipo</th>
                                    <th>Marca</th>
                                    <th className="text-right">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.details.map((service) => (
                                    <tr key={service.id}>
                                        <td>
                                            <span className="service-id">{service.id.substring(0, 4)}...</span>
                                            <span className="service-date"> ({new Date(service.fecha).toLocaleDateString(LOCALE)})</span>
                                        </td>
                                        <td><span className={`service-type-tag tag-${service.tipo.toLowerCase()}`}>{service.tipo}</span></td>
                                        <td>{service.marca}</td>
                                        <td className="text-right">{formatCurrency(service.precio)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

// =================================================================
// 8. COMPONENTE: Modal de Detalle de Ventas (NUEVO)
// =================================================================

const MonthlySalesDetailModal = ({ data, onClose }) => {
    return (
        <div className="estdash-modal-overlay" onClick={onClose}>
            <div className="estdash-modal" onClick={e => e.stopPropagation()}>
                <div className="estdash-modal-header">
                    <h2>Ventas Realizadas en {data.month.toUpperCase()}</h2>
                    <button className="estdash-modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="estdash-modal-summary">
                    <p>Total Ingresos: <strong>{formatCurrency(data.revenue)}</strong></p>
                    <p>Total Ventas: <strong>{data.details.length}</strong></p>
                </div>

                <div className="estdash-modal-list">
                    {data.details.length === 0 ? (
                        <p className="modal-nodata">No se encontraron ventas para este mes.</p>
                    ) : (
                        <table className="estdash-modal-table">
                            <thead>
                                <tr>
                                    <th className="col-idfecha">ID/Fecha</th>
                                    <th className="col-usuario">Usuario</th>
                                    <th className="col-productos">Productos</th>
                                    <th className="col-total text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.details.map((venta) => (
                                    <tr key={venta.id}>
                                        <td className="col-idfecha">
                                            <span className="service-id">#{shortId(toIdString(venta.id), 6)}</span>
                                            <span className="copy-id" title="Copiar ID"
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText(String(venta.id));
                                                        Swal.fire({ toast:true, position:'top-end', icon:'success', title:'ID copiado', showConfirmButton:false, timer:1400 });
                                                    } catch {}
                                                }}>📋</span>
                                            <span className="service-date"> ({new Date(venta.fecha).toLocaleDateString(LOCALE)})</span>
                                        </td>
                                        <td className="col-usuario">{venta.username}</td>
                                        <td className="col-productos productos-list">
                                            {venta.productosComprados.map((p, idx) => (
                                                <span key={idx} className="producto-badge">
                                                    {p.nombre} ({p.cantidad})
                                                </span>
                                            ))}
                                        </td>
                                        <td className="col-total text-right">{formatCurrency(venta.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstadisticasAdmin;