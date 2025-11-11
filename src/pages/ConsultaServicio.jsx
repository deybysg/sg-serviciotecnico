import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { shortId, toIdString } from '../utils/id';
import Swal from 'sweetalert2';
import './ConsultaServicio.css'; 

// =================================================================
// FUNCIÓN DE UTILIDAD PARA EL FORMATO DE MILES
// =================================================================
/**
 * Formatea un número para usar separador de miles (punto) y decimales (coma).
 * @param {number} value - El valor numérico a formatear.
 * @returns {string} El valor formateado o 'Pendiente'.
 */
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

// Opciones de estado mapeadas al flujo del taller
const PASOS = {
    P1_RECIBIDO: 'pendiente', 
    P2_EN_REVISION: 'enRevision',
    P3_DIAGNOSTICO: 'diagnostico',
    P4_REPARACION: 'reparacion',
    P5_TERMINADO: 'terminado', 
    P6_ENTREGADO: 'entregado'
};

// Descripciones detalladas para el cliente
const ESTADO_DISPLAY = {
    pendiente: "Equipo Recibido (Esperando ser Revisado)",
    enRevision: "En Revisión Inicial / Diagnóstico", 
    diagnostico: "Diagnóstico Finalizado / Presupuesto Generado",
    presupuestoPendiente: "Presupuesto Generado (Esperando Aprobación del Cliente)",
    reparacion: "En Proceso de Reparación Activa",
    revisionTerminada: "En Reparación", // Típicamente un estado transitorio o interno
    terminado: "Listo para Retirar",
    entregado: "Servicio Entregado y Cerrado",
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
    
    // Usamos useCallback para que la función fetchServicio no cambie
    // en cada render y pueda usarse en los useEffect de forma segura.
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
            
            // Si es un número de 3-5 dígitos, buscar por servicioNumero directamente
            if (/^\d{3,5}$/.test(candidate)) {
                // Consulta pública: no requiere autenticación
                const dataServicio = await api.get(`/seguimiento/${candidate}`, false);
                setServicio(dataServicio);
                
                // Cargar cliente desde respuesta (ruta pública ya devuelve cliente básico)
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

    // 1. useEffect inicial: Carga el servicio si viene en la URL
    useEffect(() => {
        if (urlId) {
            setSearchId(urlId);
            fetchServicio(urlId);
        }
    }, [urlId, fetchServicio]); // fetchServicio es ahora una dependencia estable

    // 2. useEffect de Polling: Actualización periódica
    useEffect(() => {
        // Solo hacemos polling si tenemos un servicio y no está cerrado
        if (servicio && servicio.estado !== PASOS.P6_ENTREGADO) {
            
            // Intervalo de 15 segundos (15000 ms)
            const intervalId = setInterval(() => {
                    // Usamos el número de servicio para la búsqueda
                    const sid = servicio.servicioNumero;
                    if (sid) {
                        fetchServicio(sid);
                    }
            }, 10000); 

            // Función de limpieza: CLAVE para evitar fugas de memoria
            return () => {
                clearInterval(intervalId);
            };
        }
        
        // Si no hay servicio o ya está entregado, retornamos una función vacía
        return () => {}; 
        
    }, [servicio, fetchServicio]); // Se re-ejecuta si el servicio o fetchServicio cambian

    // 3. useEffect: Resetea el detalle del presupuesto al cerrar el modal
    useEffect(() => {
        if (!showPresupuestoModal) {
            setShowBudgetDetails(false);
        }
    }, [showPresupuestoModal]);


    // Manejador del formulario (botón o tecla Enter)
    const handleSearch = (e) => {
        e.preventDefault();
        
        const finalId = searchId.trim();
        if (!finalId) {
            Swal.fire("Atención", "Ingrese un número de servicio.", "warning");
            return;
        }

        // Validar que sea un número de 3-5 dígitos
        if (!/^\d{3,5}$/.test(finalId)) {
            Swal.fire("Atención", "Ingrese un número válido de 3 a 5 dígitos.", "warning");
            return;
        }

        // Redirige a la URL con el ID para disparar el primer useEffect
        navigate(`/seguimiento/${finalId}`);
    };
    
    // Función para salir y volver a la ruta base de búsqueda 
    const handleExit = () => {
        setServicio(null); 
        setSearchId('');
        navigate('/seguimiento', { replace: true }); // Vuelve a la ruta sin ID
    };

    // Lógica para determinar si un paso de la línea de tiempo está activo (4 pasos visibles)
    const isStepActive = (targetStep) => {
        const estadoActual = servicio?.estado;
        if (!estadoActual) return false;

        // Orden de todos los estados posibles para determinar el progreso
        const order = [
            PASOS.P1_RECIBIDO,         // 0
            PASOS.P2_EN_REVISION,      // 1
            PASOS.P3_DIAGNOSTICO,      // 2
            'presupuestoPendiente',    // 3
            PASOS.P4_REPARACION,       // 4
            'revisionTerminada',       // 5
            PASOS.P5_TERMINADO,        // 6
            PASOS.P6_ENTREGADO         // 7
        ];
        
        const currentIndex = order.indexOf(estadoActual);

        // Mapeo de los 4 pasos visibles a sus índices de activación en la 'order'
        const activationIndexMap = {
            'P1_RECIBIDO': order.indexOf(PASOS.P1_RECIBIDO),
            // P2_DIAGNOSTICO se activa con enRevision, diagnostico y presupuestoPendiente
            'P2_DIAGNOSTICO': order.indexOf(PASOS.P2_EN_REVISION),
            // P3_REPARACION se activa con reparacion y revisionTerminada
            'P3_REPARACION': order.indexOf(PASOS.P4_REPARACION),
            // P4_TERMINADO se activa con terminado y entregado
            'P4_TERMINADO': order.indexOf(PASOS.P5_TERMINADO),
        };
        
        const targetIndex = activationIndexMap[targetStep];

        // El paso está activo si el estado actual está en ese punto o más allá.
        return currentIndex >= targetIndex;
    };
    
    // Determinar el ícono principal basado en el estado
    const getStatusIcon = (estado) => {
        if (estado === PASOS.P6_ENTREGADO) return { icon: "✅", class: "entregado-bg" };
        if (isStepActive('P4_TERMINADO')) return { icon: "🎁", class: "listo-bg" };
        if (isStepActive('P3_REPARACION')) return { icon: "🔧", class: "reparacion-bg" };
        if (isStepActive('P2_DIAGNOSTICO')) return { icon: "🔬", class: "diagnostico-bg" };
        if (isStepActive('P1_RECIBIDO')) return { icon: "📄", class: "recibido-bg" };
        return { icon: "❓", class: "default-bg" };
    };

    const currentIcon = getStatusIcon(servicio?.estado);

    // Determina si estamos en modo de visualización de resultados
    const isViewingResult = servicio && !loading && !error;


    // Renderizado del componente
    return (
        <div className="consulta-servicio-full">
            <header className="mobile-header">
                <span className="logo">SG Servicio Técnico</span>
                {/* BOTÓN SALIR / BOTÓN CONFIGURACIÓN */}
                {isViewingResult ? (
                    <button className="settings-button exit-button" onClick={handleExit}>
                        Salir 🚪
                    </button>
                ) : (
                    <button className="settings-button">⚙️</button>
                )}
            </header>

            <div className="consulta-servicio-container">
                <h1 className="title-bold">Estado de tu Equipo</h1>

                {/* Formulario de Búsqueda (Visible si no hay ID o si hay error) */}
                {(!urlId || error || !isViewingResult) && (
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="Ingresa el número de tu servicio (ej: 100)"
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
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>
                )}
                
                {/* Mensajes de Estado */}
                {loading && <div className="status-message">Cargando detalles...</div>}
                {error && <div className="error-message">{error}</div>}
                

                {/* Resultado del Servicio (Si hay datos) */}
                {isViewingResult && (
                    <>
                        <div className="status-icon-container">
                            <div className={`status-icon ${currentIcon.class}`}>
                                <span role="img" aria-label="Status Icon">{currentIcon.icon}</span>
                            </div>
                        </div>

                        {/* LINEA DE TIEMPO (PROGRESS BAR) - 4 Pasos Visibles */}
                        <div className="timeline-container four-steps"> 
                            
                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P1_RECIBIDO') ? 'active' : ''}`}></div>
                                <span className="timeline-label">Recibido</span>
                            </div>

                            <div className={`timeline-line ${isStepActive('P2_DIAGNOSTICO') ? 'line-active' : ''}`}></div>

                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P2_DIAGNOSTICO') ? 'active' : ''}`}>
                                    {isStepActive('P2_DIAGNOSTICO') && <span role="img" aria-label="Microscope">🔬</span>}
                                </div>
                                <span className="timeline-label">Diagnóstico</span>
                            </div>
                            
                            <div className={`timeline-line ${isStepActive('P3_REPARACION') ? 'line-active' : ''}`}></div>

                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P3_REPARACION') ? 'active' : ''}`}>
                                    {isStepActive('P3_REPARACION') && <span role="img" aria-label="Wrench">🔧</span>}
                                </div>
                                <span className="timeline-label">Reparación</span>
                            </div>

                            <div className={`timeline-line ${isStepActive('P4_TERMINADO') ? 'line-active' : ''}`}></div>

                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P4_TERMINADO') ? 'active' : ''}`}>
                                    {isStepActive('P4_TERMINADO') && <span role="img" aria-label="Gift Box">🎁</span>}
                                </div>
                                <span className="timeline-label">Listo Retirar</span>
                            </div>
                        </div>
                        {/* FIN LINEA DE TIEMPO */}


                        <div className="details-box">
                            <p><strong>Cliente:</strong> {cliente?.nombreCompleto || 'N/A'}</p>
                            <p><strong>Equipo:</strong> {servicio.marcaProducto} ({servicio.tipoServicio})</p>
                            <p><strong>N° de Orden:</strong> {servicio.servicioNumero || 'N/A'}</p>
                            <p><strong>Estado Actual:</strong> <span className={`current-status-label ${servicio.estado}`}>{ESTADO_DISPLAY[servicio.estado] || servicio.estado}</span></p>
                            <p><strong>Fecha Ingreso:</strong> {new Date(servicio.fechaEntrada).toLocaleDateString()}</p>
                            {/* Presupuesto Total en la vista principal */}
                            <p><strong>Presupuesto Total:</strong> ${formatNumber(servicio.presupuesto?.total) || 'Pendiente'}</p>
                        </div>

                        <div className="action-buttons">
                            {(servicio.presupuesto?.total > 0 || servicio.estado === 'presupuestoPendiente') && (
                                <button className="btn-primary-outline" onClick={() => setShowPresupuestoModal(true)}>
                                    Ver Presupuesto
                                </button>
                            )}
                            
                            <button className="btn-secondary" onClick={() => Swal.fire('Contacto', cliente?.telefono ? `Llamar a ${cliente.telefono}` : 'Datos de contacto no disponibles', 'info')}>
                                Contactar Taller
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Presupuesto */}
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