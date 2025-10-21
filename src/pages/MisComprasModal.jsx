// src/pages/MisComprasModal.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { FaBoxes, FaCalendarAlt, FaDollarSign, FaFilePdf, FaReceipt, FaMapMarkerAlt } from 'react-icons/fa';
import './MisComprasModal.css';

// 🚨 Asegúrate de añadir el CSS único para este modal en tu archivo de estilos global o uno específico.
// .compras-modal-overlay, .compras-modal-content, .compras-close-btn, etc.

/**
 * Componente Modal para mostrar el Historial de Compras del usuario logueado.
 */
function MisComprasModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const modalId = "user-history-modal-unique";
    
    // Detectar si el componente se usa como página (ruta) o como modal
    const isPageMode = typeof isOpen === 'undefined';
    const open = isPageMode ? true : !!isOpen;
    const [modalOpen, setModalOpen] = useState(false);
    const [expandedMap, setExpandedMap] = useState({});

    // Helper to render the historial list (used both in modal-mode and page-mode overlay)
    const renderListContent = () => {
        if (loading) return <p>Cargando historial...</p>;
        if (error) return <p className="compras-error-message">{error}</p>;
        if (!compras || compras.length === 0) return <p className="compras-empty-message">Aún no tienes compras registradas.</p>;

        return (
            <div className="compras-list">
                {compras.map((compra, index) => (
                    <div key={compra.id || index} className="compra-item">
                        <div className="compra-header">
                            <div className="compra-id-wrap">
                                <h4 className="compra-id">Venta {makeDisplayId(compra, index)}</h4>
                                <span className="compra-small-id">#{(index + 1).toString().padStart(3, '0')}</span>
                            </div>
                            <div className="compra-estado-wrap">
                                <span className={`compra-estado estado-${(compra.estado || '').toLowerCase().replace(' ', '-')}`}>
                                    {compra.estado || '—'}
                                </span>
                            </div>
                        </div>

                        <div className="compra-details grid">
                            <div className="compra-meta">
                                <p><FaCalendarAlt /> <strong>Fecha:</strong> {formatFecha(compra.fechaCompra)}</p>
                                <p><FaFilePdf /> <strong>Método:</strong> {compra.metodoPago || '—'}</p>
                            </div>
                            <div className="compra-total">
                                <p><FaDollarSign /> <strong>Total:</strong> {formatCurrency(compra.totalVenta)}</p>
                            </div>
                        </div>

                        <div className="compra-productos">
                            <div className="compra-productos-header">
                                <h5><FaBoxes /> Productos:</h5>
                            </div>
                            <table className="productos-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cant.</th>
                                        <th>Precio</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(compra.productosComprados || []).map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.nombre}</td>
                                            <td>{item.cantidad || 0}</td>
                                            <td>{formatCurrency(item.precioUnitario || 0)}</td>
                                            <td>{formatCurrency((item.precioUnitario || 0) * (item.cantidad || 0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="compra-actions">
                                <button
                                    className="btn-comprobante"
                                    onClick={() => window.open(`${window.location.origin}/comprobante/${compra.id}`, '_blank')}
                                >
                                    <FaReceipt /> Ver comprobante
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    useEffect(() => {
        if (!user) return;

        const fetchCompras = async () => {
            try {
                setLoading(true);
                setError(null);
                // Usar username porque en db.json las ventas tienen campo `username`
                const response = await fetch(`http://localhost:3001/ventas?username=${encodeURIComponent(user.username)}&_sort=fechaCompra&_order=desc`);

                if (!response.ok) {
                    throw new Error('No se pudo cargar el historial de compras.');
                }
                
                const data = await response.json();
                setCompras(data);
            } catch (err) {
                console.error("Error cargando compras:", err);
                setError('Hubo un problema al cargar tu historial de compras.');
                setCompras([]);
                Swal.fire('Error', 'Hubo un problema al cargar tu historial de compras.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCompras();
    }, [user]);

    // Formatear fecha con seguridad
    const formatFecha = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleDateString('es-AR', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Generar un ID corto y legible (solo visual) de 3-5 caracteres alfanuméricos
    const makeDisplayId = (compra, idx) => {
        if (!compra) return `V-${String(idx + 1).padStart(3, '0')}`;
        // Si existe compra.id, extraer los últimos caracteres alfanuméricos
        if (compra.id) {
            const alnum = compra.id.replace(/[^a-z0-9]/gi, '');
            if (alnum.length >= 5) return alnum.slice(-5).toUpperCase();
            if (alnum.length >= 3) return alnum.toUpperCase();
        }
        // Fallback: usar base36 de la fecha + índice
        try {
            const t = new Date(compra.fechaCompra || Date.now()).getTime();
            return (t.toString(36).slice(-4) + (idx + 1)).toUpperCase();
        } catch (e) {
            return `V${idx + 1}`;
        }
    };

    const formatCurrency = (value) => {
        if (value == null) value = 0;
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    // Si estamos en modo modal y no está abierto, no renderizamos
    if (!open) return null;

    // Render minimal page mode vs modal overlay
    const wrapperProps = isPageMode
        ? { className: 'compras-page-container' }
        : { id: modalId, className: 'compras-modal-overlay', onClick: onClose };

    return (
        <div {...wrapperProps}>
            <div
                className="compras-modal-content"
                onClick={e => e.stopPropagation()}
                role={isPageMode ? 'region' : 'dialog'}
                aria-modal={!isPageMode}
                aria-labelledby="compras-title"
            >
                {!isPageMode && (
                    <button className="compras-close-btn" onClick={onClose} aria-label="Cerrar historial">&times;</button>
                )}

                {/* Página: mostrar resumen y botón para abrir modal de historial */}
                {isPageMode && (
                    <div className="miscompras-page-header">
                        <h2 id="compras-title" className="compras-title">Historial de Compras de {user?.username || 'Usuario'}</h2>
                        <p className="miscompras-intro">Aquí tienes un resumen de tus compras. Pulsa el botón para ver el historial completo.</p>
                        <div className="miscompras-summary">
                            <span className="summary-item">Compras: <strong>{compras.length}</strong>, </span>
                            <span className="summary-item">Gasto total: <strong>{formatCurrency(compras.reduce((s, c) => s + (c.totalVenta || 0), 0))}</strong></span>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <button className="btn-open-historial" onClick={() => setModalOpen(true)}>Ver historial</button>
                        </div>
                    </div>
                )}

                {/* Si estamos en modo página y modalOpen=true, renderizamos el overlay con la lista */}
                {isPageMode && modalOpen && (
                    <div className="compras-modal-overlay" onClick={() => setModalOpen(false)}>
                        <div className="compras-modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal={true} aria-labelledby="compras-title">
                            <button className="compras-close-btn" onClick={() => setModalOpen(false)} aria-label="Cerrar historial">&times;</button>
                            {renderListContent()}
                        </div>
                    </div>
                )}

                {/* Si no es page mode (por ejemplo llamado como modal), mostrar lista directamente */}
                {!isPageMode && renderListContent()}
            </div>
        </div>
    );
}

export default MisComprasModal;