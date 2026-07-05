import React from 'react';
import '../styles/admin/HistorialDeVentas.css';
import { shortId, toIdString } from "../utils/id";
import { FiX, FiHash, FiUser, FiCalendar, FiCreditCard, FiCheckCircle, FiPackage, FiDollarSign } from "react-icons/fi";

const LOCALE = 'es-AR';
const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', hour12: false };

const formatCurrency = (amount) => {
    return new Intl.NumberFormat(LOCALE, { 
        style: 'currency', 
        currency: 'ARS', // Ajustar
        minimumFractionDigits: 0
    }).format(amount);
};

const VentasModal = ({ isOpen, onClose, venta, ventasDeUsuario }) => {
    if (!isOpen) return null;

    // Determina si estamos viendo una sola venta o el historial completo
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
                            
                            {/* Separador si hay más de una venta */}
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