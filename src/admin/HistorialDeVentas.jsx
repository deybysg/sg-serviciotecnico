import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import HistorialDeVentasModal from "./HistorialDeVentasModal";
import "../styles/admin/HistorialDeVentas.css";
import { api } from "../services/api";
import { shortId, toIdString } from "../utils/id";
import {
  FiShoppingCart, FiSearch, FiHash, FiUser, FiCalendar,
  FiDollarSign, FiCheckCircle, FiEye, FiMoreVertical
} from "react-icons/fi";

const LOCALE = 'es-AR'; 
const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', hour12: false }; 

// --- Funciones Auxiliares ---
const formatCurrency = (amount) => {
    // Ajusta la moneda si no es ARS (Peso Argentino)
    return new Intl.NumberFormat(LOCALE, { 
        style: 'currency', 
        currency: 'ARS', 
        minimumFractionDigits: 0
    }).format(amount);
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
const HistorialDeVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [modalOpen, setModalOpen] = useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [ventasDeUsuario, setVentasDeUsuario] = useState([]);

    // FUNCIÓN CORREGIDA: Realiza el fetch a la API backend con JWT
    const cargarDatos = useCallback(async () => {
        setIsLoading(true);
        try {
            // Backend real con JWT: ventas + usuarios para filtrar huérfanas
            const [ventasRaw, usuariosRaw] = await Promise.all([
                api.get('/ventas'),
                api.get('/usuarios')
            ]);
            
            // Normalizar _id a id y snake_case a camelCase
            const ventasData = (ventasRaw || []).map(v => normalizeVenta(v));
            // Filtrar ventas cuyos usuarios aún existen (evita mostrar historiales de usuarios eliminados)
            const usernamesSet = new Set((usuariosRaw || []).map(u => u.username));
            const filtradas = ventasData.filter(v => usernamesSet.has(v.username));

            setVentas(filtradas); 
            
        } catch (error) {
            console.error("Error al cargar historial de ventas:", error);
            Swal.fire("Error", error?.message || "No se pudo cargar el historial de ventas.", "error");
            setVentas([]);
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

        // 1. Ordenar siempre por fecha de compra descendente
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
    }, [ventas, searchQuery]);
    
    
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
    };

    if (isLoading) return (
        <div className="ventas-historial-container">
            <div className="ventas-loading"><FiShoppingCart size={24} style={{ marginBottom: 8 }} /> Cargando Historial de Ventas...</div>
        </div>
    );
    
    return (
        <div className="ventas-historial-container">
            <div className="ventas-historial-shell">
                <div className="ventas-historial-header">
                    <h2><FiShoppingCart size={28} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Historial de Ventas</h2>
                    <p>Gestiona y consulta el historial de todas las ventas realizadas.</p>
                </div>

                <div className="ventas-historial-buscador">
                    <div className="ventas-historial-search">
                        <FiSearch size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por ID (corto o completo) o nombre de usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Encabezado de la tabla dinámico */}
                <div className={`ventas-historial-encabezados ventas-historial-encabezados-modo-${listaFinalParaRenderizar.mode}`}>
                    {listaFinalParaRenderizar.mode === 'ventas' ? (
                        <>
                            <p><FiHash size={12} /> ID</p>
                            <p><FiUser size={12} /> Usuario</p>
                            <p><FiCalendar size={12} /> Fecha</p>
                            <p><FiDollarSign size={12} /> Total</p>
                            <p><FiCheckCircle size={12} /> Estado</p>
                            <p><FiEye size={12} /> Ver</p>
                        </>
                    ) : (
                        <>
                            <p><FiUser size={12} /> Usuario</p>
                            <p><FiCheckCircle size={12} /> Ventas</p>
                            <p><FiDollarSign size={12} /> Total Acumulado</p>
                            <p><FiCalendar size={12} /> Última Compra</p>
                            <p><FiEye size={12} /> Historial</p>
                        </>
                    )}
                </div>

                <div className="ventas-historial-lista">
                    {listaFinalParaRenderizar.data.length === 0 ? (
                        <p className="ventas-mensaje-vacio">
                            {listaFinalParaRenderizar.mode === 'ventas' ? 
                                "No hay ventas registradas." :
                                "No se encontraron coincidencias con la búsqueda."
                            }
                        </p>
                    ) : (
                        listaFinalParaRenderizar.mode === 'ventas' ? (
                            // MODO 1: LISTA COMPLETA DE VENTAS INDIVIDUALES
                            listaFinalParaRenderizar.data.map((venta) => {
                                const fecha = new Date(venta.fechaCompra);

                                return (
                                    <div 
                                        key={venta.id} 
                                        className="venta-historial-row" 
                                    >
                                        <p className="col-id">#{shortId(toIdString(venta.id), 6)}</p> 
                                        <p className="col-usuario">{venta.username}</p>
                                        <p className="col-fecha">
                                            {fecha.toLocaleDateString(LOCALE)} {fecha.toLocaleTimeString(LOCALE, TIME_OPTIONS)}
                                        </p>
                                        <p className="col-total">{formatCurrency(venta.totalVenta)}</p>
                                        <p className={`col-estado estado-${venta.estado.toLowerCase().replace(/ /g, '-')}`}>{venta.estado}</p>
                                        <div className="col-acciones">
                                            <button 
                                                className="btn-ventas-icon"
                                                onClick={() => handleVerDetallesDeVenta(venta)} 
                                                title="Ver Detalles de la Venta"
                                            >
                                                <FiMoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            // MODO 2: LISTA AGRUPADA POR USUARIO
                            listaFinalParaRenderizar.data.map((data) => {
                                const ventasCount = data.ventasCompletas.length;
                                const ultimaCompra = new Date(data.ultimaVenta.fechaCompra);
                                
                                return (
                                    <div 
                                        key={data.username} 
                                        className="usuario-historial-row"
                                    >
                                        <p className="col-usuario-name">{data.username}</p>
                                        <p className="col-count">
                                            <span className="badge-ventas-historial">{ventasCount}</span>
                                        </p>
                                        <p className="col-total-acc">{formatCurrency(data.totalAcumulado)}</p>
                                        <p className="col-ultima-compra">
                                            {ultimaCompra.toLocaleDateString(LOCALE)} a las {ultimaCompra.toLocaleTimeString(LOCALE, TIME_OPTIONS)}
                                        </p>
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
                        )
                    )}
                </div>

                <HistorialDeVentasModal
                    isOpen={modalOpen}
                    onClose={handleCloseModal}
                    venta={ventaSeleccionada}
                    ventasDeUsuario={ventasDeUsuario}
                />
            </div>
        </div>
    );
};

export default HistorialDeVentas;