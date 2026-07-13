import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Swal from 'sweetalert2';
import { 
  FaBoxes, FaCalendarAlt, FaDollarSign, FaFilePdf, FaReceipt, FaClock, 
  FaCheck, FaTimes, FaShoppingBag, FaFilter, FaBan, FaRedo, FaChevronDown, 
  FaChevronUp, FaDownload, FaFileExcel, FaSpinner, FaTrash 
} from 'react-icons/fa';
import '../styles/pages/MisComprasModal.css';

function MisComprasModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [compras, setCompras] = useState([]);
    const [pagosPendientes, setPagosPendientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todas');
    const [expandedCards, setExpandedCards] = useState({});
    const [exporting, setExporting] = useState(false);

    const isPageMode = typeof isOpen === 'undefined';
    const open = isPageMode ? true : !!isOpen;

    useEffect(() => {
        if (!user) return;
        fetchCompras();
    }, [user]);

    const fetchCompras = async () => {
        try {
            setLoading(true);
            const username = user.username || user.nombreUsuario || user.email;
            if (!username) return;

            const data = await api.get(`/ventas/usuario/${encodeURIComponent(username)}`);
            setCompras(Array.isArray(data) ? data : []);

            const pagosData = await api.get('/pagos-pendientes/mis-pagos');
            // Excluir los aceptados porque ya aparecen en ventas
            const pagosFiltrados = Array.isArray(pagosData) 
                ? pagosData.filter(p => p.estado !== 'Aceptado') 
                : [];
            setPagosPendientes(pagosFiltrados);
        } catch (err) {
            console.error("Error cargando compras:", err);
            setCompras([]);
            setPagosPendientes([]);
        } finally {
            setLoading(false);
        }
    };

    const formatFecha = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleDateString('es-AR', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatCurrency = (value) => {
        if (value == null) value = 0;
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    // Combinar y ordenar
    const todosLosItems = useMemo(() => [
        ...(pagosPendientes || []).map(p => ({ ...p, tipo: p.estado === 'Pendiente' ? 'pendiente' : p.estado === 'Rechazado' ? 'rechazado' : p.estado === 'Cancelado' ? 'cancelado' : 'completado' })),
        ...(compras || []).map(c => ({ ...c, tipo: 'completado' }))
    ].sort((a, b) => new Date(b.fechaCompra || b.createdAt) - new Date(a.fechaCompra || a.createdAt)), [compras, pagosPendientes]);

    const itemsFiltrados = useMemo(() => {
        if (filtro === 'todas') return todosLosItems;
        if (filtro === 'pendientes') return todosLosItems.filter(i => i.tipo === 'pendiente');
        if (filtro === 'completadas') return todosLosItems.filter(i => i.tipo === 'completado');
        if (filtro === 'rechazados') return todosLosItems.filter(i => i.tipo === 'rechazado');
        if (filtro === 'cancelados') return todosLosItems.filter(i => i.tipo === 'cancelado');
        return todosLosItems;
    }, [todosLosItems, filtro]);

    // Stats
    const stats = useMemo(() => {
        const totalCompras = todosLosItems.length;
        const totalPendientes = todosLosItems.filter(i => i.tipo === 'pendiente').length;
        const totalCompletadas = todosLosItems.filter(i => i.tipo === 'completado').length;
        const totalRechazados = todosLosItems.filter(i => i.tipo === 'rechazado').length;
        const gastoTotal = todosLosItems.filter(i => i.tipo === 'completado').reduce((s, c) => s + (c.totalVenta || 0), 0);
        
        const now = new Date();
        const mesActual = now.getMonth();
        const anioActual = now.getFullYear();
        const gastoMes = todosLosItems.filter(i => {
            if (i.tipo !== 'completado') return false;
            const f = new Date(i.fechaCompra || i.createdAt);
            return f.getMonth() === mesActual && f.getFullYear() === anioActual;
        }).reduce((s, c) => s + (c.totalVenta || 0), 0);
        
        const gastoAnio = todosLosItems.filter(i => {
            if (i.tipo !== 'completado') return false;
            const f = new Date(i.fechaCompra || i.createdAt);
            return f.getFullYear() === anioActual;
        }).reduce((s, c) => s + (c.totalVenta || 0), 0);

        return { totalCompras, totalPendientes, totalCompletadas, totalRechazados, gastoTotal, gastoMes, gastoAnio };
    }, [todosLosItems]);

    // Expiración (7 días para pagos pendientes)
    const getDiasRestantes = (fecha) => {
        const created = new Date(fecha);
        const expira = new Date(created);
        expira.setDate(expira.getDate() + 7);
        const ahora = new Date();
        const diff = Math.ceil((expira - ahora) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // Cancelar pago
    const handleCancelar = async (id) => {
        const result = await Swal.fire({
            title: '¿Cancelar pago?',
            text: 'Esta acción no se puede deshacer. El pago será cancelado permanentemente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            background: '#0f172a',
            color: '#e2e8f0'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/pagos-pendientes/${id}/cancelar`);
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Pago cancelado', showConfirmButton: false, timer: 2000
                });
                fetchCompras();
            } catch (error) {
                Swal.fire('Error', 'No se pudo cancelar el pago', 'error');
            }
        }
    };

    // Reenviar comprobante
    const handleReenviar = async (id) => {
        const { value: file } = await Swal.fire({
            title: 'Nuevo comprobante',
            html: '<p style="color: #94a3b8; font-size: 0.9rem;">Sube un nuevo comprobante de transferencia</p>',
            input: 'file',
            inputAttributes: { accept: 'image/*', 'aria-label': 'Subir comprobante' },
            inputValidator: (value) => !value && 'Debes seleccionar un comprobante',
            showCancelButton: true,
            confirmButtonColor: '#00b7ff',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Reenviar',
            cancelButtonText: 'Cancelar',
            background: '#0f172a',
            color: '#e2e8f0'
        });

        if (!file) return;

        try {
            Swal.fire({ title: 'Reenviando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            const compressImage = (file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxSize = 800;
                            let w = img.width, h = img.height;
                            if (w > maxSize || h > maxSize) {
                                if (w > h) { h = (h / w) * maxSize; w = maxSize; }
                                else { w = (w / h) * maxSize; h = maxSize; }
                            }
                            canvas.width = w;
                            canvas.height = h;
                            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                            resolve(canvas.toDataURL('image/jpeg', 0.6));
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            };

            const base64 = await compressImage(file);
            await api.patch(`/pagos-pendientes/${id}/reenviar`, { comprobante: base64 });

            Swal.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Comprobante reenviado', text: 'Pendiente de revisión',
                showConfirmButton: false, timer: 2500
            });
            fetchCompras();
        } catch (error) {
            Swal.fire('Error', 'No se pudo reenviar el comprobante', 'error');
        }
    };

    // Exportar a Excel
    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const XLSX = await import('xlsx');
            const ws_data = [
                ['Fecha', 'Estado', 'Productos', 'Total', 'Notas Admin']
            ];
            itemsFiltrados.forEach(item => {
                ws_data.push([
                    formatFecha(item.fechaCompra || item.createdAt),
                    item.tipo === 'completado' ? 'Completado' : item.tipo === 'pendiente' ? 'Pendiente' : item.tipo === 'rechazado' ? 'Rechazado' : 'Cancelado',
                    (item.productosComprados || []).map(p => `${p.nombre} x${p.cantidad}`).join(', '),
                    item.totalVenta || 0,
                    item.notasAdmin || ''
                ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Mis Compras');
            XLSX.writeFile(wb, `mis-compras-${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Error exportando:', error);
        } finally {
            setExporting(false);
        }
    };

    // Exportar a PDF
    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text('Historial de Compras', 14, 22);
            doc.setFontSize(10);
            doc.text(`Usuario: ${user.username || user.email}`, 14, 30);
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 36);

            let y = 46;
            itemsFiltrados.forEach((item, index) => {
                if (y > 270) { doc.addPage(); y = 20; }
                
                const estado = item.tipo === 'completado' ? 'Completado' : item.tipo === 'pendiente' ? 'Pendiente' : item.tipo === 'rechazado' ? 'Rechazado' : 'Cancelado';
                doc.setFontSize(9);
                doc.text(`${formatFecha(item.fechaCompra || item.createdAt)} | ${estado} | $${formatCurrency(item.totalVenta)}`, 14, y);
                y += 5;
                
                (item.productosComprados || []).forEach(prod => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.setFontSize(8);
                    doc.text(`  - ${prod.nombre} x${prod.cantidad} ($${formatCurrency(prod.precioUnitario * prod.cantidad)})`, 14, y);
                    y += 4;
                });
                
                if (item.notasAdmin) {
                    doc.setFontSize(8);
                    doc.text(`  Nota: ${item.notasAdmin}`, 14, y);
                    y += 4;
                }
                y += 4;
            });

            doc.save(`mis-compras-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exportando PDF:', error);
        } finally {
            setExporting(false);
        }
    };

    // Limpiar mi propio historial
    const handleLimpiarMiHistorial = async () => {
        const result = await Swal.fire({
            title: '⚠️ ¿Limpiar tu historial?',
            html: '<p style="color: #94a3b8;">Se eliminarán <strong style="color: #ff4d4d;">TODAS</strong> tus ventas y pagos pendientes.</p><p style="color: #ff4d4d; font-size: 0.85rem;">Esta acción no se puede deshacer.</p>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, borrar todo',
            cancelButtonText: 'Cancelar',
            background: '#0f172a',
            color: '#e2e8f0'
        });

        if (result.isConfirmed) {
            try {
                await api.delete('/pagos-pendientes/mi-historial');
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Historial limpiado', showConfirmButton: false, timer: 2500
                });
                fetchCompras();
            } catch (error) {
                Swal.fire('Error', 'No se pudo limpiar el historial', 'error');
            }
        }
    };

    const toggleCard = (id) => {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleVerComprobante = (comprobante) => {
        Swal.fire({
            title: 'Tu comprobante',
            imageUrl: comprobante,
            imageWidth: '100%',
            imageMaxWidth: 500,
            showCloseButton: true,
            showConfirmButton: false,
            background: '#0f172a',
            color: '#e2e8f0'
        });
    };

    const renderTimeline = () => {
        if (loading) {
            return (
                <div className="timeline-skeleton">
                    {[1,2,3].map(i => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton-content" />
                        </div>
                    ))}
                </div>
            );
        }

        if (itemsFiltrados.length === 0) {
            return (
                <div className="timeline-empty">
                    <FaShoppingBag size={50} />
                    <h3>No hay compras {filtro !== 'todas' ? filtro : ''}</h3>
                    <p>{filtro === 'pendientes' ? 'No tienes pagos pendientes de aprobación' : 'Aún no tienes compras registradas'}</p>
                </div>
            );
        }

        return (
            <div className="timeline-container">
                {itemsFiltrados.map((item, index) => {
                    const itemId = item._id || item.id || index;
                    const isExpanded = expandedCards[itemId];
                    const diasRestantes = item.tipo === 'pendiente' ? getDiasRestantes(item.fechaCompra || item.createdAt) : null;
                    const todosLosProductos = item.productosComprados || [];
                    const productosAMostrar = isExpanded ? todosLosProductos : todosLosProductos.slice(0, 3);

                    return (
                        <div key={itemId} className={`timeline-item ${item.tipo}`}>
                            <div className="timeline-dot">
                                {item.tipo === 'pendiente' && <FaClock />}
                                {item.tipo === 'completado' && <FaCheck />}
                                {item.tipo === 'rechazado' && <FaTimes />}
                                {item.tipo === 'cancelado' && <FaBan />}
                            </div>
                            
                            {index < itemsFiltrados.length - 1 && <div className="timeline-connector" />}

                            <div className="timeline-card">
                                {/* Header */}
                                <div className="timeline-card-header">
                                    <div className="timeline-fecha">
                                        <FaCalendarAlt />
                                        {formatFecha(item.fechaCompra || item.createdAt)}
                                    </div>
                                    <div className="timeline-header-right">
                                        {diasRestantes !== null && diasRestantes <= 3 && diasRestantes > 0 && (
                                            <span className="expiracion-badge">
                                                <FaClock /> Expira en {diasRestantes}d
                                            </span>
                                        )}
                                        {diasRestantes !== null && diasRestantes <= 0 && (
                                            <span className="expiracion-badge expirado">
                                                <FaClock /> Expirado
                                            </span>
                                        )}
                                        <span className={`estado-badge ${item.tipo}`}>
                                            {item.tipo === 'pendiente' && '⏳ Pendiente'}
                                            {item.tipo === 'completado' && '✅ Completado'}
                                            {item.tipo === 'rechazado' && '❌ Rechazado'}
                                            {item.tipo === 'cancelado' && '🚫 Cancelado'}
                                        </span>
                                    </div>
                                </div>

                                {/* Nota de rechazo */}
                                {item.tipo === 'rechazado' && item.notasAdmin && (
                                    <div className="nota-rechazo">
                                        <strong>Motivo del rechazo:</strong> {item.notasAdmin}
                                    </div>
                                )}

                                {/* Productos */}
                                <div className="timeline-productos">
                                    {productosAMostrar.map((prod, i) => (
                                        <div key={i} className="producto-mini">
                                            <div className="producto-mini-img">
                                                {prod.imagen ? (
                                                    <img src={prod.imagen} alt={prod.nombre} />
                                                ) : (
                                                    <FaBoxes />
                                                )}
                                            </div>
                                            <div className="producto-mini-info">
                                                <span className="producto-nombre">{prod.nombre}</span>
                                                <span className="producto-qty">x{prod.cantidad}</span>
                                            </div>
                                            <span className="producto-precio">{formatCurrency(prod.precioUnitario * prod.cantidad)}</span>
                                        </div>
                                    ))}
                                    {todosLosProductos.length > 3 && (
                                        <button className="btn-expandir" onClick={() => toggleCard(itemId)}>
                                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                            {isExpanded ? 'Ver menos' : `+${todosLosProductos.length - 3} productos más`}
                                        </button>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="timeline-card-footer">
                                    <div className="timeline-total">
                                        <FaDollarSign />
                                        <span>Total: <strong>{formatCurrency(item.totalVenta)}</strong></span>
                                    </div>
                                    <div className="timeline-acciones">
                                        {item.tipo === 'completado' && (
                                            <button className="btn-accion btn-primary" onClick={() => navigate(`/comprobante/${item.id || item._id}`)}>
                                                <FaReceipt /> Ver comprobante
                                            </button>
                                        )}
                                        {item.tipo === 'pendiente' && (
                                            <>
                                                <button className="btn-accion btn-secondary" onClick={() => handleVerComprobante(item.comprobante)}>
                                                    <FaReceipt /> Ver comprobante
                                                </button>
                                                <button className="btn-accion btn-danger" onClick={() => handleCancelar(item._id)}>
                                                    <FaBan /> Cancelar
                                                </button>
                                            </>
                                        )}
                                        {item.tipo === 'rechazado' && (
                                            <>
                                                <button className="btn-accion btn-secondary" onClick={() => handleVerComprobante(item.comprobante)}>
                                                    <FaReceipt /> Ver comprobante
                                                </button>
                                                <button className="btn-accion btn-warning" onClick={() => handleReenviar(item._id)}>
                                                    <FaRedo /> Reenviar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!open) return null;

    return (
        <div className={isPageMode ? 'compras-page-container' : 'compras-modal-overlay'} onClick={!isPageMode ? onClose : undefined}>
            <div className="compras-modal-content" onClick={e => e.stopPropagation()} role={isPageMode ? 'region' : 'dialog'} aria-modal={!isPageMode}>
                {!isPageMode && (
                    <button className="compras-close-btn" onClick={onClose} aria-label="Cerrar">&times;</button>
                )}

                <div className="miscompras-page-header">
                    <div className="header-top">
                        <div>
                            <h2 id="compras-title" className="compras-title">Historial de Compras</h2>
                            <p className="miscompras-intro">Todas tus compras y transferencias en un solo lugar</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-export" onClick={handleExportExcel} disabled={exporting}>
                                {exporting ? <FaSpinner className="spin" /> : <FaFileExcel />} Excel
                            </button>
                            <button className="btn-export" onClick={handleExportPDF} disabled={exporting}>
                                {exporting ? <FaSpinner className="spin" /> : <FaFilePdf />} PDF
                            </button>
                            <button className="btn-export btn-clear-history" onClick={handleLimpiarMiHistorial}>
                                <FaTrash /> Limpiar historial
                            </button>
                        </div>
                    </div>
                    
                    {/* Resumen */}
                    <div className="resumen-cards">
                        <div className="resumen-card">
                            <span className="resumen-numero">{stats.totalCompras}</span>
                            <span className="resumen-label">Total compras</span>
                        </div>
                        <div className="resumen-card">
                            <span className="resumen-numero resumen-pendientes">{stats.totalPendientes}</span>
                            <span className="resumen-label">Pendientes</span>
                        </div>
                        <div className="resumen-card">
                            <span className="resumen-numero resumen-completadas">{stats.totalCompletadas}</span>
                            <span className="resumen-label">Completadas</span>
                        </div>
                        <div className="resumen-card">
                            <span className="resumen-numero resumen-rechazados">{stats.totalRechazados}</span>
                            <span className="resumen-label">Rechazados</span>
                        </div>
                        <div className="resumen-card resumen-card-wide">
                            <span className="resumen-numero">{formatCurrency(stats.gastoTotal)}</span>
                            <span className="resumen-label">Gasto total</span>
                        </div>
                        <div className="resumen-card">
                            <span className="resumen-numero">{formatCurrency(stats.gastoMes)}</span>
                            <span className="resumen-label">Este mes</span>
                        </div>
                        <div className="resumen-card">
                            <span className="resumen-numero">{formatCurrency(stats.gastoAnio)}</span>
                            <span className="resumen-label">Este año</span>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="filtros-pills">
                        <button className={`filtro-pill ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>
                            <FaFilter /> Todas ({stats.totalCompras})
                        </button>
                        <button className={`filtro-pill ${filtro === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltro('pendientes')}>
                            <FaClock /> Pendientes {stats.totalPendientes > 0 && <span className="pill-badge">{stats.totalPendientes}</span>}
                        </button>
                        <button className={`filtro-pill ${filtro === 'completadas' ? 'active' : ''}`} onClick={() => setFiltro('completadas')}>
                            <FaCheck /> Completadas
                        </button>
                        <button className={`filtro-pill ${filtro === 'rechazados' ? 'active' : ''}`} onClick={() => setFiltro('rechazados')}>
                            <FaTimes /> Rechazados {stats.totalRechazados > 0 && <span className="pill-badge pill-badge-red">{stats.totalRechazados}</span>}
                        </button>
                        <button className={`filtro-pill ${filtro === 'cancelados' ? 'active' : ''}`} onClick={() => setFiltro('cancelados')}>
                            <FaBan /> Cancelados
                        </button>
                    </div>
                </div>

                {renderTimeline()}
            </div>
        </div>
    );
}

export default MisComprasModal;
