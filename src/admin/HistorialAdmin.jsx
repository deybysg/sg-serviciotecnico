import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import ServiciosModal from "./HistorialModal";
import "../styles/admin/HistorialAdmin.css";
import { api } from "../services/api";
import { shortId, toIdString } from "../utils/id";
import {
  FiBook, FiSearch, FiCalendar, FiX, FiUser, FiTool,
  FiCheckCircle, FiClock, FiHash, FiEye, FiMoreVertical
} from "react-icons/fi";
import { getEstadoLabel } from "../constants";

const LOCALE = 'es-AR'; // Localización para las fechas
const TIME_OPTIONS = { hour12: false }; // Opciones para el formato 24h

// --- Funciones Auxiliares ---
// getEstadoLabel ahora viene de constants

const getClienteName = (clienteId, clientes) => {
    if (!clienteId) return "Cliente Desconocido";
    const found = clientes.find(c => (String(c.id) === String(clienteId)));
    return found ? (found.nombreCompleto || found.label || 'Cliente Desconocido') : "Cliente Desconocido";
};

// Normaliza propiedades snake_case a camelCase para compatibilidad entre MongoDB y PostgreSQL
function normalizeServicio(s) {
    if (!s) return s;
    const id = s.id || s._id;
    let clienteId;
    if (s.cliente_id != null) {
        clienteId = String(s.cliente_id);
    } else if (s.clienteId != null) {
        clienteId = String(s.clienteId);
    } else if (s.cliente && typeof s.cliente === 'object') {
        clienteId = String(s.cliente.id || s.cliente._id);
    } else if (s.cliente != null) {
        clienteId = String(s.cliente);
    }
    return {
        id: id,
        _id: id,
        servicioNumero: s.servicio_numero ?? s.servicioNumero,
        clienteId: clienteId,
        cliente: clienteId,
        tipoEquipo: s.tipo_equipo ?? s.tipoEquipo,
        marcaProducto: s.marca_producto ?? s.marcaProducto,
        modeloProducto: s.modelo_producto ?? s.modeloProducto,
        tipoServicio: s.tipo_servicio ?? s.tipoServicio,
        fallaReportada: s.falla_reportada ?? s.fallaReportada,
        asunto: s.asunto,
        detalles: s.detalles,
        notasAdicionales: s.notas_adicionales ?? s.notasAdicionales,
        metodoPago: s.metodo_pago ?? s.metodoPago,
        anticipo: s.anticipo,
        presupuesto: s.presupuesto || {
            items: s.presupuesto_items || [],
            subtotal: s.presupuesto_subtotal || 0,
            iva: s.presupuesto_iva || 0,
            total: s.presupuesto_total || 0
        },
        estado: s.estado,
        detalleCliente: s.detalle_cliente ?? s.detalleCliente,
        seguimiento: s.seguimiento || [],
        fechaEntrada: s.fecha_entrada ?? s.fechaEntrada,
        fechaSalida: s.fecha_salida ?? s.fechaSalida,
        createdAt: s.created_at ?? s.createdAt,
        updatedAt: s.updated_at ?? s.updatedAt,
    };
}

function normalizeCliente(c) {
    if (!c) return c;
    return {
        id: c.id || c._id,
        nombreCompleto: c.nombre_completo || c.nombreCompleto || '',
        celular: c.celular || '',
        correo: c.correo || c.email || '',
        direccion: c.direccion || '',
        dni: c.dni || '',
    };
}

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

                    // Normalizar clientes y servicios para tolerar _id/id y snake_case/camelCase
                    const clientesData = (clientesRaw || []).map(normalizeCliente);
                    const serviciosData = (serviciosRaw || []).map(normalizeServicio);

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

    if (isLoading) return (
        <div className="historial-container">
            <div className="historial-loading"><FiBook size={24} style={{ marginBottom: 8 }} /> Cargando Historial...</div>
        </div>
    );
    
    return (
        <div className="historial-container">
            <div className="historial-shell">
                <div className="historial-header">
                    <h2><FiBook size={28} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Historial de Servicios Entregados</h2>
                    <p>Gestiona y consulta el historial de todos los servicios entregados.</p>
                </div>

                <div className="historial-filters">
                    <div className="historial-filters-row">
                        <div className="historial-filters-left">
                            <label><FiCalendar size={14} /> Mes:</label>
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                            {selectedMonth && (
                                <button className="historial-btn-clear" onClick={() => setSelectedMonth('')}>
                                    <FiX size={14} /> Limpiar
                                </button>
                            )}
                        </div>

                        <div className="historial-top3">
                            <h3><FiUser size={14} /> Top 3 Clientes — {selectedMonth ? selectedMonth : 'Todos los tiempos'}</h3>
                            <div className="historial-top3-grid">
                                {(() => {
                                    const counts = {};
                                    serviciosPorPeriodo.forEach(s => {
                                        const cid = s.clienteId || 'sin-id';
                                        counts[cid] = (counts[cid] || 0) + 1;
                                    });
                                    const entries = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0,3);
                                    if (entries.length === 0) return <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No hay servicios en el periodo.</p>;
                                    return entries.map(([cid, cnt], idx) => {
                                        const clienteObj = clientes.find(c => String(c.id) === String(cid)) || { id: cid, nombreCompleto: 'Cliente Desconocido' };
                                        return (
                                            <div key={cid} className="historial-top3-card">
                                                <span className="historial-top3-rank">#{idx+1}</span>
                                                <p className="historial-top3-name">{clienteObj.nombreCompleto}</p>
                                                <p className="historial-top3-count">{cnt} servicios</p>
                                                <button onClick={() => {
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

                    <div className="historial-search">
                        <FiSearch size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o ID (corto o completo) para agrupar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Encabezado de la tabla dinámico */}
                <div className={`historial-encabezados historial-encabezados-modo-${listaFinalParaRenderizar.mode}`}>
                    {listaFinalParaRenderizar.mode === 'servicios' ? (
                        <>
                            <p><FiHash size={12} /> ID</p>
                            <p><FiUser size={12} /> Cliente</p>
                            <p><FiTool size={12} /> Tipo</p>
                            <p><FiCalendar size={12} /> Entrada</p>
                            <p><FiCheckCircle size={12} /> Salida</p>
                            <p><FiEye size={12} /> Ver</p>
                        </>
                    ) : (
                        <>
                            <p><FiHash size={12} /> ID</p>
                            <p><FiUser size={12} /> Cliente</p>
                            <p><FiCheckCircle size={12} /> Entregados</p>
                            <p><FiCalendar size={12} /> Última Entrada</p>
                            <p><FiEye size={12} /> Historial</p>
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
                                                className="btn-ver-detalle"
                                                onClick={() => handleVerDetallesDeServicio(servicio)} 
                                                title="Ver Detalles del Servicio"
                                            >
                                                <FiMoreVertical size={16} />
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

                <ServiciosModal
                    isOpen={modalOpen}
                    onClose={handleCloseModal}
                    cliente={clienteSeleccionado}
                    servicios={serviciosDeCliente}
                />
            </div>
        </div>
    );
};

export default HistorialAdmin;