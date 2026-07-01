import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { shortId, toIdString } from '../utils/id';
import Swal from 'sweetalert2';
import './ConsultaServicio.css';
import { FiFileText, FiSearch, FiBell, FiTool, FiPackage, FiArrowRight, FiHome, FiUser, FiClock, FiCalendar, FiHash, FiActivity, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';

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

function normalizeServicio(s) {
    if (!s) return s;
    const id = s.id || s._id;
    let clienteId;
    if (s.cliente_id != null) {
        clienteId = String(s.cliente_id);
    } else if (s.clienteId != null) {
        clienteId = String(s.clienteId);
    } else if (s.cliente && typeof s.cliente === 'object') {
        clienteId = String(s.cliente.id || s.cliente._id);
    } else if (s.cliente != null) {
        clienteId = String(s.cliente);
    }
    return {
        id: id,
        _id: id,
        servicioNumero: s.servicio_numero ?? s.servicioNumero,
        clienteId: clienteId,
        cliente: clienteId,
        clienteNombre: s.cliente_nombre || s.clienteNombre || '',
        clienteCelular: s.cliente_celular || s.clienteCelular || '',
        clienteCorreo: s.cliente_correo || s.clienteCorreo || '',
        tipoEquipo: s.tipo_equipo ?? s.tipoEquipo,
        marcaProducto: s.marca_producto ?? s.marcaProducto,
        modeloProducto: s.modelo_producto ?? s.modeloProducto,
        tipoServicio: s.tipo_servicio ?? s.tipoServicio,
        fallaReportada: s.falla_reportada ?? s.fallaReportada,
        asunto: s.asunto,
        detalles: s.detalles,
        notasAdicionales: s.notas_adicionales ?? s.notasAdicionales,
        metodoPago: s.metodo_pago ?? s.metodoPago,
        anticipo: s.anticipo,
        presupuesto: s.presupuesto || {
            items: s.presupuesto_items || [],
            subtotal: s.presupuesto_subtotal || 0,
            iva: s.presupuesto_iva || 0,
            total: s.presupuesto_total || 0
        },
        estado: s.estado,
        detalleCliente: s.detalle_cliente ?? s.detalleCliente,
        seguimiento: s.seguimiento || [],
        fechaEntrada: s.fecha_entrada ?? s.fechaEntrada,
        fechaSalida: s.fecha_salida ?? s.fechaSalida,
        createdAt: s.created_at ?? s.createdAt,
        updatedAt: s.updated_at ?? s.updatedAt,
    };
}

function normalizeCliente(c) {
    if (!c) return c;
    return {
        id: c.id || c._id,
        nombreCompleto: c.nombre_completo || c.nombreCompleto || '',
        celular: c.celular || '',
        correo: c.correo || c.email || '',
        direccion: c.direccion || '',
        dni: c.dni || '',
    };
}

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

    const fetchServicio = useCallback(async (serviceId, isBackground = false) => {
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

            if (/^\d{3,}$/.test(candidate)) {
                // background=true para refreshes periódicos (no activa overlay)
                const dataServicio = await api.get(`/seguimiento/${candidate}`, false, isBackground);
                const servicioNormalizado = normalizeServicio(dataServicio);
                setServicio(servicioNormalizado);

                if (dataServicio.cliente && typeof dataServicio.cliente === 'object') {
                    setCliente(normalizeCliente(dataServicio.cliente));
                } else if (dataServicio.cliente_nombre || dataServicio.clienteNombre) {
                    setCliente({
                        nombreCompleto: dataServicio.cliente_nombre || dataServicio.clienteNombre || '',
                        celular: dataServicio.cliente_celular || dataServicio.clienteCelular || '',
                        correo: dataServicio.cliente_correo || dataServicio.clienteCorreo || ''
                    });
                } else {
                    setCliente(null);
                }
            } else {
                throw new Error('Ingrese un número de servicio válido (mínimo 3 dígitos).');
            }

        } catch (err) {
            if (isInitialFetch) {
                setError("No se pudo encontrar el servicio con el número proporcionado. Ingrese un número de mínimo 3 dígitos.");
                Swal.fire("Sin resultados", "Verificá el número de servicio (mínimo 3 dígitos).", "warning");
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
                    // background=true: no activa el overlay de servidor dormido
                    fetchServicio(sid, true);
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

        if (!/^\d{3,}$/.test(finalId)) {
            Swal.fire("Atención", "Ingrese un número válido de mínimo 3 dígitos.", "warning");
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
            'P3_DIAGNOSTICO': order.indexOf(PASOS.P2_EN_REVISION),
            'P2_5_SIN_SOLUCION': order.indexOf(PASOS.P2_5_SIN_SOLUCION),
            'P4_REPARACION': order.indexOf(PASOS.P4_REPARACION),
            'P5_TERMINADO': order.indexOf(PASOS.P5_TERMINADO),
        };

        const targetIndex = activationIndexMap[targetStep];

        return currentIndex >= targetIndex;
    };

    const getStatusIcon = (estado) => {
        if (estado === 'notificacion') return { icon: "⚠️", class: "glow-notificacion" };
        if (estado === PASOS.P6_ENTREGADO) return { icon: "✅", class: "glow-entregado" };
        if (isStepActive('P5_TERMINADO')) return { icon: "🎁", class: "glow-listo" };
        if (isStepActive('P4_REPARACION')) return { icon: "🔧", class: "glow-reparacion" };
        if (isStepActive('P3_DIAGNOSTICO')) return { icon: "🔬", class: "glow-diagnostico" };
        if (estado === 'pendiente' || estado === 'enRevision') return { icon: "📄", class: "glow-recibido" };
        return { icon: "❓", class: "glow-recibido" };
    };

    const currentIcon = getStatusIcon(servicio?.estado);
    const isViewingResult = servicio && !loading && !error;

    const isNotificacionEstado = servicio?.estado === 'notificacion' || servicio?.estado === 'sinSolucion';

    const timelineSteps = [
        { key: 'P1_RECIBIDO', label: 'RECIBIDO', desc: 'Tu equipo ha sido recibido correctamente.', icon: <FiFileText size={22} />, color: 'blue' },
        { key: 'P3_DIAGNOSTICO', label: 'DIAGNÓSTICO', desc: 'Estamos evaluando la falla reportada.', icon: <FiSearch size={22} />, color: 'amber' },
        { key: 'P4_REPARACION', label: 'REPARACIÓN', desc: 'Tu equipo está siendo reparado por nuestro equipo técnico.', icon: <FiTool size={22} />, color: 'purple' },
        { key: 'P5_TERMINADO', label: 'LISTO PARA RETIRAR', desc: 'Tu equipo está listo para ser retirado.', icon: <FiPackage size={22} />, color: 'green' },
    ];

    const notificacionStep = { 
        key: 'P2_5_SIN_SOLUCION', 
        label: 'NOTIFICACIÓN', 
        desc: servicio?.detalleCliente || 'El taller se pondrá en contacto contigo.', 
        icon: <FiBell size={22} />, 
        color: 'magenta' 
    };

    return (
        <div className="consulta-servicio-full">
            <div className="bg-animated"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="grid-overlay"></div>

            <header className="cs-header">
                <div className="cs-header-left">
                    <span className="cs-header-logo">SEGUIMIENTO DE SERVICIO</span>
                </div>
                <div className="cs-header-actions">
                    <button className="cs-header-btn" onClick={() => navigate('/')}>
                        <FiHome size={16} /> Inicio
                    </button>
                    <button className="cs-header-btn" onClick={() => navigate('/login')}>
                        <FiUser size={16} /> Perfil
                    </button>
                </div>
            </header>

            <div className="consulta-servicio-container">
                <h1 className="title-bold">Estado de tu <span className="title-highlight">Equipo</span></h1>
                <p className={`tracking-subtitle ${isViewingResult && servicio ? (() => {
                    const colorMap = {
                        pendiente: 'blue',
                        enRevision: 'amber',
                        diagnostico: 'amber',
                        notificacion: 'magenta',
                        sinSolucion: 'magenta',
                        reparacion: 'purple',
                        revisionTerminada: 'purple',
                        terminado: 'green',
                        entregado: 'green',
                        presupuestoPendiente: 'amber'
                    };
                    return colorMap[servicio.estado] || '';
                })() : ''}`}>
                    {isViewingResult && servicio ? (() => {
                        const estadoDesc = {
                            pendiente: 'Tu equipo ha sido recibido correctamente.',
                            enRevision: 'Estamos evaluando la falla reportada.',
                            diagnostico: 'Estamos evaluando la falla reportada.',
                            notificacion: 'Te notificaremos si el equipo no tiene solución.',
                            sinSolucion: 'Te notificaremos si el equipo no tiene solución.',
                            reparacion: 'Tu equipo está siendo reparado por nuestro equipo técnico.',
                            revisionTerminada: 'Tu equipo está siendo reparado por nuestro equipo técnico.',
                            terminado: 'Tu equipo está listo para ser retirado.',
                            entregado: 'Servicio entregado y cerrado.',
                            presupuestoPendiente: 'Presupuesto generado, esperando aprobación del cliente.'
                        };
                        return estadoDesc[servicio.estado] || 'Seguimiento de tu servicio técnico.';
                    })() : 'Ingresá el número de orden para seguir tu servicio'}
                </p>

                {(!urlId || error || !isViewingResult) && (
                    <form onSubmit={handleSearch} className="search-wrapper">
                        <div className="search-bar">
                            <FiSearch size={20} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Ej: #112 o 000112"
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
                                <FiArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                )}

                {loading && (
                    <div className="cs-loading-state">
                        <div className="cs-loading-pulse"></div>
                        <span className="cs-loading-text">Conectando con el servidor...</span>
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}

                {isViewingResult && (
                    <>
                        {servicio?.estado === 'entregado' ? (
                            <div className="gratitude-card">
                                <div className="gratitude-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div className="gratitude-content">
                                    <h2 className="gratitude-title">¡Servicio Completado!</h2>
                                    <p className="gratitude-message">
                                        Gracias por confiar en nosotros. Tu equipo ha sido entregado exitosamente.
                                    </p>
                                    <div className="gratitude-details">
                                        <div className="gratitude-item">
                                            <span className="gratitude-label">Cliente</span>
                                            <span className="gratitude-value">{cliente?.nombreCompleto || servicio?.clienteNombre || servicio?.cliente_nombre || 'N/A'}</span>
                                        </div>
                                        <div className="gratitude-item">
                                            <span className="gratitude-label">Equipo</span>
                                            <span className="gratitude-value">{servicio.marcaProducto} {servicio.modeloProducto}</span>
                                        </div>
                                        <div className="gratitude-item">
                                            <span className="gratitude-label">Fecha de Entrega</span>
                                            <span className="gratitude-value">{servicio.fechaSalida ? new Date(servicio.fechaSalida).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="gratitude-confetti">
                                    <span className="confetti"></span>
                                    <span className="confetti"></span>
                                    <span className="confetti"></span>
                                    <span className="confetti"></span>
                                    <span className="confetti"></span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="cosmic-timeline">
                                    <div className="timeline-track">
                                        <div className="track-line"></div>
                                        <div className="track-glow"></div>
                                    </div>
                                    {timelineSteps.map((step, index) => {
                                        const isActive = isStepActive(step.key);
                                        const isCurrent = (servicio?.estado === PASOS[step.key]) 
                                            || (step.key === 'P3_DIAGNOSTICO' && servicio?.estado === 'enRevision')
                                            || (step.key === 'P4_REPARACION' && (servicio?.estado === 'reparacion' || servicio?.estado === 'revisionTerminada'));
                                        const isCompleted = (step.key === 'P5_TERMINADO' && (servicio?.estado === 'terminado' || servicio?.estado === 'entregado'));
                                        return (
                                            <div key={step.key} className={`cosmic-node ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${step.color}`}>
                                                <div className="node-orb">
                                                    <div className="orb-inner">
                                                        <div className="orb-icon">{step.icon}</div>
                                                    </div>
                                                    <div className="orb-ring ring-1"></div>
                                                    <div className="orb-ring ring-2"></div>
                                                    <div className="orb-particles">
                                                        <span className="particle"></span>
                                                        <span className="particle"></span>
                                                        <span className="particle"></span>
                                                    </div>
                                                </div>
                                                <div className={`node-card ${step.color}`}>
                                                    <div className="card-shine"></div>
                                                    <div className="card-glow"></div>
                                                    <div className="card-content">
                                                        <div className="card-step">{index + 1}</div>
                                                        <h4 className={`card-title ${step.color}`}>{step.label}</h4>
                                                        <p className="card-desc">{step.desc}</p>
                                                        {isCompleted && (
                                                            <div className="card-complete">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                                Completado
                                                            </div>
                                                        )}
                                                        {isCurrent && !isCompleted && (
                                                            <div className={`card-status ${step.color}`}>
                                                                <span className="status-dot"></span>
                                                                <span className="status-text">En Progreso</span>
                                                            </div>
                                                        )}
                                                        {isActive && !isCurrent && !isCompleted && (
                                                            <div className="card-complete">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                                Completado
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`card-border ${step.color}`}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="client-card">
                                    <div className="client-card-left">
                                        <div className="client-avatar">
                                            <FiUser size={28} />
                                        </div>
                                        <div className="client-info">
                                            <span className="client-label">CLIENTE</span>
                                            <span className="client-name">{cliente?.nombreCompleto || servicio?.clienteNombre || servicio?.cliente_nombre || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="client-card-right">
                                        <div className="client-meta-item">
                                            <FiHash size={16} />
                                            <div>
                                                <span className="client-meta-label">N° DE ORDEN</span>
                                                <span className="client-meta-value">#{servicio.servicioNumero || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="client-meta-item">
                                            <FiCalendar size={16} />
                                            <div>
                                                <span className="client-meta-label">FECHA DE INGRESO</span>
                                                <span className="client-meta-value">{new Date(servicio.fechaEntrada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="details-box">
                                    <h3 className="details-box-title">
                                        <FiFileText size={18} /> Estado de tu Equipo
                                    </h3>
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <FiCalendar size={18} />
                                        </div>
                                        <div className="detail-content">
                                            <span className="detail-label">Fecha de Ingreso</span>
                                            <span className="detail-value">{new Date(servicio.fechaEntrada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <FiTool size={18} />
                                        </div>
                                        <div className="detail-content">
                                            <span className="detail-label">Equipo</span>
                                            <span className="detail-value">{servicio.marcaProducto} {servicio.modeloProducto} ({servicio.tipoEquipo})</span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <FiActivity size={18} />
                                        </div>
                                        <div className="detail-content">
                                            <span className="detail-label">Estado Actual</span>
                                            <span className="detail-value">
                                                <span className={`current-status-label ${servicio.estado}`}>{ESTADO_DISPLAY[servicio.estado] || servicio.estado}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <FiHash size={18} />
                                        </div>
                                        <div className="detail-content">
                                            <span className="detail-label">N° de Orden</span>
                                            <span className="detail-value">#{servicio.servicioNumero || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <FiDollarSign size={18} />
                                        </div>
                                        <div className="detail-content">
                                            <span className="detail-label">Presupuesto Total</span>
                                            <span className="detail-value">${formatNumber(servicio.presupuesto?.total) || 'Pendiente'}</span>
                                        </div>
                                    </div>
                                    {servicio.fallaReportada && (
                                        <div className="detail-row">
                                            <div className="detail-icon">
                                                <FiAlertTriangle size={18} />
                                            </div>
                                            <div className="detail-content">
                                                <span className="detail-label">Falla Reportada</span>
                                                <span className="detail-value">{servicio.fallaReportada}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(servicio?.estado === 'notificacion' || servicio?.notificacion || servicio?.sinSolucion) && (
                                    <div className="seguimiento-notificacion-box">
                                        <div className="notif-icon">⚠️</div>
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
                                                            <div className="notif-meta">
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
                                            <FiFileText size={18} /> Ver Presupuesto
                                        </button>
                                    )}
                                    <button className="btn-secondary" onClick={() => {
                                        const tel = cliente?.telefono || cliente?.celular || '';
                                        if (tel) {
                                            const num = tel.replace(/\D/g, '');
                                            window.open(`https://wa.me/${num}`, '_blank');
                                        } else {
                                            Swal.fire('Contacto', 'Datos de contacto no disponibles', 'info');
                                        }
                                    }}>
                                        <FiUser size={18} /> Contactar Taller
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

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
        </div>
    );
}

export default ConsultaServicio;
