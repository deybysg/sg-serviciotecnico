import React, { useState, useEffect } from 'react';
// Asumiendo que las opciones de estado vienen de un archivo de configuración o del componente padre
const ESTADO_OPTIONS = [
    { value: "pendiente", label: "Pendiente" },
    { value: "enRevision", label: "En Revisión" },
    { value: "revisionTerminada", label: "En Reparacion" },
    { value: "terminado", label: "Listo para Entrega" },
    { value: "entregado", label: "Entregado" },
];
const TIPO_SERVICIO_OPTIONS = [
    { value: "celulares", label: "Celulares" },
    { value: "computadora", label: "Computadora" },
    { value: "parlantes", label: "Parlantes" },
    { value: "otros", label: "Otros" },
];

// Función Helper para calcular el total del presupuesto
const calcularTotal = (items) => {
    // Usa Number(item.costo || 0) para manejar el string vacío "" como 0
    const subtotal = items.reduce((sum, item) => sum + Number(item.costo || 0), 0);
    return { subtotal, iva: 0, total: subtotal };
};

// Helper: ID corto para mostrar en la UI
const shortId = (id, length = 8) => String(id || "").slice(-length).toUpperCase();

const ModalDetalles = ({ isOpen, onClose, servicio, clientes, onSave }) => {
    const [editData, setEditData] = useState(null);

    // Sincronizar los datos del servicio en el estado de edición local
    useEffect(() => {
        if (servicio) {
            // Clonación profunda de los datos para no modificar el estado original
            const clonedData = JSON.parse(JSON.stringify(servicio));
            
            // Si cliente viene populado, extraer solo el ID
            if (clonedData.cliente && typeof clonedData.cliente === 'object') {
                clonedData.clienteId = clonedData.cliente._id || clonedData.cliente.id;
            } else if (clonedData.cliente) {
                clonedData.clienteId = clonedData.cliente;
            }
            
            // Convertir 0 a "" para que el input se vea vacío
            clonedData.presupuesto.items = clonedData.presupuesto.items.map(item => ({
                ...item,
                costo: item.costo === 0 ? "" : item.costo
            }));
            
            setEditData(clonedData); 
        }
    }, [servicio]);

    if (!isOpen || !editData) return null;

    // Manejo de cambios generales (marcaProducto, detalles, estado, tipoServicio)
    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        const newValue = (name === "fechaEntrada" || name === "fechaSalida") 
                         ? (value ? new Date(value).toISOString() : null)
                         : value;
        
        setEditData(prev => ({ ...prev, [name]: newValue }));
    };

    // Manejo de cambios del presupuesto
    const handlePresupuestoChange = (index, e) => {
        const { name, value } = e.target;
        // Si el costo es ingresado, lo trata como Number si no está vacío, sino mantiene el string ""
        const newValue = name === "costo" && value !== "" ? Number(value) : value; 
        
        const newItems = editData.presupuesto.items.map((item, i) =>
            i === index ? { ...item, [name]: newValue } : item
        );
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
    };

    const addPresupuestoItem = () => {
        // Inicializar el costo del nuevo ítem como string vacío ""
        const newItems = [...editData.presupuesto.items, { descripcion: "", costo: "" }];
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
    };

    const removePresupuestoItem = (index) => {
        const newItems = editData.presupuesto.items.filter((_, i) => i !== index);
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        
        const dataToSave = JSON.parse(JSON.stringify(editData));
        
        // Antes de guardar, aseguramos que los costos vacíos ("") se conviertan a 0 para el backend
        dataToSave.presupuesto.items = dataToSave.presupuesto.items.map(item => ({
             ...item,
             costo: Number(item.costo) || 0 
        }));
        
        // LÓGICA DE FECHA DE SALIDA/ENTREGA AUTOMÁTICA
        if (dataToSave.estado === 'entregado' && !dataToSave.fechaSalida) {
            dataToSave.fechaSalida = new Date().toISOString(); 
        }
        
        // Enviar cliente (el backend espera 'cliente', no 'clienteId')
        if (dataToSave.clienteId) {
            dataToSave.cliente = dataToSave.clienteId;
            delete dataToSave.clienteId;
        }
        
        onSave(servicio._id || servicio.id, dataToSave); 
    };

    const clienteActual = clientes.find(c => String(c._id || c.id) === String(editData.clienteId)) || {};
    
    // Formatear las fechas para el input[type=date]
    const formatToDateInput = (dateString) => {
        return dateString ? dateString.split('T')[0] : '';
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                <button 
                    type="button" 
                    onClick={onClose} 
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.8rem',
                        cursor: 'pointer',
                        color: '#64748b',
                        lineHeight: 1,
                        padding: '0.25rem',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#64748b';
                    }}
                    aria-label="Cerrar modal"
                >
                    &times;
                </button>
                <h3>Editar Servicio ID: {shortId(editData._id || editData.id)}</h3>
                <form onSubmit={handleSubmit} className="modal-form">
                    
                    <fieldset>
                        <legend>Datos Principales</legend>
                        <label>Cliente:</label>
                        <select name="clienteId" value={editData.clienteId} onChange={handleGeneralChange}>
                            {clientes.map(c => (
                                <option key={c._id || c.id} value={c._id || c.id}>{c.nombreCompleto}</option>
                            ))}
                        </select>
                        
                        <label>Marca del Producto:</label>
                        <input type="text" name="marcaProducto" value={editData.marcaProducto} onChange={handleGeneralChange} required />
                        
                        <label>Tipo de Equipo:</label>
                        <select name="tipoServicio" value={editData.tipoServicio} onChange={handleGeneralChange}>
                            {TIPO_SERVICIO_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                        
                        <label>Detalles:</label>
                        <textarea name="detalles" value={editData.detalles} onChange={handleGeneralChange} rows="3" />
                    </fieldset>

                    <fieldset>
                        <legend>Estado y Fechas</legend>
                        <label>Estado:</label>
                        <select name="estado" value={editData.estado} onChange={handleGeneralChange}>
                            {ESTADO_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                        
                        <label>Fecha de Entrada:</label>
                        <input 
                            type="date" 
                            name="fechaEntrada" 
                            value={formatToDateInput(editData.fechaEntrada)} 
                            onChange={handleGeneralChange} 
                            required 
                        />

                        <label>Fecha de Salida (Entregado):</label>
                        <input 
                            type="date" 
                            name="fechaSalida" 
                            value={formatToDateInput(editData.fechaSalida)} 
                            onChange={handleGeneralChange} 
                        />
                    </fieldset>
                    
                    <fieldset className="presupuesto-section">
                        <legend>Presupuesto</legend>
                        {editData.presupuesto?.items?.map((item, i) => (
                            <div key={i} className="presupuesto-item">
                                <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={(e) => handlePresupuestoChange(i, e)} />
                                <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={(e) => handlePresupuestoChange(i, e)} />
                                {/* CAMBIO AQUÍ: Se añade la clase para el estilo rojo y centrado */}
                                <button type="button" onClick={() => removePresupuestoItem(i)} className="btn-remove-item">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={addPresupuestoItem}>+ Agregar ítem</button>
                        <div className="presupuesto-resumen">
                            <p>Subtotal: ${editData.presupuesto?.subtotal?.toFixed(2) || '0.00'}</p>
                            <p>Total: ${editData.presupuesto?.total?.toFixed(2) || '0.00'}</p>
                        </div>
                    </fieldset>
                    
                    <div className="modal-actions">
                        <button type="submit" className="btn-guardar">💾 Guardar Cambios</button>
                        <button type="button" onClick={onClose} className="btn-cancelar">Cerrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalDetalles;