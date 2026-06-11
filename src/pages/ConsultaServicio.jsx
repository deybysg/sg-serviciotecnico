import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { shortId, toIdString } from '../utils/id';
import Swal from 'sweetalert2';
import './ConsultaServicio.css';

const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return 'Pendiente';
    }
    const numValue = Number(value);
    return numValue.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const PASOS = {
    P1_RECIBIDO: 'pendiente',
    P2_EN_REVISION: 'enRevision',
    P3_DIAGNOSTICO: 'diagnostico',
    P2_5_SIN_SOLUCION: 'notificacion',
    P4_REPARACION: 'reparacion',
    P5_TERMINADO: 'terminado',
    P6_ENTREGADO: 'entregado'
};

const ESTADO_DISPLAY = {
    pendiente: "Equipo Recibido (Esperando ser Revisado)",
    enRevision: "En Revisión Inicial / Diagnóstico",
    diagnostico: "Diagnóstico Finalizado / Presupuesto Generado",
    presupuestoPendiente: "Presupuesto Generado (Esperando Aprobación del Cliente)",
    reparacion: "En Proceso de Reparación Activa",
    revisionTerminada: "En Reparación",
    terminado: "Listo para Retirar",
    entregado: "Servicio Entregado y Cerrado",
    notificacion: "Notificación",
    sinSolucion: "Notificación"
};

function ConsultaServicio() {
    const { id: urlId } = useParams();
    const navigate = useNavigate();

    const [searchId, setSearchId] = useState(urlId || '');
    const [servicio, setServicio] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPresupuestoModal, setShowPresupuestoModal] = useState(false);
    const [showBudgetDetails, setShowBudgetDetails] = useState(false);

    const fetchServicio = useCallback(async (serviceId) => {
        if (!serviceId) return;

        const isInitialFetch = !servicio;

        if (isInitialFetch) {
            setLoading(true);
            setError(null);
            setServicio(null);
            setCliente(null);
        }

        try {
            const candidate = String(serviceId).trim();

            if (/^\d{3,5}$/.test(candidate)) {
                const dataServicio = await api.get(`/seguimiento/${candidate}`, false);
                setServicio(dataServicio);

                if (dataServicio.cliente && typeof dataServicio.cliente === 'object') {
                    setCliente(dataServicio.cliente);
                } else {
                    setCliente(null);
                }
            } else {
                throw new Error('Ingrese un número de servicio válido (3-5 dígitos).');
            }

        } catch (err) {
            if (isInitialFetch) {
                setError("No se pudo encontrar el servicio con el número proporcionado. Ingrese un número de 3 a 5 dígitos.");
                Swal.fire("Sin resultados", "Verificá el número de servicio (3-5 dígitos).", "warning");
            }
        } finally {
            if (isInitialFetch) {
                setLoading(false);
            }
        }
    }, [servicio]);

    useEffect(() => {
        if (urlId) {
            setSearchId(urlId);
            fetchServicio(urlId);
        }
    }, [urlId, fetchServicio]);

    useEffect(() => {
        if (servicio && servicio.estado !== PASOS.P6_ENTREGADO) {
            const intervalId = setInterval(() => {
                const sid = servicio.servicioNumero;
                if (sid) {
                    fetchServicio(sid);
                }
            }, 10000);

            return () => {
                clearInterval(intervalId);
            };
        }
        return () => {};
    }, [servicio, fetchServicio]);

    useEffect(() => {
        if (!showPresupuestoModal) {
            setShowBudgetDetails(false);
        }
    }, [showPresupuestoModal]);

    const handleSearch = (e) => {
        e.preventDefault();

        const finalId = searchId.trim();
        if (!finalId) {
            Swal.fire("Atención", "Ingrese un número de servicio.", "warning");
            return;
        }

        if (!/^\d{3,5}$/.test(finalId)) {
            Swal.fire("Atención", "Ingrese un número válido de 3 a 5 dígitos.", "warning");
            return;
        }

        navigate(`/seguimiento/${finalId}`);
    };

    const handleExit = () => {
        setServicio(null);
        setSearchId('');
        navigate('/seguimiento', { replace: true });
    };

    const isStepActive = (targetStep) => {
        const estadoActual = servicio?.estado;
        if (!estadoActual) return false;

        const order = [
            PASOS.P1_RECIBIDO,
            PASOS.P2_EN_REVISION,
            PASOS.P3_DIAGNOSTICO,
            PASOS.P2_5_SIN_SOLUCION,
            'presupuestoPendiente',
            PASOS.P4_REPARACION,
            'revisionTerminada',
            PASOS.P5_TERMINADO,
            PASOS.P6_ENTREGADO
        ];

        const currentIndex = order.indexOf(estadoActual);

        const activationIndexMap = {
            'P1_RECIBIDO': order.indexOf(PASOS.P1_RECIBIDO),
            'P2_DIAGNOSTICO': order.indexOf(PASOS.P2_EN_REVISION),
            'P2_5_SIN_SOLUCION': order.indexOf(PASOS.P2_5_SIN_SOLUCION),
            'P3_REPARACION': order.indexOf(PASOS.P4_REPARACION),
            'P4_TERMINADO': order.indexOf(PASOS.P5_TERMINADO),
        };

        const targetIndex = activationIndexMap[targetStep];

        return currentIndex >= targetIndex;
    };

    const getStatusIcon = (estado) => {
        if (estado === 'notificacion') return { icon: "⚠️", class: "glow-notificacion" };
        if (estado === PASOS.P6_ENTREGADO) return { icon: "✅", class: "glow-entregado" };
        if (isStepActive('P4_TERMINADO')) return { icon: "🎁", class: "glow-listo" };
        if (isStepActive('P3_REPARACION')) return { icon: "🔧", class: "glow-reparacion" };
        if (isStepActive('P2_DIAGNOSTICO')) return { icon: "🔬", class: "glow-diagnostico" };
        if (isStepActive('P1_RECIBIDO')) return { icon: "📄", class: "glow-recibido" };
        return { icon: "❓", class: "glow-recibido" };
    };

    const currentIcon = getStatusIcon(servicio?.estado);
    const isViewingResult = servicio && !loading && !error;

    return (
        <div className="consulta-servicio-full">
            <div className="bg-animated"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="grid-overlay"></div>

            <header className="mobile-header">
                <div className="tracking-logo">
                    <span>✦ </span>SG Servicio Técnico
                </div>
                <div className="header-actions">
                    {isViewingResult ? (
                        <button className="btn-icon" onClick={handleExit}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Salir
                        </button>
                    ) : (
                        <button className="btn-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                            Info
                        </button>
                    )}
                </div>
            </header>

            <div className="consulta-servicio-container">
                <h1 className="title-bold">Estado de tu Equipo</h1>
                <p className="tracking-subtitle">Ingresá el número de orden para seguir tu servicio</p>

                {(!urlId || error || !isViewingResult) && (
                    <form onSubmit={handleSearch} className="search-wrapper">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="N° de servicio (ej: 100)"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="search-input"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                className="search-button"
                                disabled={loading}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                    </form>
                )}

                {loading && <div className="status-message">Cargando detalles...</div>}
                {error && <div className="error-message">{error}</div>}

                {isViewingResult && (
                    <>
                        <div className="status-section">
                            <div className={`status-icon ${currentIcon.class}`}>
                                <span role="img" aria-label="Status Icon">{currentIcon.icon}</span>
                            </div>
                        </div>

                        <div className="timeline-container">
                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P1_RECIBIDO') ? 'active' : ''}`}>📄</div>
                                <span className="timeline-label">Recibido</span>
                            </div>

                            <div className={`timeline-line ${isStepActive('P2_DIAGNOSTICO') ? 'line-active' : ''}`}></div>

                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P2_DIAGNOSTICO') ? 'active' : ''}`}>
                                    {isStepActive('P2_DIAGNOSTICO') ? '🔬' : ''}
                                </div>
                                <span className="timeline-label">Diagnóstico</span>
                            </div>

                            <div className={`timeline-line ${isStepActive('P2_5_SIN_SOLUCION') ? 'line-active' : ''}`}></div>

                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P2_5_SIN_SOLUCION') ? 'active' : ''}`}>
                                    {isStepActive('P2_5_SIN_SOLUCION') ? '⚠️' : ''}
                                </div>
                                <span className="timeline-label">Notificación</span>
                            </div>

                            <div className={`timeline-line ${isStepActive('P3_REPARACION') ? 'line-active' : ''}`}></div>

                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P3_REPARACION') ? 'active' : ''}`}>
                                    {isStepActive('P3_REPARACION') ? '🔧' : ''}
                                </div>
                                <span className="timeline-label">Reparación</span>
                            </div>

                            <div className={`timeline-line ${isStepActive('P4_TERMINADO') ? 'line-active' : ''}`}></div>

                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P4_TERMINADO') ? 'active' : ''}`}>
                                    {isStepActive('P4_TERMINADO') ? '🎁' : ''}
                                </div>
                                <span className="timeline-label">Listo Retirar</span>
                            </div>
                        </div>

                        <div className="details-box">
                            <div className="detail-item">
                                <span className="detail-label">Cliente</span>
                                <span className="detail-value">{cliente?.nombreCompleto || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">N° de Orden</span>
                                <span className="detail-value">#{servicio.servicioNumero || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Equipo</span>
                                <span className="detail-value">{servicio.marcaProducto} ({servicio.tipoServicio})</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Fecha Ingreso</span>
                                <span className="detail-value">{new Date(servicio.fechaEntrada).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Estado Actual</span>
                                <span className="detail-value">
                                    <span className={`current-status-label ${servicio.estado}`}>{ESTADO_DISPLAY[servicio.estado] || servicio.estado}</span>
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Presupuesto Total</span>
                                <span className="detail-value">${formatNumber(servicio.presupuesto?.total) || 'Pendiente'}</span>
                            </div>
                        </div>

                        {(servicio?.estado === 'notificacion' || servicio?.notificacion || servicio?.sinSolucion) && (
                            <div className="seguimiento-notificacion-box">
                                <div style={{ width: 44, height: 44, minWidth: 44, borderRadius: 14, background: 'rgba(239,68,68,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.4rem' }}>⚠️</div>
                                <div style={{ flex: 1 }}>
                                    <h3>Notificación del Taller</h3>
                                    {(() => {
                                        const notiEntries = servicio.seguimiento ? servicio.seguimiento.filter(e => e.tipo === 'notificacion' || e.tipo === 'sinSolucion') : [];
                                        const latest = notiEntries.length > 0 ? notiEntries.slice().reverse()[0] : null;
                                        const mensaje = servicio.detalleCliente || latest?.mensaje || 'El equipo no tiene solución.';
                                        return (
                                            <>
                                                <p className="seguimiento-mensaje">{mensaje}</p>
                                                {latest && (
                                                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                                                        Enviado por {latest.autor || 'Taller'} • {new Date(latest.fecha).toLocaleString()}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="action-buttons">
                            {(servicio.presupuesto?.total > 0 || servicio.estado === 'presupuestoPendiente') && (
                                <button className="btn-primary-outline" onClick={() => setShowPresupuestoModal(true)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                    Ver Presupuesto
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => Swal.fire('Contacto', cliente?.telefono ? `Llamar a ${cliente.telefono}` : 'Datos de contacto no disponibles', 'info')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                Contactar Taller
                            </button>
                        </div>
                    </>
                )}
            </div>

            {showPresupuestoModal && servicio && (
                <div className="modal-overlay" onClick={() => setShowPresupuestoModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Detalle del Presupuesto (Orden N°: {servicio.servicioNumero || 'N/A'})</h3>

                        {servicio.presupuesto?.items?.length > 0 && (
                            <div className="toggle-budget-details">
                                <button
                                    className="btn-link"
                                    onClick={() => setShowBudgetDetails(!showBudgetDetails)}
                                >
                                    {showBudgetDetails ? 'Ocultar Detalles ▲' : 'Ver Detalles ▼'}
                                </button>
                            </div>
                        )}

                        {showBudgetDetails && servicio.presupuesto?.items && servicio.presupuesto.items.length > 0 ? (
                            <ul>
                                {servicio.presupuesto.items.map((item, index) => (
                                    <li key={index} className="modal-item">
                                        <span>{item.descripcion}</span>
                                        <span>${formatNumber(item.costo)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !showBudgetDetails && servicio.presupuesto?.total > 0 && (
                                <p className="budget-summary">Total: ${formatNumber(servicio.presupuesto.total)}</p>
                            )
                        )}

                        {(!servicio.presupuesto?.items?.length && servicio.presupuesto?.total === 0) && (
                            <p>Detalles del presupuesto pendientes.</p>
                        )}

                        {servicio.presupuesto?.total > 0 && (
                            <div className="modal-total">
                                <strong>Total General: ${formatNumber(servicio.presupuesto.total)}</strong>
                            </div>
                        )}
                        <button onClick={() => setShowPresupuestoModal(false)} className="btn-secondary">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConsultaServicio;
