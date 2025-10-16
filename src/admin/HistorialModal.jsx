import React from 'react';
// Asume que los estilos se cargan via HistorialAdmin.jsx

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
        { value: "revisionTerminada", label: "En Reparacion" },
        { value: "terminado", label: "Listo para Entrega" },
        { value: "entregado", label: "Entregado" },
    ];
    return ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
};

// Función para formatear el valor a moneda
const formatCurrency = (value) => {
    return new Intl.NumberFormat(LOCALE, { 
        style: 'currency', 
        currency: 'ARS', // Asumo Pesos Argentinos o ajusta la moneda
        minimumFractionDigits: 2 
    }).format(value);
};


const ServiciosModal = ({ isOpen, onClose, cliente, servicios }) => {
    if (!isOpen || !cliente || servicios.length === 0) return null;

    // Si solo hay un servicio, ajusta el título
    const isSingleService = servicios.length === 1;

    // Función auxiliar para renderizar el detalle de cada servicio
    const renderServicioDetalle = (s) => {
        
        // Función para formatear la fecha a 'DD/MM/YYYY a las HH:MM'
        const formatDateTime = (isoString) => {
            if (!isoString) return 'N/A';
            
            // Usamos la fecha original para obtener la hora precisa
            const date = new Date(isoString); 
            // Para la fecha (y evitar el rollback), usamos el truco del mediodía
            const dateOnly = new Date(isoString.split('T')[0] + 'T12:00:00'); 

            const fecha = dateOnly.toLocaleDateString(LOCALE);
            const hora = date.toLocaleTimeString(LOCALE, TIME_OPTIONS);

            return `${fecha} a las ${hora}`;
        };
        
        return (
            <div key={s.id} className="servicio-item-modal">
                <h4 className="servicio-titulo-modal">Servicio ID: {s.id} ({s.tipoServicio || 'N/A'})</h4>
                
                <p>
                    <strong>Estado:</strong> 
                    <span className={`estado-badge estado-${s.estado}`}>
                        {getEstadoLabel(s.estado)}
                    </span>
                </p>
                
                {/* CAMBIO: Uso de la función formatDateTime */}
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
                
                {/* CAMBIO: Sección de Detalles más estructurada */}
                <div className="detalle-seccion">
                    <h4>Detalles del Servicio</h4>
                    <p className="detalle-contenido">{s.detalles || 'Sin descripción de detalles o falla.'}</p>
                </div>

                {/* CAMBIO: Sección Detalle de Presupuesto con formato de moneda */}
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
                    {isSingleService ? `Detalle de Servicio #${servicios[0].id}` : `Historial Completo de ${cliente.nombreCompleto}`}
                </h3>
                
                <div className="modal-body">
                    {!isSingleService && (
                        <p className="info-resumen-modal">
                            Se encontraron "{servicios.length}" servicio(s) asociados a este cliente.
                        </p>
                    )}
                    <div className="servicios-lista-modal">
                        {servicios.map(renderServicioDetalle)}
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default ServiciosModal;