import { useState, useEffect } from "react";
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
        return (
            <div key={s.id} className="servicio-item-modal">
                <h4 className="servicio-titulo-modal">Servicio ID: {s.id} ({s.tipoServicio || 'N/A'})</h4>
                
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

    // Cargar clientes al inicio
    useEffect(() => {
        fetch("http://localhost:3001/clientes")
            .then((res) => res.json())
            .then((data) => setClientes(data));
    }, []);
    
    // Función para obtener detalles de los servicios
    const fetchServiciosDetalle = async (idsServicios) => {
        if (!idsServicios || idsServicios.length === 0) {
            setServiciosDetalle([]);
            return;
        }

        try {
            // TRAEMOS TODOS LOS SERVICIOS Y FILTRAMOS EN EL FRONT (para JSON Server)
            const res = await fetch("http://localhost:3001/servicios");
            const todosLosServicios = await res.json();
            
            // Filtramos los servicios que corresponden a los IDs del cliente
            const serviciosFiltrados = todosLosServicios
                .filter(servicio => idsServicios.includes(servicio.id))
                // Opcional: Ordenar por fecha de entrada más reciente primero
                .sort((a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada)); 
            
            setServiciosDetalle(serviciosFiltrados);
        } catch (error) {
            console.error("Error al cargar detalles de servicios:", error);
            setServiciosDetalle([]);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los detalles de los servicios.",
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

        let method = "POST";
        let url = "http://localhost:3001/clientes";
        let successMessage = "Cliente agregado correctamente. ";

        if (editId) {
            method = "PUT";
            url = `http://localhost:3001/clientes/${editId}`;
            successMessage = "Cliente editado correctamente. ";
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editId ? formData : {...formData, serviciosRealizados: []}),
            });

            if (!res.ok) throw new Error("Error en la operación del servidor.");

            if (editId) {
                setClientes(
                    clientes.map((c) =>
                        c.id === editId ? { ...formData, id: editId } : c
                    )
                );
                setEditId(null);
            } else {
                const newCliente = await res.json();
                setClientes([...clientes, newCliente]);
            }

            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: successMessage,
                timer: 2500,
                showConfirmButton: false,
            });

            setFormData({ nombreCompleto: "", celular: "", correo: "", direccion: "", serviciosRealizados: [] });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo realizar la operación: " + error.message,
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
                await fetch(`http://localhost:3001/clientes/${id}`, {
                    method: "DELETE",
                });
                setClientes(clientes.filter((c) => c.id !== id));

                Swal.fire({
                    icon: "success",
                    title: "Eliminado",
                    text: "Cliente eliminado correctamente.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo eliminar el cliente.",
                });
            }
        }
    };

    const handleEdit = (cliente) => {
        setFormData(cliente); 
        setEditId(cliente.id);
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
                            <div className="buscador">
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
                                    <div key={c.id} className="cliente-card">
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
                                                onClick={() => handleDelete(c.id)}
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
        </div>
    );
}

export default Clientes;