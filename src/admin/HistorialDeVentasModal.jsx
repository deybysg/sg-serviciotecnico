import React from 'react';
import './HistorialDeVentas.css'; // O un archivo CSS para tu modal

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
        ? `Detalles de Venta #${venta.id.substring(0, 8)}` 
        : `Historial Completo de ${ventasDeUsuario[0]?.username || 'Usuario'}`;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-btn-ventas" onClick={onClose}>&times;</button>
                <h3 className="modal-title">{title}</h3>
                
                {ventasDeUsuario.map((v, index) => {
                    const fecha = new Date(v.fechaCompra);
                    return (
                        <div key={v.id} className="venta-detalle-card">
                            <h4 className="venta-card-id">Venta ID: #{v.id}</h4>
                            <p><strong>Usuario:</strong> {v.username}</p>
                            <p><strong>Fecha:</strong> {fecha.toLocaleDateString(LOCALE)} {fecha.toLocaleTimeString(LOCALE, TIME_OPTIONS)}</p>
                            <p><strong>Método:</strong> {v.metodoPago}</p>
                            <p><strong>Estado:</strong> <span className={`estado-${v.estado.toLowerCase().replace(/ /g, '-')}`}>{v.estado}</span></p>
                            
                            <h5>Productos Comprados:</h5>
                            <ul className="productos-lista">
                                {v.productosComprados.map((p) => (
                                    <li key={p.id} className="producto-item">
                                    <strong>    {p.cantidad}x {p.nombre} ({formatCurrency(p.precioUnitario)} c/u) - Total: {formatCurrency(p.subtotal)}</strong>
                                    </li>
                                ))}
                            </ul>
                            <h4 className="venta-card-total">Total: {formatCurrency(v.totalVenta)}</h4>
                            
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