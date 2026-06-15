import { useState, useEffect } from "react";
import { api } from "../services/api";
import { shortId } from "../utils/id";
import "./Clientes.css";
import Swal from "sweetalert2";
import { FiUser, FiPhone, FiMail, FiMapPin, FiHash, FiTool, FiEdit3, FiTrash2, FiEye, FiSearch, FiPlus, FiUsers, FiGrid, FiList } from "react-icons/fi";
import { getEstadoLabel } from "../constants";

// ------------------------------------------------------------------
// NUEVO COMPONENTE MODAL DE SERVICIOS
// Se trasladados aquí desde el código que proporcionaste como referencia.
// Nota: También podrías mover esto a su propio archivo (p. ej., ServiciosModal.jsx) 
// y simplemente importarlo.
// ------------------------------------------------------------------
const LOCALE = 'es-AR'; // Localización para las fechas
const TIME_OPTIONS = { 
    hour: '2-digit', // Muestra la hora (ej: 09)
    minute: '2-digit', // Muestra los minutos (ej: 30)
    hour12: false // Formato 24h
}; 

// Función auxiliar para obtener la etiqueta (Label) del estado - ahora viene de constants

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
        // Formato de número de servicio: si existe servicioNumero, usarlo; si no, usar shortId
        const numeroServicio = s.servicioNumero !== undefined && s.servicioNumero !== null && s.servicioNumero !== '' 
            ? `#${String(s.servicioNumero).padStart(3, '0')}`
            : `#${shortId(servicioId, 6)}`;
            
        return (
            <div key={servicioId} className="servicio-item-modal">
        <h4 className="servicio-titulo-modal">Servicio ID: {numeroServicio} ({s.tipoServicio || 'N/A'})</h4>
                
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
                        ? (() => {
                            const s = servicios[0];
                            const numeroServicio = s.servicioNumero !== undefined && s.servicioNumero !== null && s.servicioNumero !== '' 
                                ? `#${String(s.servicioNumero).padStart(3, '0')}`
                                : `#${shortId(s.id, 6)}`;
                            return `Detalle de Servicio ${numeroServicio}`;
                        })()
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


// Normaliza las propiedades de snake_case a camelCase y asegura valores por defecto
function normalizeCliente(c) {
    if (!c) return c;
    return {
        id: c.id,
        _id: c.id,
        nombreCompleto: c.nombre_completo || c.nombreCompleto || '',
        celular: c.celular || '',
        correo: c.correo || c.email || '',
        direccion: c.direccion || '',
        dni: c.dni || '',
        serviciosRealizados: c.serviciosRealizados || [],
        createdAt: c.created_at || c.createdAt,
        updatedAt: c.updated_at || c.updatedAt,
    };
}

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

function Clientes() {
    const [formData, setFormData] = useState({
        nombreCompleto: "",
        celular: "",
        correo: "",
        direccion: "",
        dni: "",
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

    // Cargar clientes al inicio
    useEffect(() => {
        const loadClientes = async () => {
            try {
                const data = await api.get('/clientes');
                const normalized = Array.isArray(data) ? data.map(normalizeCliente) : [];
                setClientes(normalized);
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
            // Ya están populados, normalizar y ordenar por fecha de entrada más reciente primero
            const serviciosOrdenados = serviciosRealizados
                .map(normalizeServicio)
                .sort((a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada));
            setServiciosDetalle(serviciosOrdenados);
            return;
        }

        // Si solo son IDs (fallback), traer todos y filtrar
        try {
            const todosLosServicios = await api.get('/servicios');
            const serviciosNormalizados = Array.isArray(todosLosServicios)
                ? todosLosServicios.map(normalizeServicio)
                : [];

            // Convertir IDs a strings para comparar
            const idsStrings = serviciosRealizados.map(id => String(id));

            // Filtrar servicios que corresponden a los IDs del cliente
            const serviciosFiltrados = serviciosNormalizados
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

            setFormData({ nombreCompleto: "", celular: "", correo: "", direccion: "", dni: "", serviciosRealizados: [] });
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
            dni: cliente.dni || '',
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
                <h1>Gestión de Clientes</h1>

                {/* Formulario moderno compacto */}
                <form className="cliente-form-compact" onSubmit={handleSubmit}>
                    <div className="cliente-card-form">
                        {/* Header */}
                        <div className="cliente-form-header">
                            <div className="cliente-form-avatar">
                                <FiUser size={18} />
                            </div>
                            <div className="cliente-form-header-info">
                                <h3>{editId ? "Editar Cliente" : "Nuevo Cliente"}</h3>
                                <span>{editId ? "Modificá los datos del cliente" : "Completá los datos del nuevo cliente"}</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="cliente-form-body">
                            <div className="cliente-form-row">
                                <div className="cliente-form-field">
                                    <label className="cliente-form-label">
                                        <FiUser size={12} /> Nombre completo <span className="cliente-form-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombreCompleto"
                                        className="cliente-form-input"
                                        placeholder="Ej: Juan Perez"
                                        value={formData.nombreCompleto}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="cliente-form-field">
                                    <label className="cliente-form-label">
                                        <FiPhone size={12} /> Celular <span className="cliente-form-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="celular"
                                        className="cliente-form-input"
                                        placeholder="Ej: 11 1234 5678"
                                        value={formData.celular}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="cliente-form-row">
                                <div className="cliente-form-field">
                                    <label className="cliente-form-label">
                                        <FiMail size={12} /> Correo
                                    </label>
                                    <input
                                        type="email"
                                        name="correo"
                                        className="cliente-form-input"
                                        placeholder="Ej: juanperez@email.com"
                                        value={formData.correo}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="cliente-form-field">
                                    <label className="cliente-form-label">
                                        <FiHash size={12} /> DNI
                                    </label>
                                    <input
                                        type="text"
                                        name="dni"
                                        className="cliente-form-input"
                                        placeholder="Ej: 12.345.678"
                                        value={formData.dni}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="cliente-form-field">
                                <label className="cliente-form-label">
                                    <FiMapPin size={12} /> Dirección
                                </label>
                                <input
                                    type="text"
                                    name="direccion"
                                    className="cliente-form-input"
                                    placeholder="Ej: Av. Siempre Viva 123, CABA"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="cliente-form-footer">
                            <button type="submit" className="cliente-form-btn">
                                <FiPlus size={14} /> {editId ? "Guardar cambios" : "Agregar Cliente"}
                            </button>
                        </div>
                    </div>
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
                            {/* Header de lista con stats */}
                            <div className="clientes-lista-header">
                                <div className="clientes-stats">
                                    <span className="clientes-stat-badge">
                                        <FiUsers /> {filteredClientes.length} clientes
                                    </span>
                                </div>
                                <div className="buscador">
                                    <FiSearch className="buscador-icon" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente por nombre, celular, correo..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredClientes.length === 0 ? (
                                <div className="no-clientes">
                                    <FiSearch size={40} />
                                    <p>No se encontraron clientes</p>
                                    <span>Intentá con otro término de búsqueda</span>
                                </div>
                            ) : (
                                <div className="clientes-grid">
                                    {filteredClientes.map((c) => {
                                        const iniciales = c.nombreCompleto
                                            ? c.nombreCompleto.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                            : '??';
                                        const serviciosCount = c.serviciosRealizados?.length || 0;
                                        return (
                                            <div key={c._id || c.id} className="cliente-card-modern">
                                                {/* Header: Avatar + Nombre + Badge */}
                                                <div className="cliente-card-header">
                                                    <div className="cliente-avatar">
                                                        {iniciales}
                                                    </div>
                                                    <div className="cliente-header-info">
                                                        <h4>{c.nombreCompleto}</h4>
                                                        {c.dni && (
                                                            <span className="cliente-dni">
                                                                <FiHash size={10} /> {c.dni}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="cliente-servicios-badge">
                                                        <FiTool size={12} />
                                                        {serviciosCount}
                                                    </div>
                                                </div>

                                                {/* Body: Datos con iconos */}
                                                <div className="cliente-card-body">
                                                    <div className="cliente-data-row">
                                                        <span className="cliente-data-icon"><FiPhone size={14} /></span>
                                                        <span className="cliente-data-label">Celular</span>
                                                        <span className="cliente-data-value">{c.celular || '—'}</span>
                                                    </div>
                                                    <div className="cliente-data-row">
                                                        <span className="cliente-data-icon"><FiMail size={14} /></span>
                                                        <span className="cliente-data-label">Correo</span>
                                                        <span className="cliente-data-value">{c.correo || '—'}</span>
                                                    </div>
                                                    <div className="cliente-data-row">
                                                        <span className="cliente-data-icon"><FiMapPin size={14} /></span>
                                                        <span className="cliente-data-label">Dirección</span>
                                                        <span className="cliente-data-value">{c.direccion || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Footer: Acciones */}
                                                <div className="cliente-card-footer">
                                                    <button
                                                        className="cliente-btn cliente-btn-historial"
                                                        onClick={() => handleOpenModal(c)}
                                                    >
                                                        <FiEye size={14} /> Historial
                                                    </button>
                                                    <button
                                                        className="cliente-btn cliente-btn-edit"
                                                        onClick={() => handleEdit(c)}
                                                    >
                                                        <FiEdit3 size={14} /> Editar
                                                    </button>
                                                    <button
                                                        className="cliente-btn cliente-btn-delete"
                                                        onClick={() => handleDelete(c._id || c.id)}
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
        </div>
    );
}

export default Clientes;