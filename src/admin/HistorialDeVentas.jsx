import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import HistorialDeVentasModal from "./HistorialDeVentasModal"; 
import "./HistorialDeVentas.css";
import { api } from "../services/api";
import { shortId, toIdString } from "../utils/id";

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
            
            // Normalizar _id a id
            const ventasData = (ventasRaw || []).map(v => ({
                ...v,
                id: v._id || v.id
            }));
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

    if (isLoading) return <div className="ventas-loading">Cargando Historial de Ventas...</div>;
    
    return (
        <div className="ventas-historial-container">
            <h2 className="ventas-historial-title">Historial de Ventas 🛒</h2>

            <div className="ventas-historial-buscador">
                <input
                    type="text"
                    placeholder="Buscar por ID (corto o completo) o nombre de usuario..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ventas-historial-input"
                />
            </div>

            {/* Encabezado de la tabla dinámico */}
            <div className={`ventas-historial-encabezados ventas-historial-encabezados-modo-${listaFinalParaRenderizar.mode}`}>
                {listaFinalParaRenderizar.mode === 'ventas' ? (
                    <>
                        <p>ID Venta</p>
                        <p>Usuario</p>
                        <p>F. y Hora</p>
                        <p>Total</p>
                        <p>Estado</p>
                        <p>Detalles</p> 
                    </>
                ) : (
                    <>
                        <p>Usuario</p>
                        <p>Ventas Realizadas</p>
                        <p>Total Acumulado</p>
                        <p>Última Compra</p>
                        <p>Opciones</p>
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
                                    {/* Mostrar ID corto con shortId */}
                                    <p className="col-id">#{shortId(toIdString(venta.id), 6)}</p> 
                                    <p className="col-usuario">{venta.username}</p>
                                    <p className="col-fecha">
                                        {fecha.toLocaleDateString(LOCALE)} {fecha.toLocaleTimeString(LOCALE, TIME_OPTIONS)}
                                    </p>
                                    <p className="col-total">{formatCurrency(venta.totalVenta)}</p>
                                    <p className={`col-estado estado-${venta.estado.toLowerCase().replace(/ /g, '-')}`}>{venta.estado}</p>
                                    <div className="col-acciones">
                                        <button 
                                            className="btn-ver-detalle btn-ventas-icon"
                                            onClick={() => handleVerDetallesDeVenta(venta)} 
                                            title="Ver Detalles de la Venta"
                                        >
                                            <span className="icon-more-options">⋮</span>
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
                                            className="btn-ver-historial btn-ventas-icon-with-text" 
                                            onClick={() => handleVerHistorialCompleto(data)} 
                                        >
                                            <span className="icon-more-options">⋮</span> Historial
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
    );
};

export default HistorialDeVentas;