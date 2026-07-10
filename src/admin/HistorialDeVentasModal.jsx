import React from 'react';
import '../styles/admin/HistorialDeVentas.css';
import { shortId, toIdString } from "../utils/id";
import { FiX, FiHash, FiUser, FiCalendar, FiCreditCard, FiCheckCircle, FiPackage, FiDollarSign, FiSettings, FiArrowUp } from "react-icons/fi";

const LOCALE = 'es-AR';
const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', hour12: false };

const formatCurrency = (amount) => {
    return new Intl.NumberFormat(LOCALE, { 
        style: 'currency', 
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    return `${d.toLocaleDateString(LOCALE)} ${d.toLocaleTimeString(LOCALE, TIME_OPTIONS)}`;
};

const safeParseJSON = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
};

const VentasModal = ({ isOpen, onClose, venta, ventasDeUsuario, producto, ajuste }) => {
    if (!isOpen) return null;

    // Modal de Producto
    if (producto) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="modal-close-btn-ventas" onClick={onClose}><FiX size={20} /></button>
                    <h3 className="modal-title"><FiPackage size={18} /> Detalles del Producto</h3>
                    
                    <div className="venta-detalle-card">
                        <h4 className="venta-card-id"><FiHash size={14} /> {producto.codigo}</h4>
                        <p><FiPackage size={12} style={{ marginRight: 6 }} /> <strong>Nombre:</strong> {producto.nombre}</p>
                        <p><FiCalendar size={12} style={{ marginRight: 6 }} /> <strong>Fecha de Ingreso:</strong> {formatDate(producto.created_at || producto.createdAt)}</p>
                        <p><FiDollarSign size={12} style={{ marginRight: 6 }} /> <strong>Precio:</strong> {formatCurrency(producto.precio)}</p>
                        <p><FiCheckCircle size={12} style={{ marginRight: 6 }} /> <strong>Stock:</strong> {producto.stock} unidades</p>
                        <p><FiPackage size={12} style={{ marginRight: 6 }} /> <strong>Categoría:</strong> {producto.categoria}</p>
                        {producto.descripcion && (
                            <p><strong>Descripción:</strong> {producto.descripcion}</p>
                        )}
                    </div>
                    
                    <button className="modal-action-btn" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        );
    }

    // Modal de Ajuste
    if (ajuste) {
        const cambios = safeParseJSON(ajuste.cambios);
        const tipoLabel = {
            'modificacion': 'Modificación',
            'ajuste_stock': 'Ajuste de Stock',
            'ajuste_precio': 'Ajuste de Precio',
            'creacion': 'Creación'
        }[ajuste.tipo] || ajuste.tipo;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="modal-close-btn-ventas" onClick={onClose}><FiX size={20} /></button>
                    <h3 className="modal-title"><FiSettings size={18} /> Detalles del Ajuste</h3>
                    
                    <div className="venta-detalle-card">
                        <h4 className="venta-card-id"><FiPackage size={14} /> {ajuste.producto_nombre} ({ajuste.producto_codigo})</h4>
                        <p><FiCalendar size={12} style={{ marginRight: 6 }} /> <strong>Fecha:</strong> {formatDate(ajuste.created_at || ajuste.createdAt)}</p>
                        <p><FiSettings size={12} style={{ marginRight: 6 }} /> <strong>Tipo:</strong> {tipoLabel}</p>
                        <p><FiUser size={12} style={{ marginRight: 6 }} /> <strong>Usuario:</strong> {ajuste.usuario}</p>
                        
                        {ajuste.motivo && (
                            <p><strong>Motivo:</strong> {ajuste.motivo}</p>
                        )}
                        
                        <h5 style={{ marginTop: 16 }}><FiSettings size={12} style={{ marginRight: 6 }} /> Cambios Realizados:</h5>
                        {cambios.stock && (
                            <p style={{ marginLeft: 16 }}>
                                <strong>Stock:</strong> {cambios.stock.anterior} → {cambios.stock.nuevo}
                            </p>
                        )}
                        {cambios.precio && (
                            <p style={{ marginLeft: 16 }}>
                                <strong>Precio:</strong> {formatCurrency(cambios.precio.anterior)} → {formatCurrency(cambios.precio.nuevo)}
                            </p>
                        )}
                        {cambios.nombre && (
                            <p style={{ marginLeft: 16 }}>
                                <strong>Nombre:</strong> {cambios.nombre.anterior} → {cambios.nombre.nuevo}
                            </p>
                        )}
                        {cambios.categoria && (
                            <p style={{ marginLeft: 16 }}>
                                <strong>Categoría:</strong> {cambios.categoria.anterior} → {cambios.categoria.nuevo}
                            </p>
                        )}
                        {!cambios.stock && !cambios.precio && !cambios.nombre && !cambios.categoria && (
                            <p style={{ marginLeft: 16, color: '#999' }}>Sin detalles de cambios disponibles</p>
                        )}
                        
                        {ajuste.stockAnterior !== undefined && (
                            <p style={{ marginTop: 12 }}><strong>Stock Anterior:</strong> {ajuste.stockAnterior} | <strong>Stock Nuevo:</strong> {ajuste.stockNuevo}</p>
                        )}
                        {ajuste.precioAnterior !== undefined && (
                            <p><strong>Precio Anterior:</strong> {formatCurrency(ajuste.precioAnterior)} | <strong>Precio Nuevo:</strong> {formatCurrency(ajuste.precioNuevo)}</p>
                        )}
                    </div>
                    
                    <button className="modal-action-btn" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        );
    }

    // Modal de Ventas (original)
    const isSingleSale = venta !== null && ventasDeUsuario.length === 1;
    const title = isSingleSale 
        ? `Detalles de Venta #${shortId(toIdString(venta.id), 6)}` 
        : `Historial Completo de ${ventasDeUsuario[0]?.username || 'Usuario'}`;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-btn-ventas" onClick={onClose}><FiX size={20} /></button>
                <h3 className="modal-title">{title}</h3>
                
                {ventasDeUsuario.map((v, index) => {
                    const fecha = new Date(v.fechaCompra);
                    return (
                        <div key={v.id} className="venta-detalle-card">
                            <h4 className="venta-card-id"><FiHash size={14} /> Venta #{shortId(toIdString(v.id), 6)}</h4>
                            <p><FiUser size={12} style={{ marginRight: 6 }} /> <strong>Usuario:</strong> {v.username}</p>
                            <p><FiCalendar size={12} style={{ marginRight: 6 }} /> <strong>Fecha:</strong> {fecha.toLocaleDateString(LOCALE)} {fecha.toLocaleTimeString(LOCALE, TIME_OPTIONS)}</p>
                            <p><FiCreditCard size={12} style={{ marginRight: 6 }} /> <strong>Método:</strong> {v.metodoPago}</p>
                            <p><FiCheckCircle size={12} style={{ marginRight: 6 }} /> <strong>Estado:</strong> <span className={`estado-${v.estado.toLowerCase().replace(/ /g, '-')}`}>{v.estado}</span></p>
                            
                            <h5><FiPackage size={12} style={{ marginRight: 6 }} /> Productos Comprados:</h5>
                            <ul className="productos-lista">
                                {v.productosComprados.map((p) => (
                                    <li key={p.id} className="producto-item">
                                        <strong>{p.cantidad}x {p.nombre} ({formatCurrency(p.precioUnitario)} c/u) - Total: {formatCurrency(p.subtotal)}</strong>
                                    </li>
                                ))}
                            </ul>
                            <h4 className="venta-card-total"><FiDollarSign size={16} /> Total: {formatCurrency(v.totalVenta)}</h4>
                            
                            {ventasDeUsuario.length > 1 && index < ventasDeUsuario.length - 1 && <hr className="venta-separator" />}
                        </div>
                    );
                })}
                
                {ventasDeUsuario.length === 0 && <p>No se encontraron detalles de venta.</p>}
                
                <button className="modal-action-btn" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default VentasModal;