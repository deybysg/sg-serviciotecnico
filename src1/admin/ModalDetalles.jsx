import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
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

// Formatea el número de orden a 3 dígitos (ej. 1 -> 001). Si no existe, muestra un shortId del _id
const formatOrden = (numero, fallbackId) => {
    if (numero === undefined || numero === null || numero === "") {
        return `ID: ${shortId(fallbackId)}`;
    }
    return `#${String(numero).padStart(3, '0')}`;
};

const ModalDetalles = ({ isOpen, onClose, servicio, clientes, onSave, onDelete, onPrint }) => {
    const [editData, setEditData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const originalRef = useRef(null);
    const firstFieldRef = useRef(null);

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

            // Asegurar presupuesto y items
            clonedData.presupuesto = clonedData.presupuesto || { items: [], subtotal: 0, iva: 0, total: 0, senia: 0 };
            clonedData.presupuesto.items = Array.isArray(clonedData.presupuesto.items) ? clonedData.presupuesto.items : [];
            // Convertir 0 a "" para que el input se vea vacío
            clonedData.presupuesto.items = clonedData.presupuesto.items.map(item => ({
                ...item,
                costo: item && item.costo === 0 ? "" : (item ? item.costo : "")
            }));

            // Inicializar campos nuevos para "sin solución", detalle para el cliente y seguimiento
            clonedData.sinSolucion = !!clonedData.sinSolucion;
            clonedData.detalleCliente = clonedData.detalleCliente || "";
            clonedData.seguimiento = Array.isArray(clonedData.seguimiento) ? clonedData.seguimiento : [];
            clonedData.modeloProducto = clonedData.modeloProducto || '';
            clonedData.fechaSalida = clonedData.fechaSalida || null;
            
            setEditData(clonedData);
            // guardar copia original para posible cancel
            originalRef.current = JSON.parse(JSON.stringify(clonedData));
            setIsEditing(false);
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

    // Nota: la acción de "sin solución" se maneja desde las tarjetas; quitar handler del modal para evitar duplicación.

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

    const handleStartEdit = () => {
        setIsEditing(true);
        // focus the first editable field shortly after entering edit mode
        setTimeout(() => {
            firstFieldRef.current && firstFieldRef.current.focus && firstFieldRef.current.focus();
        }, 0);
    };

    const handleCancelEdit = () => {
        if (originalRef.current) setEditData(JSON.parse(JSON.stringify(originalRef.current)));
        setIsEditing(false);
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

        // Mantener los nuevos campos para backend si existen
        if (typeof editData.sinSolucion !== 'undefined') dataToSave.sinSolucion = editData.sinSolucion;
        if (typeof editData.detalleCliente !== 'undefined') dataToSave.detalleCliente = editData.detalleCliente;
        
        onSave(servicio._id || servicio.id, dataToSave); 
    };

    const clienteActual = clientes.find(c => String(c._id || c.id) === String(editData.clienteId)) || {};
    
    // Formatear las fechas para el input[type=date]
    const formatToDateInput = (dateString) => {
        return dateString ? dateString.split('T')[0] : '';
    };

    const getTipoLabel = (value) => TIPO_SERVICIO_OPTIONS.find(o => o.value === value)?.label || value;

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
                <h3>{isEditing ? 'Editar Servicio' : 'Detalles del Servicio'} {formatOrden(editData.servicioNumero, editData._id || editData.id)}</h3>

                {/* Nota: el botón 'sin solución' fue movido a las tarjetas; conservar solo la visualización editable en el formulario si existe. */}

                <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
                    {/* Mostrar solo los campos que se usan en el registro del servicio */}
                    <fieldset>
                        <legend>Datos del Cliente</legend>
                        {clienteActual ? (
                            <div className="cliente-detalle-grid">
                                <div className="fila"><strong>Nombre:</strong> <span>{clienteActual.nombreCompleto || 'N/A'}</span></div>
                                <div className="fila"><strong>Celular:</strong> <span>{clienteActual.celular || clienteActual.telefono || 'N/A'}</span></div>
                                <div className="fila"><strong>Correo:</strong> <span>{clienteActual.correo || clienteActual.email || 'N/A'}</span></div>
                                <div className="fila"><strong>Dirección:</strong> <span>{clienteActual.direccion || clienteActual.address || 'N/A'}</span></div>
                            </div>
                        ) : (
                            <p>N/A</p>
                        )}
                    </fieldset>
                    <fieldset>
                        <legend>Datos del Servicio (registro)</legend>
                        <div className="producto-detalle-grid">
                            <div className="fila"><strong>Número / ID:</strong> <span>{editData.servicioNumero ? `#${String(editData.servicioNumero).padStart(3,'0')}` : (editData._id || editData.id ? `ID: ${shortId(editData._id || editData.id)}` : 'N/A')}</span></div>
                            <div className="fila"><strong>Tipo:</strong> <span>{!isEditing ? (getTipoLabel(editData.tipoServicio) || 'N/A') : (
                                <select name="tipoServicio" value={editData.tipoServicio || ''} onChange={handleGeneralChange}>
                                    <option value="">Seleccione...</option>
                                    {TIPO_SERVICIO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            )}</span></div>
                            <div className="fila"><strong>Marca:</strong> <span>{!isEditing ? (editData.marcaProducto || 'N/A') : (
                                <input ref={firstFieldRef} name="marcaProducto" value={editData.marcaProducto || ''} onChange={handleGeneralChange} />
                            )}</span></div>
                            <div className="fila"><strong>Modelo:</strong> <span>{!isEditing ? (editData.modeloProducto || 'N/A') : (
                                <input name="modeloProducto" value={editData.modeloProducto || ''} onChange={handleGeneralChange} />
                            )}</span></div>
                            <div className="fila"><strong>Detalles / Falla:</strong> <span>{!isEditing ? (editData.detalles || 'N/A') : (
                                <textarea name="detalles" value={editData.detalles || ''} onChange={handleGeneralChange} />
                            )}</span></div>
                            <div className="fila"><strong>Estado:</strong> <span>{!isEditing ? (ESTADO_OPTIONS.find(o => o.value === editData.estado)?.label || editData.estado || 'N/A') : (
                                <select name="estado" value={editData.estado || ''} onChange={handleGeneralChange}>
                                    <option value="">Seleccione...</option>
                                    {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            )}</span></div>
                            <div className="fila"><strong>Fecha de Salida:</strong> <span>{!isEditing ? (editData.fechaSalida ? new Date(editData.fechaSalida).toLocaleDateString() : 'N/A') : (
                                <input type="date" name="fechaSalida" value={formatToDateInput(editData.fechaSalida)} onChange={handleGeneralChange} />
                            )}</span></div>
                            {/* SinSolucion y detalleCliente ocultos en la vista 'Ver más' por requerimiento del usuario */}
                            <div className="fila"><strong>Fecha de Entrada:</strong> <span>{!isEditing ? (formatToDateInput(editData.fechaEntrada) || 'N/A') : (
                                <input type="date" name="fechaEntrada" value={formatToDateInput(editData.fechaEntrada)} onChange={handleGeneralChange} />
                            )}</span></div>
                            <div className="fila"><strong>Presupuesto - Ítems:</strong>
                                <div style={{marginTop:6}}>
                                    {editData.presupuesto?.items?.length > 0 ? (
                                        editData.presupuesto.items.map((it, idx) => (
                                            <div key={idx} style={{display:'flex', alignItems:'center', gap: 8, marginBottom:6}}>
                                                {!isEditing ? (
                                                    <>
                                                        <span style={{flex:1}}>{it.descripcion || 'Item'}</span>
                                                        <span>${(Number(it.costo) || 0).toFixed(2)}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <input style={{flex:1}} name="descripcion" value={it.descripcion || ''} onChange={(e) => {
                                                            const val = e.target.value;
                                                            const newItems = editData.presupuesto.items.map((it2, i2) => i2 === idx ? { ...it2, descripcion: val } : it2);
                                                            const { subtotal, iva, total } = calcularTotal(newItems);
                                                            setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
                                                        }} />
                                                        <input style={{width:120}} name="costo" value={it.costo === 0 ? '0' : (it.costo === undefined ? '' : String(it.costo))} onChange={(e) => handlePresupuestoChange(idx, e)} />
                                                        <button type="button" onClick={() => removePresupuestoItem(idx)}>Eliminar</button>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    ) : (<div>No hay ítems.</div>)}
                                    {isEditing && <div style={{marginTop:8}}><button type="button" onClick={addPresupuestoItem}>+ Agregar ítem</button></div>}
                                </div>
                            </div>
                            <div className="fila"><strong>Seña:</strong> <span>{!isEditing ? (`$${editData.presupuesto?.senia?.toFixed ? editData.presupuesto.senia.toFixed(2) : (Number(editData.presupuesto?.senia) || 0).toFixed(2)}`) : (
                                <input name="senia" value={editData.presupuesto?.senia || ''} onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    setEditData(prev => ({ ...prev, presupuesto: { ...prev.presupuesto, senia: val } }));
                                }} />
                            )}</span></div>
                            <div className="fila"><strong>Total:</strong> <span>${editData.presupuesto?.total?.toFixed(2) || '0.00'}</span></div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Seguimiento</legend>
                        {editData.seguimiento && editData.seguimiento.length > 0 ? (
                            <div style={{display:'flex', flexDirection:'column', gap:8}}>
                                {editData.seguimiento.map((s, i) => (
                                    <div key={i} style={{border: '1px solid #eee', padding:8, borderRadius:6}}>
                                        <div style={{fontSize:12, color:'#444'}}><strong>{s.tipo || 'Nota'}</strong> — {s.autor || 'taller'}</div>
                                        <div style={{fontSize:12, color:'#666'}}>{s.fecha ? new Date(s.fecha).toLocaleString() : 'Sin fecha'}</div>
                                        <div style={{marginTop:6}}>{s.mensaje}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>No hay entradas de seguimiento.</div>
                        )}
                    </fieldset>

                    <div className="modal-actions">
                        {!isEditing ? (
                            <>
                                <button type="button" onClick={handleStartEdit} className="btn-editar">✏️ Editar</button>
                                <button type="button" onClick={() => {
                                    const clienteNombre = clienteActual?.nombreCompleto || clienteActual?.label || (editData.cliente && editData.cliente.nombreCompleto) || editData.clienteId || '';
                                    const serviceForPrint = { ...(servicio || {}), ...editData, clienteNombre };
                                    if (onPrint) onPrint(serviceForPrint);
                                }} className="btn-imprimir">📄 Imprimir</button>
                                <button type="button" onClick={() => {
                                    // Delegar la confirmación y eliminación al handler del padre (ServiciosAdmin)
                                    // Para evitar que se muestre dos veces el diálogo y para centralizar la eliminación.
                                    onDelete && onDelete(servicio._id || servicio.id);
                                }} className="btn-eliminar">🗑️ Eliminar</button>
                                <button type="button" onClick={onClose} className="btn-cancelar">Cerrar</button>
                            </>
                                ) : (
                                    <>
                                        <button type="button" onClick={handleSubmit} className="btn-guardar">💾 Guardar Cambios</button>
                                        <button type="button" onClick={handleCancelEdit} className="btn-cancelar">Cancelar</button>
                                    </>
                                )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalDetalles;