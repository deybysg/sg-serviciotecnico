import { useState, useEffect } from "react";
import { api } from "../services/api";
import { shortId } from "../utils/id";
import "./clientes.css";
import Swal from "sweetalert2";

// ------------------------------------------------------------------
// NUEVO COMPONENTE MODAL DE SERVICIOS
// Se traslada aquí desde el código que proporcionaste como referencia.
// Nota: También podrías mover esto a su propio archivo (p. ej., ServiciosModal.jsx) 
// y simplemente importarlo.
// ------------------------------------------------------------------
const LOCALE = 'es-AR'; // Localización para las fechas
const TIME_OPTIONS = { 
    hour: '2-digit', // Muestra la hora (ej: 09)
    minute: '2-digit', // Muestra los minutos (ej: 30)
    hour12: false // Formato 24h
}; 

// Función auxiliar para obtener la etiqueta (Label) del estado
const getEstadoLabel = (value) => {
    const ESTADO_OPTIONS = [
        { value: "pendiente", label: "Pendiente" },
        { value: "enRevision", label: "En Revisión" },
        { value: "revisionTerminada", label: "En Reparación" },
        { value: "terminado", label: "Listo para Entrega" },
        { value: "entregado", label: "Entregado" },
    ];
    // Asegurarse de que el estado exista, si no, usa el valor original
    return ESTADO_OPTIONS.find(o => o.value === value)?.label || (value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Sin Estado');
};

// Función para formatear el valor a moneda
const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat(LOCALE, { 
        style: 'currency', 
        currency: 'ARS', // Asumo Pesos Argentinos o ajusta la moneda
        minimumFractionDigits: 2 
    }).format(Number(value));
};

// Función para formatear la fecha a 'DD/MM/YYYY a las HH:MM'
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    
    try {
        const date = new Date(isoString); 
        // Para la fecha (y evitar el rollback de zona horaria), se puede usar un truco con la fecha "solo"
        const dateOnly = new Date(isoString.split('T')[0] + 'T12:00:00'); 

        const fecha = dateOnly.toLocaleDateString(LOCALE);
        const hora = date.toLocaleTimeString(LOCALE, TIME_OPTIONS);

        return `${fecha} a las ${hora}`;
    } catch (e) {
        console.error("Error al formatear fecha:", e);
        return 'Fecha Inválida';
    }
};

const ServiciosModal = ({ isOpen, onClose, cliente, servicios }) => {
    // CAMBIO CLAVE: Usa 'isOpen' para el renderizado condicional inicial
    if (!isOpen || !cliente) return null; // Elimino el chequeo de servicios.length para mostrar el mensaje de "no servicios"

    // Si solo hay un servicio, ajusta el título (Aunque en este contexto siempre serán N servicios del cliente)
    const isSingleService = servicios.length === 1 && servicios[0].id === cliente.serviciosRealizados[0];

    // Función auxiliar para renderizar el detalle de cada servicio
    const renderServicioDetalle = (s) => {
    const servicioId = s._id || s.id;
        return (
            <div key={servicioId} className="servicio-item-modal">
        <h4 className="servicio-titulo-modal">Servicio ID: {shortId(servicioId, 6)} ({s.tipoServicio || 'N/A'})</h4>
                
                <p>
                    <strong>Estado:</strong> 
                    <span className={`estado-badge estado-${s.estado}`}>
                        {getEstadoLabel(s.estado)}
                    </span>
                </p>
                
                <p>
                    <strong>Fecha de Entrada: </strong> 
                    {formatDateTime(s.fechaEntrada)}
                </p>
                
                {s.fechaSalida && (
                    <p>
                        <strong>Fecha de Salida: </strong> 
                        {formatDateTime(s.fechaSalida)}
                    </p>
                )}
                
                <div className="detalle-seccion">
                    <h4>Detalles del Servicio</h4>
                    <p className="detalle-contenido">{s.detalles || 'Sin descripción de detalles o falla.'}</p>
                </div>

                <div className="presupuesto-detalle">
                    <h4>Detalle de Presupuesto</h4>
                    {s.presupuesto?.items && s.presupuesto.items.length > 0 ? (
                        <>
                            {s.presupuesto.items.map((item, index) => (
                                <p key={index} className="presupuesto-item-line">
                                    <span>{item.descripcion}</span>
                                    <span>{formatCurrency(Number(item.costo))}</span>
                                </p>
                            ))}
                            <p className="presupuesto-total-line">
                                <span>Total Presupuesto:</span> 
                                <span>{formatCurrency(Number(s.presupuesto?.total || 0))}</span>
                            </p>
                        </>
                    ) : (
                        <p className="presupuesto-item-line">No se especificaron ítems en el presupuesto.</p>
                    )}
                    
                </div>
            </div>
        );
    };
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                
                <h3 className="modal-titulo">
                    {/* El título se ajusta dinámicamente según la lógica del nuevo modal */}
                    {isSingleService && servicios.length === 1 
                        ? `Detalle de Servicio #${servicios[0].id}` 
                        : `Historial de Servicios de ${cliente.nombreCompleto}`
                    }
                </h3>
                
                <div className="modal-body">
                    {servicios.length === 0 ? (
                        <p className="no-servicios-modal">Este cliente no tiene servicios registrados.</p>
                    ) : (
                         <>
                            {servicios.length > 0 && (
                                <p className="info-resumen-modal">
                                    Se encontraron **{servicios.length}** servicio(s) asociados a este cliente.
                                </p>
                            )}
                            <div className="servicios-lista-modal">
                                {servicios.map(renderServicioDetalle)}
                            </div>
                         </>
                    )}
                </div>
                
            </div>
        </div>
    );
};
// ------------------------------------------------------------------

// Modal para mostrar Top de clientes por cantidad de servicios
const TopClientsModal = ({ isOpen, onClose, topClients, onViewCliente }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h3 className="modal-titulo">Top clientes por cantidad de servicios</h3>
                <div className="modal-body">
                    {topClients.length === 0 ? (
                        <p>No hay datos suficientes.</p>
                    ) : (
                        <ol className="top-client-list">
                            {topClients.map((item, idx) => (
                                <li key={item._id} className="top-client-item">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <div>
                                            <strong>{idx + 1}. {item.nombreCompleto || 'Sin nombre'}</strong>
                                            <div style={{fontSize:'.9rem', color:'#64748b'}}>Servicios: {item.count}</div>
                                        </div>
                                        <div>
                                            <button className="btn-detalles" onClick={() => onViewCliente(item)}>Ver Servicios</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
};


function Clientes() {
    const [formData, setFormData] = useState({
        nombreCompleto: "",
        celular: "",
        correo: "",
        direccion: "",
        serviciosRealizados: [], 
    });

    const [clientes, setClientes] = useState([]);
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState("");
    const [mostrarLista, setMostrarLista] = useState(false);
    
    // ESTADOS para el Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [serviciosDetalle, setServiciosDetalle] = useState([]);
    const [topOpen, setTopOpen] = useState(false);
    const [topList, setTopList] = useState([]);

    // Cargar clientes al inicio
    useEffect(() => {
        const loadClientes = async () => {
            try {
                const data = await api.get('/clientes');
                setClientes(data);
            } catch (error) {
                console.error("Error al cargar clientes:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "No se pudieron cargar los clientes.",
                });
            }
        };
        loadClientes();
    }, []);
    
    // Función para obtener detalles de los servicios
    const fetchServiciosDetalle = async (serviciosRealizados) => {
        if (!serviciosRealizados || serviciosRealizados.length === 0) {
            setServiciosDetalle([]);
            return;
        }

        // El backend ya devuelve los servicios populados en el array serviciosRealizados
        // Si son objetos completos, los usamos directamente
        if (typeof serviciosRealizados[0] === 'object' && serviciosRealizados[0]._id) {
            // Ya están populados, ordenar por fecha de entrada más reciente primero
            const serviciosOrdenados = [...serviciosRealizados]
                .sort((a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada));
            setServiciosDetalle(serviciosOrdenados);
            return;
        }

        // Si solo son IDs (fallback), traer todos y filtrar
        try {
            const todosLosServicios = await api.get('/servicios');
            
            // Convertir IDs a strings para comparar
            const idsStrings = serviciosRealizados.map(id => String(id));
            
            // Filtrar servicios que corresponden a los IDs del cliente
            const serviciosFiltrados = todosLosServicios
                .filter(servicio => {
                    const servicioId = String(servicio._id || servicio.id);
                    return idsStrings.includes(servicioId);
                })
                // Ordenar por fecha de entrada más reciente primero
                .sort((a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada)); 
            
            setServiciosDetalle(serviciosFiltrados);
        } catch (error) {
            console.error("Error al cargar detalles de servicios:", error);
            setServiciosDetalle([]);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "No se pudieron cargar los detalles de los servicios.",
            });
        }
    };

    // Función para abrir el modal
    const handleOpenModal = (cliente) => {
        setClienteSeleccionado(cliente);
        fetchServiciosDetalle(cliente.serviciosRealizados);
        setModalOpen(true); // Se establece a true
    };

    // Abrir modal Top clientes
    const handleOpenTop = () => {
        // Calcular top por cantidad de servicios (asegurarse de manejar arrays u objetos)
        const ranked = [...clientes]
            .map(c => ({
                _id: c._id || c.id,
                nombreCompleto: c.nombreCompleto,
                count: Array.isArray(c.serviciosRealizados) ? c.serviciosRealizados.length : 0,
                raw: c
            }))
            .sort((a, b) => b.count - a.count)
            .filter(item => item.count > 0)
            .slice(0, 10)
            .map(item => ({ ...item.raw, count: item.count }));

        setTopList(ranked);
        setTopOpen(true);
    };

    const handleCloseTop = () => {
        setTopOpen(false);
        setTopList([]);
    };

    // Función para cerrar el modal
    const handleCloseModal = () => {
        setModalOpen(false);
        setClienteSeleccionado(null);
        setServiciosDetalle([]);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let successMessage = "Cliente agregado correctamente. ";

        try {
            let result;
            
            if (editId) {
                // PUT /clientes/:id (requiere auth)
                result = await api.put(`/clientes/${editId}`, formData);
                successMessage = "Cliente editado correctamente. ";
                
                // Actualizar en la lista local con el resultado del servidor
                setClientes(
                    clientes.map((c) =>
                        String(c._id || c.id) === String(editId) ? result : c
                    )
                );
                setEditId(null);
            } else {
                // POST /clientes (requiere auth)
                result = await api.post('/clientes', {
                    ...formData, 
                    serviciosRealizados: []
                });
                
                // Agregar a la lista local
                setClientes([...clientes, result]);
            }

            // Toast notification
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            Toast.fire({
                icon: 'success',
                title: editId ? '✅ Cliente editado exitosamente' : '✅ Cliente agregado exitosamente'
            });

            setFormData({ nombreCompleto: "", celular: "", correo: "", direccion: "", serviciosRealizados: [] });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "No se pudo realizar la operación.",
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Está seguro de eliminar este cliente?",
            text: "¡Si elimina el cliente, sus servicios registrados quedarán huérfanos!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#EF4444", 
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, ¡Eliminar!",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                // DELETE /clientes/:id (requiere auth)
                await api.delete(`/clientes/${id}`);
                
                // Actualizar lista local - convertir a String para comparación
                setClientes(clientes.filter((c) => String(c._id || c.id) !== String(id)));

                // Toast notification
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                });

                Toast.fire({
                    icon: 'success',
                    title: '🗑️ Cliente eliminado exitosamente'
                });
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "No se pudo eliminar el cliente.",
                    confirmButtonColor: '#3b82f6'
                });
            }
        }
    };

    const handleEdit = (cliente) => {
        // Solo extraer los campos editables del formulario
        setFormData({
            nombreCompleto: cliente.nombreCompleto,
            celular: cliente.celular,
            correo: cliente.correo,
            direccion: cliente.direccion,
            serviciosRealizados: cliente.serviciosRealizados || []
        }); 
        setEditId(cliente._id || cliente.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const filteredClientes = clientes.filter((c) =>
        c.nombreCompleto.toLowerCase().includes(search.toLowerCase())
    );
    

    return (
        <div className="clientes-full">
            <div className="clientes-container">
                <h2>Gestión de Clientes</h2>

                {/* Formulario */}
                <form className="cliente-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="nombreCompleto"
                        placeholder="Apellido y Nombre"
                        value={formData.nombreCompleto}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="celular"
                        placeholder="Celular"
                        value={formData.celular}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="correo"
                        placeholder="Correo"
                        value={formData.correo}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="direccion"
                        placeholder="Dirección"
                        value={formData.direccion}
                        onChange={handleChange}
                    />
                    <button type="submit" className="btn-primary">
                        {editId ? "Guardar cambios " : "Agregar Cliente +"}
                    </button>
                </form>

                {/* Toggle Lista */}
                <button
                    className="btn-toggle"
                    onClick={() => setMostrarLista(!mostrarLista)}
                >
                    {mostrarLista
                        ? "Ocultar Lista de Clientes ▲"
                        : "Ver Lista de Clientes ▼"}
                </button>

                {/* Lista desplegable */}
                <div
                    className={`clientes-lista-wrapper ${
                        mostrarLista ? "show" : "hide"
                    }`}
                >
                    {mostrarLista && (
                        <div className="clientes-lista">
                            <div className="buscador" style={{display:'flex', gap: '8px', alignItems:'center'}}>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nombre..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {filteredClientes.length === 0 ? (
                                <p className="no-clientes">No hay clientes que coincidan</p>
                            ) : (
                                filteredClientes.map((c) => (
                                    <div key={c._id || c.id} className="cliente-card">
                                        {/* Información principal */}
                                        <div className="cliente-info">
                                            <h4>{c.nombreCompleto}</h4>
                                            <p>
                                                <b>Celular:</b> {c.celular}
                                            </p>
                                            <p>
                                                <b>Correo:</b> {c.correo}
                                            </p>
                                            <p>
                                                <b>Dirección:</b> {c.direccion}
                                            </p>
                                        </div>

                                        {/* Botón de Historial (Abre el nuevo Modal) */}
                                        <div className="historial-toggle-area">
                                            <button
                                                className="btn-historial"
                                                onClick={() => handleOpenModal(c)}
                                            >
                                                Ver {c.serviciosRealizados.length || 0} Servicios Realizados 👁️
                                            </button>
                                        </div>
                                        
                                        {/* Acciones */}
                                        <div className="acciones">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(c)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(c._id || c.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Renderizado del Modal de Servicios (AHORA USA LA PROP isOpen) */}
            <ServiciosModal
                isOpen={modalOpen} // CAMBIO: Usamos el nuevo estado 'modalOpen'
                cliente={clienteSeleccionado}
                servicios={serviciosDetalle}
                onClose={handleCloseModal}
            />

            <TopClientsModal
                isOpen={topOpen}
                onClose={handleCloseTop}
                topClients={topList}
                onViewCliente={(cliente) => {
                    // Cierra el top y abre el modal de servicios del cliente
                    handleCloseTop();
                    handleOpenModal(cliente);
                }}
            />
        </div>
    );
}

export default Clientes;