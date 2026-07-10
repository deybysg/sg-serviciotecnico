import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import HistorialDeVentasModal from "./HistorialDeVentasModal";
import "../styles/admin/HistorialDeVentas.css";
import { api } from "../services/api";
import { shortId, toIdString } from "../utils/id";
import {
  FiShoppingCart, FiSearch, FiHash, FiUser, FiCalendar, FiImage,
  FiDollarSign, FiCheckCircle, FiEye, FiMoreVertical, FiPackage, FiArrowDown, FiArrowUp, FiSettings, FiList
} from "react-icons/fi";

const LOCALE = 'es-AR'; 
const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', hour12: false }; 

// --- Funciones Auxiliares ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat(LOCALE, { 
        style: 'currency', 
        currency: 'ARS', 
        minimumFractionDigits: 0
    }).format(amount);
};

const safeDate = (dateValue) => {
    if (!dateValue) return null;
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
};

const formatDate = (dateValue) => {
    const d = safeDate(dateValue);
    if (!d) return '-';
    return `${d.toLocaleDateString(LOCALE)} ${d.toLocaleTimeString(LOCALE, TIME_OPTIONS)}`;
};

const safeParseJSON = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
};

// Normaliza propiedades snake_case a camelCase para compatibilidad entre MongoDB y PostgreSQL
function normalizeVenta(v) {
    if (!v) return v;
    const id = v.id || v._id;
    return {
        id: id,
        _id: id,
        username: v.username,
        fechaCompra: v.fecha_compra ?? v.fechaCompra,
        totalVenta: Number(v.total_venta ?? v.totalVenta ?? 0),
        metodoPago: v.metodo_pago ?? v.metodoPago,
        estado: v.estado,
        productosComprados: v.productos_comprados ?? v.productosComprados ?? [],
        createdAt: v.created_at ?? v.createdAt,
        updatedAt: v.updated_at ?? v.updatedAt,
    };
}


// --- Componente Principal ---
const HistorialDeMovimientos = () => {
    const [activeTab, setActiveTab] = useState("todos");
    const [ventas, setVentas] = useState([]);
    const [ventasDevueltas, setVentasDevueltas] = useState([]);
    const [productosNuevos, setProductosNuevos] = useState([]);
    const [ajustes, setAjustes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [modalOpen, setModalOpen] = useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [ventasDeUsuario, setVentasDeUsuario] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [ajusteSeleccionado, setAjusteSeleccionado] = useState(null);

    // FUNCIÓN CORREGIDA: Realiza el fetch a la API backend con JWT
    const cargarDatos = useCallback(async () => {
        setIsLoading(true);
        try {
            // Backend real con JWT: ventas + usuarios para filtrar huérfanas + devoluciones + productos nuevos + ajustes
            const [ventasRaw, usuariosRaw, devueltasRaw, productosRaw, ajustesRaw] = await Promise.all([
                api.get('/ventas'),
                api.get('/usuarios'),
                api.get('/ventas/devueltas'),
                api.get('/productos/nuevos'),
                api.get('/ajustes')
            ]);
            
            // Normalizar _id a id y snake_case a camelCase
            const ventasData = (ventasRaw || []).map(v => normalizeVenta(v));
            const devueltasData = (devueltasRaw || []).map(v => normalizeVenta(v));
            
            // Filtrar ventas cuyos usuarios aún existen (evita mostrar historiales de usuarios eliminados)
            // Y excluir ventas devueltas del tab de ventas
            const usernamesSet = new Set((usuariosRaw || []).map(u => u.username));
            const filtradas = ventasData.filter(v => usernamesSet.has(v.username) && v.estado !== "Devuelto");
            const devueltasFiltradas = devueltasData.filter(v => usernamesSet.has(v.username));

            setVentas(filtradas);
            setVentasDevueltas(devueltasFiltradas);
            setProductosNuevos(productosRaw || []);
            setAjustes(ajustesRaw || []);
            
        } catch (error) {
            console.error("Error al cargar historial de movimientos:", error);
            Swal.fire("Error", error?.message || "No se pudo cargar el historial de movimientos.", "error");
            setVentas([]);
            setVentasDevueltas([]);
            setProductosNuevos([]);
            setAjustes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Se llama al montar para cargar todas las ventas nuevas
        cargarDatos(); 
    }, [cargarDatos]);

    // Lógica para alternar la vista (ventas individuales vs. usuarios agrupados)
    const listaFinalParaRenderizar = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const estaBuscando = query.length > 0;

        // MODO TODOS: Combina todos los movimientos
        if (activeTab === "todos") {
            const todosLosMovimientos = [];
            
            // Agregar ventas
            ventas.forEach(v => {
                const productos = v.productosComprados || [];
                const totalProductos = productos.reduce((sum, p) => sum + (p.cantidad || 1), 0);
                const nombresProductos = productos.slice(0, 2).map(p => p.nombre).join(', ');
                const descripcion = totalProductos > 0 
                    ? `${totalProductos} producto${totalProductos > 1 ? 's' : ''}: ${nombresProductos}${productos.length > 2 ? '...' : ''}`
                    : `Venta #${shortId(toIdString(v.id), 6)}`;
                
                todosLosMovimientos.push({
                    tipo: 'venta',
                    fecha: safeDate(v.fechaCompra),
                    id: v.id,
                    username: v.username,
                    descripcion: descripcion,
                    detalle: v.estado,
                    total: v.totalVenta,
                    icono: 'venta',
                    datos: v
                });
            });
            
            // Agregar devoluciones
            ventasDevueltas.forEach(v => {
                const productos = v.productosComprados || [];
                const totalProductos = productos.reduce((sum, p) => sum + (p.cantidad || 1), 0);
                const nombresProductos = productos.slice(0, 2).map(p => p.nombre).join(', ');
                const descripcion = totalProductos > 0 
                    ? `${totalProductos} producto${totalProductos > 1 ? 's' : ''}: ${nombresProductos}${productos.length > 2 ? '...' : ''}`
                    : `Devolución #${shortId(toIdString(v.id), 6)}`;
                
                todosLosMovimientos.push({
                    tipo: 'devolucion',
                    fecha: safeDate(v.fechaCompra),
                    id: v.id,
                    username: v.username,
                    descripcion: descripcion,
                    detalle: 'Devuelto',
                    total: v.totalVenta || 0,
                    icono: 'devolucion',
                    datos: v
                });
            });
            
            // Agregar productos nuevos
            productosNuevos.forEach(p => {
                todosLosMovimientos.push({
                    tipo: 'producto',
                    fecha: safeDate(p.created_at || p.createdAt),
                    id: p.id || p._id,
                    username: null,
                    descripcion: p.nombre,
                    detalle: `${p.codigo} - ${p.categoria}`,
                    total: null,
                    stock: p.stock,
                    precio: p.precio,
                    icono: 'producto',
                    datos: p
                });
            });
            
            // Agregar ajustes
            ajustes.forEach(a => {
                const fecha = safeDate(a.created_at || a.createdAt);
                const cambios = safeParseJSON(a.cambios);
                const tipoLabel = {
                    'modificacion': 'Modificación',
                    'ajuste_stock': 'Ajuste Stock',
                    'ajuste_precio': 'Ajuste Precio',
                    'creacion': 'Creación'
                }[a.tipo] || a.tipo;
                
                let descripcion = `${a.producto_nombre} (${a.producto_codigo})`;
                let cambiosArray = [];
                if (cambios.nombre) cambiosArray.push(`Nombre: ${cambios.nombre.anterior} → ${cambios.nombre.nuevo}`);
                if (cambios.categoria) cambiosArray.push(`Cat: ${cambios.categoria.anterior} → ${cambios.categoria.nuevo}`);
                if (cambios.descripcion) cambiosArray.push(`Desc: cambiada`);
                if (cambios.imagen) cambiosArray.push(`Img: cambiada`);
                if (cambios.stock) cambiosArray.push(`Stock: ${cambios.stock.anterior} → ${cambios.stock.nuevo}`);
                if (cambios.precio) cambiosArray.push(`Precio: ${formatCurrency(cambios.precio.anterior)} → ${formatCurrency(cambios.precio.nuevo)}`);
                const detalle = cambiosArray.length > 0 ? `${tipoLabel}: ${cambiosArray.join(' | ')}` : tipoLabel;
                
                todosLosMovimientos.push({
                    tipo: 'ajuste',
                    fecha: fecha,
                    id: a.id || a._id,
                    username: a.usuario,
                    descripcion: descripcion,
                    detalle: detalle,
                    total: null,
                    icono: 'ajuste',
                    datos: a
                });
            });
            
            // Ordenar por fecha descendente (nulls al final)
            todosLosMovimientos.sort((a, b) => {
                if (!a.fecha && !b.fecha) return 0;
                if (!a.fecha) return 1;
                if (!b.fecha) return -1;
                return b.fecha - a.fecha;
            });
            
            // Filtrar por búsqueda
            const filtrados = estaBuscando 
                ? todosLosMovimientos.filter(m => 
                    (m.descripcion || '').toLowerCase().includes(query) ||
                    (m.username || '').toLowerCase().includes(query) ||
                    (m.detalle || '').toLowerCase().includes(query)
                )
                : todosLosMovimientos;
            
            return { mode: 'todos', data: filtrados };
        }

        if (activeTab === "productos") {
            // MODO PRODUCTOS NUEVOS
            const productosOrdenados = [...productosNuevos].sort(
                (a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
            );
            const filtrados = estaBuscando 
                ? productosOrdenados.filter(p => 
                    (p.nombre || '').toLowerCase().includes(query) ||
                    (p.codigo || '').toLowerCase().includes(query) ||
                    (p.categoria || '').toLowerCase().includes(query)
                )
                : productosOrdenados;
            return { mode: 'productos', data: filtrados };
        }

        if (activeTab === "devoluciones") {
            // MODO DEVOLUCIONES
            const devueltasOrdenadas = [...ventasDevueltas].sort(
                (a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra)
            );
            const filtradas = estaBuscando 
                ? devueltasOrdenadas.filter(v => {
                    const username = v.username ? v.username.toLowerCase() : "";
                    const fullVentaId = v.id ? String(v.id) : "";
                    const q = query.replace(/[#\s]/g, "").toLowerCase();
                    return username.includes(q) || fullVentaId.toLowerCase().includes(q);
                })
                : devueltasOrdenadas;
            return { mode: 'devoluciones', data: filtradas };
        }

        if (activeTab === "ajustes") {
            // MODO AJUSTES
            const ajustesOrdenados = [...ajustes].sort(
                (a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
            );
            const filtrados = estaBuscando 
                ? ajustesOrdenados.filter(a => 
                    (a.producto_nombre || '').toLowerCase().includes(query) ||
                    (a.producto_codigo || '').toLowerCase().includes(query) ||
                    (a.usuario || '').toLowerCase().includes(query)
                )
                : ajustesOrdenados;
            return { mode: 'ajustes', data: filtrados };
        }

        // MODO VENTAS (por defecto)
        const ventasOrdenadas = [...ventas].sort(
            (a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra)
        );

        if (!estaBuscando) {
            // MODO VENTAS INDIVIDUALES: Muestra todas las ventas
            return { 
                mode: 'ventas',
                data: ventasOrdenadas
            };
        } else {
            // MODO USUARIOS AGRUPADOS: Agrupa por username al buscar
            const ventasMap = new Map();

            const filteredVentas = ventasOrdenadas.filter((v) => {
                const username = v.username ? v.username.toLowerCase() : "";
                const fullVentaId = v.id ? String(v.id) : "";
                const ventaIdLower = fullVentaId.toLowerCase();
                const ventaShortLower = shortId(fullVentaId, 6).toLowerCase();
                const q = query.replace(/[#\s]/g, "").toLowerCase();

                return (
                    username.includes(q) ||
                    ventaIdLower.includes(q) ||
                    ventaShortLower.includes(q) ||
                    (q.length <= 6 && ventaIdLower.endsWith(q))
                );
            });

            filteredVentas.forEach(venta => {
                const username = venta.username;
                if (!ventasMap.has(username)) {
                    ventasMap.set(username, {
                        username: username,
                        ultimaVenta: venta, // La primera del array (más reciente)
                        ventasCompletas: [],
                        totalAcumulado: 0
                    });
                }
                const userData = ventasMap.get(username);
                userData.ventasCompletas.push(venta);
                userData.totalAcumulado += venta.totalVenta;
            });

            return { 
                mode: 'usuarios',
                data: Array.from(ventasMap.values()) 
            };
        }
    }, [ventas, ventasDevueltas, productosNuevos, ajustes, searchQuery, activeTab]);
    
    
    // --- Handlers de Modal ---

    const handleVerHistorialCompleto = (userData) => {
        // Muestra todas las ventas de ese usuario
        setVentasDeUsuario(userData.ventasCompletas);
        setVentaSeleccionada(null); 
        setModalOpen(true);
    };

    const handleVerDetallesDeVenta = (venta) => {
        // Muestra solo el detalle de una venta
        setVentaSeleccionada(venta); 
        setVentasDeUsuario([venta]); 
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setVentaSeleccionada(null);
        setVentasDeUsuario([]);
        setProductoSeleccionado(null);
        setAjusteSeleccionado(null);
    };

    const handleVerProducto = (producto) => {
        setProductoSeleccionado(producto);
        setModalOpen(true);
    };

    const handleVerAjuste = (ajuste) => {
        setAjusteSeleccionado(ajuste);
        setModalOpen(true);
    };

    if (isLoading) return (
        <div className="ventas-historial-container">
            <div className="ventas-loading"><FiShoppingCart size={24} style={{ marginBottom: 8 }} /> Cargando Historial de Movimientos...</div>
        </div>
    );
    
    return (
        <div className="ventas-historial-container">
            <div className="ventas-historial-shell">
                <div className="ventas-historial-header">
                    <h2><FiShoppingCart size={28} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Historial de Movimientos</h2>
                    <p>Gestiona y consulta el historial de ventas, productos nuevos, devoluciones y ajustes.</p>
                </div>

                {/* Tabs de navegación */}
                <div className="ventas-historial-tabs">
                    <button 
                        className={`ventas-tab ${activeTab === 'todos' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('todos'); setSearchQuery(''); }}
                    >
                        <FiList size={16} /> Todos
                    </button>
                    <button 
                        className={`ventas-tab ${activeTab === 'ventas' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('ventas'); setSearchQuery(''); }}
                    >
                        <FiShoppingCart size={16} /> Ventas
                    </button>
                    <button 
                        className={`ventas-tab ${activeTab === 'productos' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('productos'); setSearchQuery(''); }}
                    >
                        <FiPackage size={16} /> Productos Nuevos
                    </button>
                    <button 
                        className={`ventas-tab ${activeTab === 'devoluciones' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('devoluciones'); setSearchQuery(''); }}
                    >
                        <FiArrowUp size={16} /> Devoluciones
                    </button>
                    <button 
                        className={`ventas-tab ${activeTab === 'ajustes' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('ajustes'); setSearchQuery(''); }}
                    >
                        <FiSettings size={16} /> Modificaciones
                    </button>
                </div>

                <div className="ventas-historial-buscador">
                    <div className="ventas-historial-search">
                        <FiSearch size={16} />
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'todos' ? "Buscar en todos los movimientos..." :
                                activeTab === 'ventas' ? "Buscar por ID (corto o completo) o nombre de usuario..." :
                                activeTab === 'productos' ? "Buscar por nombre, código o categoría..." :
                                activeTab === 'ajustes' ? "Buscar por nombre, código o usuario..." :
                                "Buscar por ID de venta o nombre de usuario..."
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Encabezado de la tabla dinámico */}
                <div className={`ventas-historial-encabezados ventas-historial-encabezados-modo-${listaFinalParaRenderizar.mode}`}>
                    {listaFinalParaRenderizar.mode === 'todos' && (
                        <>
                            <p><FiHash size={12} /> Tipo</p>
                            <p><FiPackage size={12} /> Descripción</p>
                            <p><FiCalendar size={12} /> Fecha</p>
                            <p><FiCheckCircle size={12} /> Detalle</p>
                            <p><FiDollarSign size={12} /> Total/Stock</p>
                            <p><FiUser size={12} /> Usuario</p>
                            <p><FiEye size={12} /> Ver</p>
                        </>
                    )}
                    {listaFinalParaRenderizar.mode === 'ventas' && (
                        <>
                            <p><FiImage size={12} /> Foto</p>
                            <p><FiPackage size={12} /> Descripción</p>
                            <p><FiCalendar size={12} /> Fecha</p>
                            <p><FiDollarSign size={12} /> Total</p>
                            <p><FiCheckCircle size={12} /> Estado</p>
                            <p><FiUser size={12} /> Usuario</p>
                        </>
                    )}
                    {listaFinalParaRenderizar.mode === 'usuarios' && (
                        <>
                            <p><FiUser size={12} /> Usuario</p>
                            <p><FiPackage size={12} /> Descripción</p>
                            <p><FiCalendar size={12} /> Última Compra</p>
                            <p><FiDollarSign size={12} /> Total Acumulado</p>
                            <p><FiCheckCircle size={12} /> Ventas</p>
                            <p><FiUser size={12} /> -</p>
                            <p><FiEye size={12} /> Historial</p>
                        </>
                    )}
                    {listaFinalParaRenderizar.mode === 'productos' && (
                        <>
                            <p><FiImage size={12} /> Foto</p>
                            <p><FiPackage size={12} /> Nombre</p>
                            <p><FiCalendar size={12} /> Fecha Ingreso</p>
                            <p><FiDollarSign size={12} /> Precio</p>
                            <p><FiCheckCircle size={12} /> Stock</p>
                            <p><FiUser size={12} /> Categoría</p>
                        </>
                    )}
                    {listaFinalParaRenderizar.mode === 'devoluciones' && (
                        <>
                            <p><FiImage size={12} /> Foto</p>
                            <p><FiPackage size={12} /> Descripción</p>
                            <p><FiCalendar size={12} /> Fecha</p>
                            <p><FiDollarSign size={12} /> Total</p>
                            <p><FiCheckCircle size={12} /> Estado</p>
                            <p><FiUser size={12} /> Usuario</p>
                        </>
                    )}
                    {listaFinalParaRenderizar.mode === 'ajustes' && (
                        <>
                            <p><FiImage size={12} /> Foto</p>
                            <p><FiPackage size={12} /> Producto</p>
                            <p><FiCalendar size={12} /> Fecha</p>
                            <p><FiDollarSign size={12} /> Cambios</p>
                            <p><FiCheckCircle size={12} /> Tipo</p>
                            <p><FiUser size={12} /> Usuario</p>
                        </>
                    )}
                </div>

                <div className="ventas-historial-lista">
                    {listaFinalParaRenderizar.data.length === 0 ? (
                        <p className="ventas-mensaje-vacio">
                            {activeTab === 'todos' && "No hay movimientos registrados."}
                            {activeTab === 'ventas' && "No hay ventas registradas."}
                            {activeTab === 'productos' && "No hay productos nuevos registrados."}
                            {activeTab === 'devoluciones' && "No hay devoluciones registradas."}
                            {activeTab === 'ajustes' && "No hay ajustes registrados."}
                        </p>
                    ) : (
                        listaFinalParaRenderizar.mode === 'todos' && (
                            // MODO 0: LISTA COMBINADA DE TODOS LOS MOVIMIENTOS
                            listaFinalParaRenderizar.data.map((movimiento) => {
                                const tipoConfig = {
                                    'venta': { label: 'Salida', className: 'tipo-salida', icono: <FiArrowDown size={12} /> },
                                    'devolucion': { label: 'Devolución', className: 'tipo-devolucion', icono: <FiArrowUp size={12} /> },
                                    'producto': { label: 'Entrada', className: 'tipo-entrada', icono: <FiArrowDown size={12} /> },
                                        'ajuste': { label: 'Modificación', className: 'tipo-ajuste', icono: <FiSettings size={12} /> }
                                }[movimiento.tipo] || { label: movimiento.tipo, className: '', icono: null };

                                return (
                                    <div 
                                        key={`${movimiento.tipo}-${movimiento.id}`} 
                                        className={`movimiento-combinado-row ${movimiento.tipo}`}
                                    >
                                        <p className={`col-tipo-movimiento ${tipoConfig.className}`}>
                                            {tipoConfig.icono} {tipoConfig.label}
                                        </p>
                                        <p className="col-descripcion-movimiento">{movimiento.descripcion}</p>
                                        <p className="col-fecha-movimiento">
                                            {formatDate(movimiento.fecha)}
                                        </p>
                                        <p className="col-detalle-movimiento">{movimiento.detalle}</p>
                                        <p className="col-total-movimiento">
                                            {movimiento.total !== null ? formatCurrency(movimiento.total) : 
                                             movimiento.stock !== undefined ? `${movimiento.stock} u.` : '-'}
                                        </p>
                                        <p className="col-usuario-movimiento">{movimiento.username || '-'}</p>
                                        <div className="col-acciones-movimiento">
                                            <button 
                                                className="btn-ventas-icon"
                                                onClick={() => {
                                                    if (movimiento.tipo === 'venta' || movimiento.tipo === 'devolucion') {
                                                        handleVerDetallesDeVenta(movimiento.datos);
                                                    } else if (movimiento.tipo === 'producto') {
                                                        handleVerProducto(movimiento.datos);
                                                    } else if (movimiento.tipo === 'ajuste') {
                                                        handleVerAjuste(movimiento.datos);
                                                    }
                                                }}
                                                title={`Ver detalles de ${tipoConfig.label}`}
                                            >
                                                <FiMoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}
                    {listaFinalParaRenderizar.mode === 'ventas' && (
                        // MODO 1: LISTA COMPLETA DE VENTAS INDIVIDUALES
                        listaFinalParaRenderizar.data.map((venta) => {
                            const productos = venta.productosComprados || [];
                            const totalProductos = productos.reduce((sum, p) => sum + (p.cantidad || 1), 0);
                            const nombresProductos = productos.slice(0, 2).map(p => p.nombre).join(', ');
                            const descripcion = totalProductos > 0 
                                ? `${totalProductos} producto${totalProductos > 1 ? 's' : ''}: ${nombresProductos}${productos.length > 2 ? '...' : ''}`
                                : '-';
                            const primeraImagen = productos.length > 0 ? productos[0].imagen : null;
                            
                            return (
                                <div 
                                    key={venta.id} 
                                    className="venta-historial-row" 
                                >
                                    <div className="col-foto-venta">
                                        {primeraImagen ? (
                                            <img src={primeraImagen} alt="Producto" className="venta-historial-thumb" />
                                        ) : (
                                            <div className="venta-historial-thumb-placeholder"><FiPackage size={16} /></div>
                                        )}
                                    </div>
                                    <p className="col-descripcion-venta">{descripcion}</p>
                                    <p className="col-fecha">
                                        {formatDate(venta.fechaCompra)}
                                    </p>
                                    <p className="col-total">{formatCurrency(venta.totalVenta)}</p>
                                    <p className={`col-estado estado-${venta.estado.toLowerCase().replace(/ /g, '-')}`}>{venta.estado}</p>
                                    <p className="col-usuario">{venta.username}</p>
                                </div>
                            );
                        })
                    )}
                    {listaFinalParaRenderizar.mode === 'usuarios' && (
                        // MODO 2: LISTA AGRUPADA POR USUARIO
                        listaFinalParaRenderizar.data.map((data) => {
                            const ventasCount = data.ventasCompletas.length;
                            
                            return (
                                <div 
                                    key={data.username} 
                                    className="usuario-historial-row"
                                >
                                    <p className="col-usuario-name">{data.username}</p>
                                    <p className="col-descripcion-usuario">{ventasCount} venta{ventasCount > 1 ? 's' : ''}</p>
                                    <p className="col-ultima-compra">
                                        {formatDate(data.ultimaVenta.fechaCompra)}
                                    </p>
                                    <p className="col-total-acc">{formatCurrency(data.totalAcumulado)}</p>
                                    <p className="col-count">
                                        <span className="badge-ventas-historial">{ventasCount}</span>
                                    </p>
                                    <p className="col-usuario">-</p>
                                    <div className="col-acciones">
                                        <button 
                                            className="btn-ver-historial" 
                                            onClick={() => handleVerHistorialCompleto(data)} 
                                        >
                                            <FiEye size={14} /> Historial
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {listaFinalParaRenderizar.mode === 'productos' && (
                        // MODO 3: LISTA DE PRODUCTOS NUEVOS
                        listaFinalParaRenderizar.data.map((producto) => {
                            return (
                                <div 
                                    key={producto.id || producto._id} 
                                    className="producto-nuevo-row"
                                >
                                    <div className="col-foto-venta">
                                        {producto.imagen ? (
                                            <img src={producto.imagen} alt="Producto" className="venta-historial-thumb" />
                                        ) : (
                                            <div className="venta-historial-thumb-placeholder"><FiPackage size={16} /></div>
                                        )}
                                    </div>
                                    <p className="col-nombre">{producto.nombre}</p>
                                    <p className="col-fecha-ingreso">
                                        {formatDate(producto.created_at || producto.createdAt)}
                                    </p>
                                    <p className="col-precio">{formatCurrency(producto.precio)}</p>
                                    <p className={`col-stock ${producto.stock <= 5 ? 'stock-bajo' : ''}`}>
                                        {producto.stock} u.
                                    </p>
                                    <p className="col-categoria">{producto.categoria}</p>
                                </div>
                            );
                        })
                    )}
                    {listaFinalParaRenderizar.mode === 'devoluciones' && (
                        // MODO 4: LISTA DE DEVOLUCIONES
                        listaFinalParaRenderizar.data.map((venta) => {
                            const productos = venta.productosComprados || [];
                            const totalProductos = productos.reduce((sum, p) => sum + (p.cantidad || 1), 0);
                            const nombresProductos = productos.slice(0, 2).map(p => p.nombre).join(', ');
                            const descripcion = totalProductos > 0 
                                ? `${totalProductos} producto${totalProductos > 1 ? 's' : ''}: ${nombresProductos}${productos.length > 2 ? '...' : ''}`
                                : '-';
                            const primeraImagen = productos.length > 0 ? productos[0].imagen : null;
                            
                            return (
                                <div 
                                    key={venta.id} 
                                    className="venta-devuelta-row"
                                >
                                    <div className="col-foto-venta">
                                        {primeraImagen ? (
                                            <img src={primeraImagen} alt="Producto" className="venta-historial-thumb" />
                                        ) : (
                                            <div className="venta-historial-thumb-placeholder"><FiPackage size={16} /></div>
                                        )}
                                    </div>
                                    <p className="col-descripcion-devolucion">{descripcion}</p>
                                    <p className="col-fecha-original">
                                        {formatDate(venta.fechaCompra)}
                                    </p>
                                    <p className="col-total-original">{formatCurrency(venta.totalVenta || 0)}</p>
                                    <p className="col-estado-devuelto">
                                        <FiArrowUp size={12} /> Devuelto
                                    </p>
                                    <p className="col-usuario">{venta.username}</p>
                                </div>
                            );
                        })
                    )}
                    {listaFinalParaRenderizar.mode === 'ajustes' && (
                        // MODO 5: LISTA DE AJUSTES
                        listaFinalParaRenderizar.data.map((ajuste) => {
                            const cambios = safeParseJSON(ajuste.cambios);
                            const tipoLabel = {
                                'modificacion': 'Modificación',
                                'ajuste_stock': 'Ajuste Stock',
                                'ajuste_precio': 'Ajuste Precio',
                                'creacion': 'Creación'
                            }[ajuste.tipo] || ajuste.tipo;
                            
                            return (
                                <div 
                                    key={ajuste.id || ajuste._id} 
                                    className="ajuste-row"
                                >
                                    <div className="col-foto-venta">
                                        {ajuste.imagen ? (
                                            <img src={ajuste.imagen} alt="Producto" className="venta-historial-thumb" />
                                        ) : (
                                            <div className="venta-historial-thumb-placeholder"><FiPackage size={16} /></div>
                                        )}
                                    </div>
                                    <p className="col-producto-nombre">{ajuste.producto_nombre}</p>
                                    <p className="col-fecha-ajuste">
                                        {formatDate(ajuste.created_at || ajuste.createdAt)}
                                    </p>
                                    <p className="col-cambios">
                                        {cambios.nombre && (
                                            <span className="cambio-item">Nombre: {cambios.nombre.anterior} → {cambios.nombre.nuevo}</span>
                                        )}
                                        {cambios.categoria && (
                                            <span className="cambio-item">Cat: {cambios.categoria.anterior} → {cambios.categoria.nuevo}</span>
                                        )}
                                        {cambios.descripcion && (
                                            <span className="cambio-item">Desc: {cambios.descripcion.anterior?.substring(0, 20)}... → {cambios.descripcion.nuevo?.substring(0, 20)}...</span>
                                        )}
                                        {cambios.imagen && (
                                            <span className="cambio-item">Imagen cambiada</span>
                                        )}
                                        {cambios.stock && (
                                            <span className="cambio-item">Stock: {cambios.stock.anterior} → {cambios.stock.nuevo}</span>
                                        )}
                                        {cambios.precio && (
                                            <span className="cambio-item">Precio: {formatCurrency(cambios.precio.anterior)} → {formatCurrency(cambios.precio.nuevo)}</span>
                                        )}
                                        {!cambios.nombre && !cambios.categoria && !cambios.descripcion && !cambios.imagen && !cambios.stock && !cambios.precio && (
                                            <span className="cambio-item">Otro cambio</span>
                                        )}
                                    </p>
                                    <p className={`col-tipo-ajuste tipo-${ajuste.tipo}`}>
                                        <FiSettings size={12} /> {tipoLabel}
                                    </p>
                                    <p className="col-usuario-ajuste">{ajuste.usuario}</p>
                                </div>
                            );
                        })
                    )}
                </div>

                <HistorialDeVentasModal
                    isOpen={modalOpen}
                    onClose={handleCloseModal}
                    venta={ventaSeleccionada}
                    ventasDeUsuario={ventasDeUsuario}
                    producto={productoSeleccionado}
                    ajuste={ajusteSeleccionado}
                />
            </div>
        </div>
    );
};

export default HistorialDeMovimientos;
