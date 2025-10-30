import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import ServiciosModal from "./HistorialModal";
import "./HistorialAdmin.css";
import { api } from "../services/api";
import { shortId, toIdString } from "../utils/id";

const LOCALE = 'es-AR'; // Localización para las fechas
const TIME_OPTIONS = { hour12: false }; // Opciones para el formato 24h

// --- Funciones Auxiliares ---
const getEstadoLabel = (value) => {
    const ESTADO_OPTIONS = [
        { value: "pendiente", label: "Pendiente" },
        { value: "enRevision", label: "En Revisión" },
        { value: "revisionTerminada", label: "En Reparacion" },
        { value: "terminado", label: "Listo para Entrega" },
        { value: "entregado", label: "Entregado" },
    ];
    return ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
};

const getClienteName = (clienteId, clientes) => {
    if (!clienteId) return "Cliente Desconocido";
    // clientes normalizados con id = (_id || id)
    return clientes.find(c => (c.id === clienteId))?.nombreCompleto || "Cliente Desconocido";
};

// --- Componente Principal ---
const HistorialAdmin = () => {
    const [clientes, setClientes] = useState([]);
    const [serviciosEntregados, setServiciosEntregados] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [modalOpen, setModalOpen] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [serviciosDeCliente, setServiciosDeCliente] = useState([]);

        const cargarDatos = useCallback(async () => {
                setIsLoading(true);
                try {
                    // Consumimos backend real con JWT
                    const [clientesRaw, serviciosRaw] = await Promise.all([
                        api.get('/clientes'),
                        api.get('/servicios')
                    ]);

                    // Normalizar clientes y servicios para tolerar _id/id y clienteId/cliente
                    const clientesData = (clientesRaw || []).map(c => ({
                        ...c,
                        id: c._id || c.id
                    }));

                    const serviciosData = (serviciosRaw || []).map(s => ({
                        ...s,
                        id: s._id || s.id,
                        // Unificar referencia de cliente siempre como string (evitar objeto completo)
                        clienteId: s.clienteId || (s.cliente && (s.cliente._id || s.cliente.id)) || null
                    }));

                    // Solo los entregados con fecha de salida
                    const historial = serviciosData.filter(
                        (s) => s.estado === "entregado" && s.fechaSalida
                    );

                    setServiciosEntregados(historial);
                    setClientes(clientesData);

                } catch (error) {
                    console.error("Error al cargar historial:", error);
                    Swal.fire("Error", error?.message || "No se pudo cargar el historial de servicios.", "error");
                } finally {
                    setIsLoading(false);
                }
        }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Lógica para alternar la vista (servicios completos vs. clientes agrupados)
    const listaFinalParaRenderizar = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const estaBuscando = query.length > 0;

        if (!estaBuscando) {
            // MODO SERVICIOS: Muestra todos los servicios (repetidos)
            return { 
                mode: 'servicios',
                data: serviciosEntregados.map(s => ({
                    servicio: s, 
                    clienteNombre: getClienteName(s.clienteId, clientes)
                }))
            };
        } else {
            // MODO CLIENTES: Agrupa por cliente al buscar (vista resumen)
            const clientesMap = new Map();

            const filteredServices = serviciosEntregados.filter((s) => {
                const clienteNombre = getClienteName(s.clienteId, clientes).toLowerCase();
                const fullServiceId = s.id ? String(s.id) : "";
                const serviceIdLower = fullServiceId.toLowerCase();
                const serviceShortLower = shortId(fullServiceId, 6).toLowerCase();

                const clienteFullId = s.clienteId ? String(s.clienteId) : "";
                const clienteIdLower = clienteFullId.toLowerCase();
                const clienteShortLower = shortId(clienteFullId, 6).toLowerCase();

                const q = query.replace(/[#\s]/g, "").toLowerCase();

                return (
                    // Por nombre de cliente
                    clienteNombre.includes(q) ||
                    // Por ID de servicio
                    serviceIdLower.includes(q) ||
                    serviceShortLower.includes(q) ||
                    (q.length <= 6 && serviceIdLower.endsWith(q)) ||
                    // Por ID de cliente
                    clienteIdLower.includes(q) ||
                    clienteShortLower.includes(q) ||
                    (q.length <= 6 && clienteIdLower.endsWith(q))
                );
            });

            filteredServices.forEach(servicio => {
                const clienteId = servicio.clienteId;
                if (!clientesMap.has(clienteId)) {
                    clientesMap.set(clienteId, {
                        cliente: clientes.find(c => c.id === clienteId),
                        servicioResumen: servicio, 
                        serviciosCompletos: [],
                    });
                }
                clientesMap.get(clienteId).serviciosCompletos.push(servicio);
            });

            return { 
                mode: 'clientes',
                data: Array.from(clientesMap.values()) 
            };
        }
    }, [serviciosEntregados, clientes, searchQuery]);
    
    
    const handleVerHistorialCompleto = (clienteData) => {
        setClienteSeleccionado(clienteData.cliente);
        const serviciosOrdenados = clienteData.serviciosCompletos.sort(
            (a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada)
        );
        setServiciosDeCliente(serviciosOrdenados); 
        setModalOpen(true);
    };

    const handleVerDetallesDeServicio = (servicio) => {
    const cliente = clientes.find(c => c.id === servicio.clienteId);
        
        setClienteSeleccionado(cliente); 
        setServiciosDeCliente([servicio]); 
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setClienteSeleccionado(null);
        setServiciosDeCliente([]);
    };

    if (isLoading) return <div className="historial-loading">Cargando Historial...</div>;
    
    return (
        <div className="historial-container">
            <h2>Historial de Servicios Entregados 📚</h2>

            <div className="historial-buscador">
                <input
                    type="text"
                    placeholder="Buscar por cliente o ID (corto o completo) para agrupar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Encabezado de la tabla dinámico */}
            <div className={`historial-encabezados historial-encabezados-modo-${listaFinalParaRenderizar.mode}`}>
                {listaFinalParaRenderizar.mode === 'servicios' ? (
                    <>
                        <p>ID Servicio</p>
                        <p>Cliente</p>
                        <p>Tipo</p>
                        <p>F. Entrada</p>
                        <p>F. Salida</p>
                        <p>Opciones</p> 
                    </>
                ) : (
                    <>
                        <p>ID Cliente</p>
                        <p>Nombre Cliente</p>
                        <p>Servicios Entregados</p>
                        <p>Última Entrada</p>
                        <p>Historial</p>
                    </>
                )}
            </div>

            <div className="servicios-historial-lista">
                {listaFinalParaRenderizar.data.length === 0 ? (
                    <p className="mensaje-vacio">
                        {listaFinalParaRenderizar.mode === 'servicios' ? 
                            "No hay servicios entregados registrados." :
                            "No se encontraron coincidencias con la búsqueda."
                        }
                    </p>
                ) : (
                    listaFinalParaRenderizar.mode === 'servicios' ? (
                        // MODO 1: LISTA COMPLETA DE SERVICIOS
                        listaFinalParaRenderizar.data.map(({ servicio, clienteNombre }) => {
                            const fechaEntrada = new Date(servicio.fechaEntrada);
                            const fechaSalida = servicio.fechaSalida ? new Date(servicio.fechaSalida) : null;

                            return (
                                <div 
                                    key={servicio.id} 
                                    className="servicio-historial-row" 
                                >
                                    <p className="col-id">#{shortId(toIdString(servicio.id), 6)}</p>
                                    <p className="col-cliente">{clienteNombre}</p>
                                    <p className="col-tipo">{servicio.tipoServicio || 'N/A'}</p>
                                    <p className="col-entrada">
                                        {fechaEntrada.toLocaleDateString(LOCALE)} {fechaEntrada.toLocaleTimeString(LOCALE, TIME_OPTIONS)}
                                    </p>
                                    <p className="col-salida">
                                        {fechaSalida ? `${fechaSalida.toLocaleDateString(LOCALE)} ${fechaSalida.toLocaleTimeString(LOCALE, TIME_OPTIONS)}` : 'N/A'}
                                    </p>
                                    <div className="col-acciones">
                                        <button 
                                            className="btn-ver-detalle btn-icon"
                                            onClick={() => handleVerDetallesDeServicio(servicio)} 
                                            title="Ver Detalles del Servicio"
                                        >
                                            <span className="icon-more-options">⋮</span> {/* Ícono de tres puntos */}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // MODO 2: LISTA AGRUPADA POR CLIENTE
                        listaFinalParaRenderizar.data.map((data) => {
                            const cliente = data.cliente;
                            const serviciosCount = data.serviciosCompletos.length;
                            const servicioResumen = data.servicioResumen;
                            const fechaEntrada = new Date(servicioResumen.fechaEntrada);
                            
                            return (
                                <div 
                                    key={cliente.id} 
                                    className="cliente-historial-row"
                                >
                                    <p className="col-id">{shortId(toIdString(cliente.id), 6)}</p>
                                    <p className="col-nombre">{cliente.nombreCompleto}</p>
                                    <p className="col-count">
                                        <span className="badge-servicios-historial">{serviciosCount}</span>
                                    </p>
                                    <p className="col-entrada">
                                        {fechaEntrada.toLocaleDateString(LOCALE)} a las {fechaEntrada.toLocaleTimeString(LOCALE, TIME_OPTIONS)}
                                    </p>
                                    <div className="col-acciones">
                                        <button 
                                            className="btn-ver-historial btn-icon-with-text" 
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

            <ServiciosModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                cliente={clienteSeleccionado}
                servicios={serviciosDeCliente}
            />
        </div>
    );
};

export default HistorialAdmin;