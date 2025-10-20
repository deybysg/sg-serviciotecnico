// src/pages/MisComprasModal.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { FaBoxes, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
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

    // ID único para evitar conflictos de estilo con otros modales
    const modalId = "user-history-modal-unique"; 

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchCompras = async () => {
            try {
                // 🚨 Llama a tu endpoint de JSON Server para obtener las ventas
                // Y filtra solo las que coinciden con el ID del usuario actual.
                const response = await fetch(`http://localhost:3001/ventas?usuarioId=${user.id}&_sort=fechaCompra&_order=desc`); 

                if (!response.ok) {
                    throw new Error('No se pudo cargar el historial de compras.');
                }

                const data = await response.json();
                setCompras(data);
            } catch (error) {
                console.error("Error cargando compras:", error);
                Swal.fire('Error', 'Hubo un problema al cargar tu historial de compras.', 'error');
                setCompras([]);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchCompras();
    }, [isOpen, user]);

    if (!isOpen) {
        return null;
    }

    // Función para formatear la fecha
    const formatFecha = (isoString) => {
        return new Date(isoString).toLocaleDateString('es-AR', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        // Usamos el ID único aquí
        <div id={modalId} className="compras-modal-overlay" onClick={onClose}>
            <div 
                className="compras-modal-content" 
                onClick={e => e.stopPropagation()} 
                role="dialog"
                aria-modal="true"
                aria-labelledby="compras-title"
            >
                <button className="compras-close-btn" onClick={onClose} aria-label="Cerrar historial">&times;</button>
                
                <h2 id="compras-title" className="compras-title">
                    Historial de Compras de {user?.username || 'Usuario'}
                </h2>

                {loading ? (
                    <p>Cargando historial...</p> // Podrías poner un spinner aquí
                ) : compras.length === 0 ? (
                    <p className="compras-empty-message">Aún no tienes compras registradas.</p>
                ) : (
                    <div className="compras-list">
                        {compras.map((compra, index) => (
                            <div key={compra.id || index} className="compra-item">
                                <div className="compra-header">
                                    <h4 className="compra-id">ID de Compra: **{compra.id}**</h4>
                                    <span className={`compra-estado estado-${compra.estado.toLowerCase().replace(' ', '-')}`}>
                                        {compra.estado}
                                    </span>
                                </div>
                                <div className="compra-details">
                                    <p><FaCalendarAlt /> **Fecha:** {formatFecha(compra.fechaCompra)}</p>
                                    <p><FaDollarSign /> **Total:** ${compra.totalVenta.toFixed(2)}</p>
                                </div>
                                <div className="compra-productos">
                                    <h5><FaBoxes /> Productos:</h5>
                                    <ul>
                                        {compra.productosComprados.map((item, i) => (
                                            <li key={i}>
                                                {item.cantidad}x {item.nombre} (${(item.precioUnitario * item.cantidad).toFixed(2)})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MisComprasModal;