import React, { useState, useEffect } from 'react';
import { ESTADO_OPTIONS, TIPO_EQUIPO_OPTIONS, TIPO_SERVICIO_OPTIONS, METODO_PAGO_OPTIONS } from '../constants';
import { FiTool, FiSmartphone, FiTag, FiSettings, FiFileText, FiAlertTriangle, FiDollarSign, FiCreditCard, FiSave, FiX, FiTrash2, FiPrinter } from 'react-icons/fi';

const calcularTotal = (items) => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.costo || 0), 0);
    return { subtotal, iva: 0, total: subtotal };
};

const shortId = (id, length = 8) => String(id || "").slice(-length).toUpperCase();

const ModalDetalles = ({ isOpen, onClose, servicio, clientes, onSave, onDelete, onPrint }) => {
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        if (servicio) {
            const clonedData = JSON.parse(JSON.stringify(servicio));

            if (clonedData.cliente && typeof clonedData.cliente === 'object') {
                clonedData.clienteId = clonedData.cliente._id || clonedData.cliente.id;
            } else if (clonedData.cliente) {
                clonedData.clienteId = clonedData.cliente;
            }

            if (!clonedData.presupuesto) {
                clonedData.presupuesto = { items: [], subtotal: 0, iva: 0, total: 0 };
            }

            clonedData.presupuesto.items = (clonedData.presupuesto.items || []).map(item => ({
                ...item,
                costo: Number(item.costo) === 0 ? "" : item.costo
            }));

            clonedData.presupuesto.subtotal = Number(clonedData.presupuesto.subtotal || 0);
            clonedData.presupuesto.iva = Number(clonedData.presupuesto.iva || 0);
            clonedData.presupuesto.total = Number(clonedData.presupuesto.total || 0);

            setEditData(clonedData);
        }
    }, [servicio]);

    if (!isOpen || !editData) return null;

    const handleServiceChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handlePresupuestoChange = (index, e) => {
        const { name, value } = e.target;
        const newValue = name === "costo" && value !== "" ? Number(value) : value;

        const newItems = editData.presupuesto.items.map((item, i) =>
            i === index ? { ...item, [name]: newValue } : item
        );
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
    };

    const addPresupuestoItem = () => {
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

        dataToSave.presupuesto.items = dataToSave.presupuesto.items.map(item => ({
            ...item,
            costo: Number(item.costo) || 0
        }));

        if (dataToSave.clienteId) {
            dataToSave.cliente = dataToSave.clienteId;
        }

        delete dataToSave.clienteId;
        delete dataToSave.cliente_nombre;
        delete dataToSave.cliente_celular;
        delete dataToSave.cliente_correo;
        delete dataToSave.cliente_dni;

        onSave(servicio._id || servicio.id, dataToSave);
    };

    const clienteNombre = editData.cliente_nombre
        || editData.cliente?.nombreCompleto
        || 'Cliente';

    const equipo = [editData.marcaProducto, editData.modeloProducto].filter(Boolean).join(' ') || 'Sin equipo';

    return (
        <div className="md-backdrop">
            <div className="md-modal" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="md-header">
                    <div className="md-header-left">
                        <div className="md-header-icon">
                            <FiTool size={20} />
                        </div>
                        <div>
                            <h3 className="md-title">Editar Servicio</h3>
                            <span className="md-subtitle">
                                #{editData.servicioNumero || 'N/A'} — {clienteNombre}
                            </span>
                        </div>
                    </div>
                    <button className="md-close-btn" onClick={onClose} aria-label="Cerrar">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Info bar */}
                <div className="md-info-bar">
                    <div className="md-info-item">
                        <FiSmartphone size={14} />
                        <span>{equipo}</span>
                    </div>
                    <div className={`md-info-badge md-badge-${editData.estado || 'pendiente'}`}>
                        {ESTADO_OPTIONS.find(o => o.value === editData.estado)?.label || editData.estado}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="md-form">

                    {/* Seccion: Datos del Servicio */}
                    <div className="md-section">
                        <div className="md-section-header">
                            <span className="md-section-icon md-icon-service"><FiTool size={16} /></span>
                            <h4>Datos del Servicio</h4>
                        </div>

                        <div className="md-grid-2">
                            <div className="md-field">
                                <label className="md-label">
                                    <FiTool size={12} /> Tipo de Servicio
                                </label>
                                <select name="tipoServicio" className="md-select" value={editData.tipoServicio || ''} onChange={handleServiceChange}>
                                    {TIPO_SERVICIO_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md-field">
                                <label className="md-label">
                                    <FiSmartphone size={12} /> Tipo de Equipo
                                </label>
                                <select name="tipoEquipo" className="md-select" value={editData.tipoEquipo || ''} onChange={handleServiceChange}>
                                    {TIPO_EQUIPO_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="md-grid-2">
                            <div className="md-field">
                                <label className="md-label">
                                    <FiTag size={12} /> Marca
                                </label>
                                <input
                                    type="text"
                                    name="marcaProducto"
                                    className="md-input"
                                    value={editData.marcaProducto || ''}
                                    onChange={handleServiceChange}
                                    placeholder="Marca del producto"
                                />
                            </div>

                            <div className="md-field">
                                <label className="md-label">
                                    <FiSettings size={12} /> Modelo
                                </label>
                                <input
                                    type="text"
                                    name="modeloProducto"
                                    className="md-input"
                                    value={editData.modeloProducto || ''}
                                    onChange={handleServiceChange}
                                    placeholder="Modelo del producto"
                                />
                            </div>
                        </div>

                        <div className="md-field">
                            <label className="md-label">
                                <FiAlertTriangle size={12} /> Falla Reportada
                            </label>
                            <textarea
                                name="fallaReportada"
                                className="md-textarea"
                                rows="2"
                                value={editData.fallaReportada || ''}
                                onChange={handleServiceChange}
                                placeholder="Describe la falla..."
                            />
                        </div>

                        <div className="md-field">
                            <label className="md-label">
                                <FiFileText size={12} /> Asunto / Detalle
                            </label>
                            <textarea
                                name="detalles"
                                className="md-textarea"
                                rows="2"
                                value={editData.detalles || ''}
                                onChange={handleServiceChange}
                                placeholder="Detalle del servicio..."
                            />
                        </div>

                        <div className="md-field">
                            <label className="md-label">
                                <FiFileText size={12} /> Notas Adicionales
                            </label>
                            <textarea
                                name="notasAdicionales"
                                className="md-textarea"
                                rows="2"
                                value={editData.notasAdicionales || ''}
                                onChange={handleServiceChange}
                                placeholder="Notas internas..."
                            />
                        </div>
                    </div>

                    {/* Seccion: Costos y Pago */}
                    <div className="md-section">
                        <div className="md-section-header">
                            <span className="md-section-icon md-icon-payment"><FiDollarSign size={16} /></span>
                            <h4>Costos y Pago</h4>
                        </div>

                        <div className="md-grid-2">
                            <div className="md-field">
                                <label className="md-label">
                                    <FiDollarSign size={12} /> Anticipo / Seña
                                </label>
                                <div className="md-input-prefix">
                                    <span className="md-prefix">$</span>
                                    <input
                                        type="number"
                                        name="anticipo"
                                        className="md-input md-input-money"
                                        value={editData.anticipo || ''}
                                        onChange={handleServiceChange}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="md-field">
                                <label className="md-label">
                                    <FiCreditCard size={12} /> Método de Pago
                                </label>
                                <select name="metodoPago" className="md-select" value={editData.metodoPago || ''} onChange={handleServiceChange}>
                                    <option value="">Seleccionar...</option>
                                    {METODO_PAGO_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Presupuesto Items */}
                        <div className="md-presupuesto">
                            <div className="md-presupuesto-header">
                                <span>Presupuesto</span>
                                <button type="button" className="md-add-item-btn" onClick={addPresupuestoItem}>
                                    + Agregar ítem
                                </button>
                            </div>

                            {editData.presupuesto?.items?.map((item, i) => (
                                <div key={i} className="md-presupuesto-row">
                                    <input
                                        type="text"
                                        name="descripcion"
                                        className="md-input md-presupuesto-desc"
                                        placeholder="Descripción del ítem"
                                        value={item.descripcion}
                                        onChange={(e) => handlePresupuestoChange(i, e)}
                                    />
                                    <div className="md-input-prefix md-presupuesto-costo">
                                        <span className="md-prefix">$</span>
                                        <input
                                            type="number"
                                            name="costo"
                                            className="md-input md-input-money"
                                            placeholder="0.00"
                                            value={item.costo}
                                            onChange={(e) => handlePresupuestoChange(i, e)}
                                        />
                                    </div>
                                    <button type="button" className="md-remove-item-btn" onClick={() => removePresupuestoItem(i)}>
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}

                            <div className="md-presupuesto-resumen">
                                <div className="md-resumen-row">
                                    <span>Subtotal:</span>
                                    <strong>${Number(editData.presupuesto?.subtotal || 0).toFixed(2)}</strong>
                                </div>
                                <div className="md-resumen-row md-resumen-total">
                                    <span>Total:</span>
                                    <strong>${Number(editData.presupuesto?.total || 0).toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="md-actions">
                        <div className="md-actions-left"></div>
                        <div className="md-actions-right">
                            <button type="button" className="md-btn md-btn-cancel" onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit" className="md-btn md-btn-save">
                                <FiSave size={14} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalDetalles;
