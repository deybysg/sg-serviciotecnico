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
    const found = clientes.find(c => (String(c.id) === String(clienteId)));
    return found ? (found.nombreCompleto || found.label || 'Cliente Desconocido') : "Cliente Desconocido";
};

// Formatea el número de servicio a 3 dígitos si existe, si no muestra un shortId del id
const formatServicioNumero = (servicio) => {
    if (!servicio) return '';
    if (servicio.servicioNumero !== undefined && servicio.servicioNumero !== null && servicio.servicioNumero !== '') {
        return `#${String(servicio.servicioNumero).padStart(3, '0')}`;
    }
    // fallback al shortId del id
    return `#${shortId(toIdString(servicio.id), 6)}`;
};

// --- Componente Principal ---
const HistorialAdmin = () => {
    const [clientes, setClientes] = useState([]);
    const [serviciosEntregados, setServiciosEntregados] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(''); // format YYYY-MM
    
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

                    // Solo los entregados con fecha de salida, ordenados por fecha más reciente
                    const historial = serviciosData
                        .filter((s) => s.estado === "entregado" && s.fechaSalida)
                        .sort((a, b) => new Date(b.fechaSalida) - new Date(a.fechaSalida));

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

    // Servicios filtrados por mes seleccionado (si aplica)
    const serviciosPorPeriodo = useMemo(() => {
        if (!selectedMonth) return serviciosEntregados;
        // selectedMonth format: YYYY-MM
        const [y, m] = selectedMonth.split('-').map(Number);
        return serviciosEntregados.filter(s => {
            if (!s.fechaSalida) return false;
            const d = new Date(s.fechaSalida);
            return d.getFullYear() === y && (d.getMonth() + 1) === m;
        });
    }, [serviciosEntregados, selectedMonth]);

    // Lógica para alternar la vista (servicios completos vs. clientes agrupados)
    const listaFinalParaRenderizar = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const estaBuscando = query.length > 0;
        // aplicar filtrado por mes/periodo antes de todo
        const baseServicios = serviciosPorPeriodo;

        if (!estaBuscando) {
            // MODO SERVICIOS: Muestra todos los servicios (repetidos)
            return { 
                mode: 'servicios',
                data: baseServicios.map(s => ({
                    servicio: s, 
                    clienteNombre: getClienteName(s.clienteId, clientes)
                }))
            };
        } else {
            const filteredServices = baseServicios.filter((s) => {
                const clienteNombre = getClienteName(s.clienteId, clientes).toLowerCase();
                const fullServiceId = s.id ? String(s.id) : "";
                const serviceIdLower = fullServiceId.toLowerCase();
                const serviceShortLower = shortId(fullServiceId, 6).toLowerCase();
                
                // Número de servicio formateado (e.g., "102")
                const servicioNum = s.servicioNumero !== undefined && s.servicioNumero !== null && s.servicioNumero !== '' 
                    ? String(s.servicioNumero) 
                    : '';

                const clienteFullId = s.clienteId ? String(s.clienteId) : "";
                const clienteIdLower = clienteFullId.toLowerCase();
                const clienteShortLower = shortId(clienteFullId, 6).toLowerCase();

                const q = query.replace(/[#\s]/g, "").toLowerCase();

                return (
                    // Por nombre de cliente
                    clienteNombre.includes(q) ||
                    // Por número de servicio (102, 103, etc.)
                    (servicioNum && servicioNum.includes(q)) ||
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

            // Detectar si la búsqueda es por número/ID de servicio
            const q = query.replace(/[#\s]/g, "").toLowerCase();
            const esBusquedaPorServicio = filteredServices.some((s) => {
                const servicioNum = s.servicioNumero !== undefined && s.servicioNumero !== null && s.servicioNumero !== '' 
                    ? String(s.servicioNumero).toLowerCase() 
                    : '';
                const fullServiceId = s.id ? String(s.id).toLowerCase() : "";
                const serviceShortLower = shortId(String(s.id || ''), 6).toLowerCase();
                
                return (
                    (servicioNum && servicioNum === q) ||
                    fullServiceId.includes(q) ||
                    serviceShortLower === q ||
                    fullServiceId.endsWith(q)
                );
            });

            // Si busca por servicio, mostrar vista de servicios individuales
            if (esBusquedaPorServicio) {
                return {
                    mode: 'servicios',
                    data: filteredServices.map(s => ({
                        servicio: s,
                        clienteNombre: getClienteName(s.clienteId, clientes)
                    }))
                };
            }

            // MODO CLIENTES: Agrupa por cliente al buscar por nombre de cliente
            const clientesMap = new Map();

            filteredServices.forEach(servicio => {
                const clienteId = servicio.clienteId;
                if (!clientesMap.has(clienteId)) {
                    const clienteObj = clientes.find(c => String(c.id) === String(clienteId));
                    clientesMap.set(clienteId, {
                        cliente: clienteObj || { id: clienteId || 'sin-id', nombreCompleto: 'Cliente Desconocido' },
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
    }, [serviciosPorPeriodo, clientes, searchQuery]);
    
    
    const handleVerHistorialCompleto = (clienteData) => {
        setClienteSeleccionado(clienteData.cliente);
        const serviciosOrdenados = clienteData.serviciosCompletos.sort(
            (a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada)
        );
        setServiciosDeCliente(serviciosOrdenados); 
        setModalOpen(true);
    };

    const handleVerDetallesDeServicio = (servicio) => {
    const cliente = clientes.find(c => String(c.id) === String(servicio.clienteId)) || { id: servicio.clienteId || 'sin-id', nombreCompleto: 'Cliente Desconocido' };
        
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

            <div className="historial-buscador" style={{display:'flex', flexDirection:'column', gap:12}}>
                <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16}}>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                        <div style={{display:'flex', alignItems:'center'}}>
                            <label style={{marginRight:6}}>Mes:</label>
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                            {selectedMonth && <button style={{marginLeft:8}} onClick={() => setSelectedMonth('')}>Limpiar</button>}
                        </div>
                    </div>

                    {/* Top 3 clientes en el periodo seleccionado (o total si no hay periodo) */}
                    <div className="top3-clientes" style={{minWidth:260}}>
                        <h3 style={{marginTop:0}}>Top 3 Clientes — {selectedMonth ? selectedMonth : 'Todos los tiempos'}</h3>
                        <div style={{display:'flex', gap:12}}>
                            {(() => {
                                // calcular top 3
                                const counts = {};
                                serviciosPorPeriodo.forEach(s => {
                                    const cid = s.clienteId || 'sin-id';
                                    counts[cid] = (counts[cid] || 0) + 1;
                                });
                                const entries = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0,3);
                                if (entries.length === 0) return <p>No hay servicios en el periodo.</p>;
                                return entries.map(([cid, cnt], idx) => {
                                    const clienteObj = clientes.find(c => String(c.id) === String(cid)) || { id: cid, nombreCompleto: 'Cliente Desconocido' };
                                    return (
                                        <div key={cid} style={{padding:8, border:'1px solid #e2e8f0', borderRadius:6}}>
                                            <strong>#{idx+1}</strong>
                                            <p style={{margin:0}}>{clienteObj.nombreCompleto}</p>
                                            <p style={{margin:0}}>{cnt} servicios</p>
                                            <button onClick={() => {
                                                // abrir historial del cliente
                                                const serviciosCliente = serviciosPorPeriodo.filter(s => String(s.clienteId) === String(cid));
                                                handleVerHistorialCompleto({ cliente: clienteObj, serviciosCompletos: serviciosCliente, servicioResumen: serviciosCliente[0] });
                                            }}>Ver historial</button>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Buscador por cliente o ID - debajo del Top3 */}
                <div>
                    <input
                        type="text"
                        placeholder="Buscar por cliente o ID (corto o completo) para agrupar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{width:'100%'}}
                    />
                </div>
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
                                    <p className="col-id">{formatServicioNumero(servicio)}</p>
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
                            const cliente = data.cliente || { id: data.servicioResumen?.clienteId || 'sin-id', nombreCompleto: 'Cliente Desconocido' };
                            const serviciosCount = data.serviciosCompletos.length;
                            const servicioResumen = data.servicioResumen;
                            const fechaEntrada = new Date(servicioResumen.fechaEntrada);
                            
                            return (
                                <div 
                                    key={cliente.id || (servicioResumen?.clienteId || shortId(toIdString(servicioResumen.id),6))} 
                                    className="cliente-historial-row"
                                >
                                    <p className="col-id">{shortId(toIdString(cliente.id || servicioResumen?.clienteId), 6)}</p>
                                    <p className="col-nombre">{cliente.nombreCompleto || 'Cliente Desconocido'}</p>
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