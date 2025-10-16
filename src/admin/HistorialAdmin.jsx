import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import ServiciosModal from "./HistorialModal";
import "./HistorialAdmin.css"; 

const API_URL = "http://localhost:3001";
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
    return clientes.find(c => c.id === clienteId)?.nombreCompleto || "Cliente Desconocido";
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
          const [clientesRes, serviciosRes] = await Promise.all([
            fetch(`${API_URL}/clientes`),
            fetch(`${API_URL}/servicios`),
          ]);
    
          const clientesData = await clientesRes.json();
          const serviciosData = await serviciosRes.json();
    
          const historial = serviciosData.filter(
            (s) => s.estado === "entregado" && s.fechaSalida
          );
          
          setServiciosEntregados(historial);
          setClientes(clientesData);
          
        } catch (error) {
          console.error("Error al cargar historial:", error);
          Swal.fire("Error", "No se pudo cargar el historial de servicios.", "error");
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
                return clienteNombre.includes(query) || s.id.toString().includes(query);
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
                    placeholder="Buscar por cliente o ID de servicio para agrupar..."
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
                                    <p className="col-id">#{servicio.id}</p>
                                    <p className="col-cliente">{clienteNombre}</p>
                                    <p className="col-tipo">{servicio.tipoServicio || 'N/A'}</p>
                                    <p className="col-entrada">
                                        {fechaEntrada.toLocaleDateString()} {fechaEntrada.toLocaleTimeString(LOCALE, TIME_OPTIONS)}
                                    </p>
                                    <p className="col-salida">
                                        {fechaSalida ? `${fechaSalida.toLocaleDateString()} ${fechaSalida.toLocaleTimeString(LOCALE, TIME_OPTIONS)}` : 'N/A'}
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
                                    <p className="col-id">{cliente.id}</p>
                                    <p className="col-nombre">{cliente.nombreCompleto}</p>
                                    <p className="col-count">
                                        <span className="badge-servicios-historial">{serviciosCount}</span>
                                    </p>
                                    <p className="col-entrada">
                                        {fechaEntrada.toLocaleDateString()} a las {fechaEntrada.toLocaleTimeString(LOCALE, TIME_OPTIONS)}
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