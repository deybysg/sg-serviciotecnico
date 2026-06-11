import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import ModalDetalles from "./ModalDetalles";
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Paneltrabajos.css';
import { FiEye, FiClipboard, FiUser, FiPhone, FiTool, FiTruck, FiBell, FiClock, FiSearch, FiCheckCircle } from 'react-icons/fi';
import logoTech from '../assets/logo3.png';

const ESTADO_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "enRevision", label: "En Revisión" },
  { value: "revisionTerminada", label: "En Reparacion" },
  { value: "terminado", label: "Listo para Entrega" },
  { value: "entregado", label: "Entregado" },
];

const getEstadoLabel = (value) => {
  return ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
};

const getEstadoIcon = (value) => {
  switch (value) {
    case 'pendiente':
      return <FiClock />;
    case 'enRevision':
      return <FiTool />;
    case 'revisionTerminada':
      return <FiTool />;
    case 'terminado':
      return <FiTruck />;
    case 'entregado':
      return <FiCheckCircle />;
    default:
      return <FiBell />;
  }
};

const getClienteName = (clienteId, clientes) => {
  // Si clienteId es un objeto (viene populado del backend)
  if (typeof clienteId === 'object' && clienteId !== null) {
    return clienteId.nombreCompleto || "Cliente Desconocido";
  }
  
  // Si es un ID, buscar en el array de clientes
  const cliente = clientes.find(c => String(c._id || c.id) === String(clienteId));
  return cliente?.nombreCompleto || "Cliente Desconocido";
};

// Helper para mostrar IDs cortos en la UI (últimos 8 caracteres)
const shortId = (id, length = 8) => String(id || "").slice(-length).toUpperCase();
// Formatear/mostrar el número de servicio (3 dígitos) cuando exista
const formatServicioNumero = (num) => (num !== undefined && num !== null && num !== "") ? String(num).padStart(3, '0') : null;

const PanelTrabajo = () => {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [visibleTooltipId, setVisibleTooltipId] = useState(null);
  const tooltipTimer = useRef(null);
  const [estadoMenuAbiertoId, setEstadoMenuAbiertoId] = useState(null);
  const [estadoFocusIndex, setEstadoFocusIndex] = useState(0);

  const navigate = useNavigate(); // 👈 2. Declarar useNavigate

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [serviciosData, clientesData] = await Promise.all([
        api.get('/servicios'),
        api.get('/clientes'),
      ]);

      setServicios(serviciosData);
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al cargar datos del panel:", error);
      Swal.fire({
        icon: "error",
        title: "Error", 
        text: error.message || "No se pudieron cargar los servicios o clientes.",
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const serviciosActivos = servicios.filter(
    (servicio) => !servicio.fechaSalida && servicio.estado !== "entregado"
  );

  const serviciosOrdenados = serviciosActivos.sort(
    (a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada)
  );

  // Cálculo de Conteos por Estado (se mantiene)
  const conteosEstado = useMemo(() => {
    const counts = {
      todos: serviciosActivos.length,
      pendiente: 0,
      enRevision: 0,
      enReparacion: 0, // mapea a 'revisionTerminada'
      listoParaEntrega: 0, // mapea a 'terminado'
    };

    serviciosActivos.forEach(servicio => {
      if (servicio.estado === "pendiente") {
        counts.pendiente++;
      } else if (servicio.estado === "enRevision") {
        counts.enRevision++;
      } else if (servicio.estado === "revisionTerminada") {
        counts.enReparacion++;
      } else if (servicio.estado === "terminado") {
        counts.listoParaEntrega++;
      }
    });

    return counts;
  }, [serviciosActivos]);

  // Lógica de filtrado (se mantiene)
  const serviciosFiltrados = serviciosOrdenados.filter((s) => {
    const query = searchQuery.toLowerCase();
    // Manejar tanto cliente populado como clienteId
    const clienteData = s.cliente || s.clienteId;
    const clienteNombre = getClienteName(clienteData, clientes).toLowerCase();
    const servicioId = String(s._id || s.id);
    const servicioIdCorto = shortId(servicioId).toLowerCase();
    const servicioNumeroStr = String(s.servicioNumero || "").toLowerCase();
    const coincideBusqueda =
      servicioId.includes(query) || servicioIdCorto.includes(query) || servicioNumeroStr.includes(query) || clienteNombre.includes(query);

    let coincideFiltro = true;
    if (filtroEstado !== "todos") {
      switch (filtroEstado) {
        case "pendiente":
          coincideFiltro = s.estado === "pendiente";
          break;
        case "enRevision":
          coincideFiltro = s.estado === "enRevision";
          break;
        case "enReparacion":
          coincideFiltro = s.estado === "revisionTerminada";
          break;
        case "listoParaEntrega":
          coincideFiltro = s.estado === "terminado";
          break;
        default:
          coincideFiltro = true;
          break;
      }
    }
    return coincideBusqueda && coincideFiltro;
  });
  // Las funciones handleVerDetalles y handleGuardarEdicion se mantienen...
  const handleVerDetalles = (servicio) => {
    setServicioSeleccionado(servicio);
    setModalOpen(true);
  };

  const handleCopyId = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      Toast.fire({ icon: 'success', title: 'ID copiado al portapapeles' });
    } catch (e) {
      console.error('No se pudo copiar el ID', e);
    }
  };

  // Tooltip handlers: show on enter, hide 2s after leave
  const handleTooltipEnter = (id) => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    setVisibleTooltipId(id);
  };

  const handleTooltipLeave = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => {
      setVisibleTooltipId(null);
      tooltipTimer.current = null;
    }, 500); // mantener 500ms antes de ocultar
  };

  useEffect(() => {
    return () => {
      if (tooltipTimer.current) {
        clearTimeout(tooltipTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (estadoMenuAbiertoId && !e.target.closest('.dropdown-estado')) {
        setEstadoMenuAbiertoId(null);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [estadoMenuAbiertoId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setEstadoMenuAbiertoId(null);
        return;
      }
      if (!estadoMenuAbiertoId) return;
      const lastIndex = ESTADO_OPTIONS.length - 1;
      if (e.key === 'ArrowDown') {
        setEstadoFocusIndex((i) => (i < lastIndex ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        setEstadoFocusIndex((i) => (i > 0 ? i - 1 : lastIndex));
      } else if (e.key === 'Enter') {
        const opt = ESTADO_OPTIONS[Math.max(0, Math.min(lastIndex, estadoFocusIndex))];
        if (opt) {
          const servicioIdOpen = estadoMenuAbiertoId;
          setEstadoMenuAbiertoId(null);
          handleCambiarEstado(servicioIdOpen, opt.value);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [estadoMenuAbiertoId, estadoFocusIndex]);

  const handleGuardarEdicion = async (idServicio, datosEditados) => {
    try {
      await api.put(`/servicios/${idServicio}`, datosEditados);

      // Toast notification
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: 'success',
        title: '✅ Servicio actualizado exitosamente'
      });
      
      cargarDatos();
      setModalOpen(false);
    } catch (error) {
      console.error("Error al guardar edición:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo guardar la edición.",
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Función para cambiar el estado desde el select en cada tarjeta
  const handleCambiarEstado = async (idServicio, nuevoEstado) => {
    // Pedir confirmación antes de aplicar el cambio
    const estadoLabel = getEstadoLabel(nuevoEstado);
    const confirm = await Swal.fire({
      title: 'Confirmar cambio de estado',
      text: `¿Deseas cambiar el estado a "${estadoLabel}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
    });

    if (!confirm.isConfirmed) {
      // Si cancela, no hacer nada (el select mostrará el valor controlado actual)
      return;
    }

    try {
      const datosActualizados = { estado: nuevoEstado };
      // Si se marca como entregado, agregar fechaSalida
      if (nuevoEstado === 'entregado') {
        datosActualizados.fechaSalida = new Date().toISOString();
      }

      await api.put(`/servicios/${idServicio}`, datosActualizados);

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: 'success',
        title: 'Estado actualizado'
      });

      // Refrescar datos
      cargarDatos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo actualizar el estado.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // 🚨 Función de Entrega modificada para redirigir 🚨
  const handleEntregarServicio = async (idServicio) => {
    const confirm = await Swal.fire({
      title: "¿Confirmar Entrega?",
      text: "El servicio se marcará como 'Entregado' y se moverá al Historial.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: "Sí, Entregar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const fechaSalida = new Date().toISOString();
    const datosActualizados = {
      fechaSalida,
      estado: "entregado",
    };

    try {
      await api.put(`/servicios/${idServicio}`, datosActualizados);

      // Toast notification
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: 'success',
        title: '✅ ¡Servicio entregado exitosamente!'
      });
      
      cargarDatos();
      
      // Redirigir al historial después del éxito (opcional)
      // navigate('/admin/historial'); 
      
    } catch (error) {
      console.error("Error al completar la entrega:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo completar la entrega.",
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Botón en tarjeta: marcar equipo como sin solución y notificar al cliente
  const handleMarcarNotificacion = async (servicio) => {
    const { value: motivo, isConfirmed } = await Swal.fire({
      title: 'notificar al cliente',
      input: 'textarea',
      inputLabel: 'Detalle / motivo que se enviará al cliente',
      inputPlaceholder: 'Escribe aquí el detalle que quieres notificar al cliente...',
      inputAttributes: {
        'aria-label': 'Detalle para el cliente'
      },
      showCancelButton: true,
      confirmButtonText: 'Notificar y marcar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981'
    });

    if (!isConfirmed) return;

    // Construir mensaje por defecto si el admin confirma sin escribir texto
    const textoMotivo = (motivo || '').toString().trim();
    let mensajeFinal = textoMotivo;
    if (!mensajeFinal) {
      if (servicio?.tipoServicio === 'celulares') {
        mensajeFinal = 'El teléfono no tiene solución.';
      } else {
        mensajeFinal = 'El equipo no tiene solución.';
      }
      // Adjuntar marca/modelo si está disponible
      if (servicio?.marcaProducto) {
        mensajeFinal += ` (${servicio.marcaProducto})`;
      }
    }

    const payload = {
      mensaje: mensajeFinal,
      tipo: 'notificacion',
      autor: 'taller',
      // Mantener la propiedad histórica para compatibilidad en el backend
      marcarSinSolucion: true,
      // Nueva propiedad clara para futuras integraciones
      marcarNotificacion: true
    };

    try {
      const idServicio = servicio._id || servicio.id;

      // Agregar entrada de seguimiento; el backend actualizará también el estado/detalle cuando corresponda
      await api.patch(`/servicios/${idServicio}/seguimiento`, payload);

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({ icon: 'success', title: 'Notificado al cliente y agregado a seguimiento' });
      cargarDatos();
    } catch (error) {
      console.error('Error al notificar al cliente:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo notificar al cliente.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  if (isLoading) return (
    <div className="panel-loading">
      <div className="tech-loader">
        <img src={logoTech} alt="Logo" className="logo-spin" style={{ width: 60, marginBottom: 16 }} />
        <span>Cargando Panel de Trabajo...</span>
      </div>
    </div>
  );

  const statusColumns = [
    { key: 'pendiente', filter: 'pendiente', label: 'Pendiente', count: conteosEstado.pendiente, icon: <FiClock /> },
    { key: 'enRevision', filter: 'enRevision', label: 'En Revisión', count: conteosEstado.enRevision, icon: <FiTool /> },
    { key: 'revisionTerminada', filter: 'enReparacion', label: 'En Reparación', count: conteosEstado.enReparacion, icon: <FiTool /> },
    { key: 'terminado', filter: 'listoParaEntrega', label: 'Listo para Entregar', count: conteosEstado.listoParaEntrega, icon: <FiCheckCircle /> },
    { key: 'entregado', filter: 'entregado', label: 'Entregado', count: servicios.filter((s) => s.estado === 'entregado').length, icon: <FiCheckCircle /> },
  ];

  const trabajosAltaPrioridad = serviciosActivos.filter((s) => s.estado === 'terminado' || s.estado === 'revisionTerminada').length;
  const trabajosPendientesViejos = serviciosActivos.filter((s) => {
    if (!s.fechaEntrada || s.estado !== 'pendiente') return false;
    const diffDays = (Date.now() - new Date(s.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  }).length;

  const formatFechaPanel = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-AR') : '—';
  const getEquipoPanel = (servicio) => [servicio.marcaProducto, servicio.modeloProducto].filter(Boolean).join(' ') || servicio.tipoServicio || 'Equipo sin nombre';
  const getDetallePanel = (servicio) => servicio.detalles || servicio.detalle || servicio.tipoServicio || 'Servicio técnico';

  return (
    <div className="panel-trabajo-container tech-bg workboard-page">
      <section className="workboard-shell">
        <header className="workboard-header">
          <div>
            <h1>Panel de Trabajo</h1>
            <p>Gestiona y controla todos los trabajos de servicio técnico desde un solo lugar.</p>
          </div>
          <div className="workboard-actions">
            <button className="workboard-primary-btn" onClick={() => navigate('/admin/servicios')}>
              <span>+</span> Nuevo Trabajo
            </button>
            <button className="workboard-icon-btn" aria-label="Alertas">
              <FiBell />
              {(trabajosAltaPrioridad + trabajosPendientesViejos) > 0 && <strong>{trabajosAltaPrioridad + trabajosPendientesViejos}</strong>}
            </button>
          </div>
        </header>

        <section className="workboard-summary">
          <article className="summary-card featured">
            <span className="summary-icon"><FiClipboard /></span>
            <div>
              <p>Total Trabajos</p>
              <strong>{serviciosActivos.length}</strong>
              <small>Este mes</small>
            </div>
          </article>
          <article className="summary-card warning">
            <span className="summary-icon"><FiClock /></span>
            <div><p>Pendientes</p><strong>{conteosEstado.pendiente}</strong><small>{serviciosActivos.length ? Math.round((conteosEstado.pendiente / serviciosActivos.length) * 100) : 0}% del total</small></div>
          </article>
          <article className="summary-card cyan">
            <span className="summary-icon"><FiTool /></span>
            <div><p>En Revisión</p><strong>{conteosEstado.enRevision}</strong><small>{serviciosActivos.length ? Math.round((conteosEstado.enRevision / serviciosActivos.length) * 100) : 0}% del total</small></div>
          </article>
          <article className="summary-card purple">
            <span className="summary-icon"><FiTool /></span>
            <div><p>En Reparación</p><strong>{conteosEstado.enReparacion}</strong><small>{serviciosActivos.length ? Math.round((conteosEstado.enReparacion / serviciosActivos.length) * 100) : 0}% del total</small></div>
          </article>
          <article className="summary-card amber">
            <span className="summary-icon"><FiCheckCircle /></span>
            <div><p>Listo para Entregar</p><strong>{conteosEstado.listoParaEntrega}</strong><small>{serviciosActivos.length ? Math.round((conteosEstado.listoParaEntrega / serviciosActivos.length) * 100) : 0}% del total</small></div>
          </article>
          <article className="alerts-card">
            <h2>Alertas <span>{trabajosAltaPrioridad + trabajosPendientesViejos}</span></h2>
            <p><FiBell /> {trabajosAltaPrioridad} trabajos con alta prioridad</p>
            <p><FiClock /> {trabajosPendientesViejos} trabajos pendientes por más de 3 días</p>
            <button onClick={() => setFiltroEstado('todos')}>Ver todas</button>
          </article>
        </section>

        <section className="workboard-filters">
          <label className="workboard-search">
            <input
              type="text"
              placeholder="Buscar por cliente, dispositivo, IMEI, número de orden..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch />
          </label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Estado: Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="enRevision">En Revisión</option>
            <option value="enReparacion">En Reparación</option>
            <option value="listoParaEntrega">Listo para Entregar</option>
          </select>
          <button className="workboard-filter-btn" onClick={() => { setFiltroEstado('todos'); setSearchQuery(''); }}>
            <FiSearch /> Filtros
          </button>
        </section>

        <section className="workboard-kanban">
          {statusColumns.map((column) => {
            const sourceItems = column.key === 'entregado'
              ? servicios.filter((servicio) => servicio.estado === 'entregado')
              : serviciosFiltrados;
            const columnItems = sourceItems.filter((servicio) => servicio.estado === column.key).slice(0, 3);
            return (
              <article className={`kanban-column column-${column.key}`} key={column.key}>
                <button className="kanban-title" onClick={() => setFiltroEstado(column.filter)}>
                  <span>{column.icon}</span>
                  {column.label}
                  <strong>{column.count}</strong>
                </button>
                <div className="kanban-items">
                  {columnItems.length === 0 ? (
                    <p className="kanban-empty">Sin trabajos en este estado.</p>
                  ) : columnItems.map((servicio) => {
                    const clienteData = servicio.cliente || servicio.clienteId;
                    const clienteNombre = getClienteName(clienteData, clientes);
                    const servicioId = servicio._id || servicio.id;
                    const numero = servicio.servicioNumero ? `#TFX-${formatServicioNumero(servicio.servicioNumero)}` : `#TFX-${shortId(servicioId, 6)}`;
                    return (
                      <div className="kanban-card" key={servicioId}>
                        <div className="kanban-card-top">
                          <button className="kanban-id" onClick={() => handleCopyId(servicio.servicioNumero ? formatServicioNumero(servicio.servicioNumero) : servicioId)}>{numero}</button>
                          <span className="priority-pill">{servicio.estado === 'pendiente' ? 'Alta Prioridad' : servicio.estado === 'revisionTerminada' ? 'Media Prioridad' : 'Baja Prioridad'}</span>
                        </div>
                        <h3>{getEquipoPanel(servicio)}</h3>
                        <p>{getDetallePanel(servicio)}</p>
                        <p>Cliente: {clienteNombre}</p>
                        <p>{servicio.fechaSalida ? 'Entrega' : 'Ingreso'}: {formatFechaPanel(servicio.fechaSalida || servicio.fechaEntrada)}</p>
                        <div className="kanban-card-actions">
                          <div className="dropdown-estado">
                            <button
                              type="button"
                              className={`estado-trigger estado-${servicio.estado} modern-estado-btn`}
                              aria-haspopup="listbox"
                              aria-expanded={estadoMenuAbiertoId === servicioId}
                              onClick={() => {
                                const open = estadoMenuAbiertoId === servicioId ? null : servicioId;
                                setEstadoMenuAbiertoId(open);
                                if (open) {
                                  const idx = ESTADO_OPTIONS.findIndex((o) => o.value === servicio.estado);
                                  setEstadoFocusIndex(idx >= 0 ? idx : 0);
                                }
                              }}
                            >
                              <span className="estado-ico">{getEstadoIcon(servicio.estado)}</span>
                              <span className="estado-label">{getEstadoLabel(servicio.estado)}</span>
                            </button>
                            {estadoMenuAbiertoId === servicioId && (
                              <ul className="estado-menu" role="listbox">
                                {ESTADO_OPTIONS.map((opt, idx) => (
                                  <li
                                    key={opt.value}
                                    role="option"
                                    aria-selected={opt.value === servicio.estado}
                                    className={`estado-option ${opt.value === servicio.estado ? 'selected' : ''} ${idx === estadoFocusIndex ? 'focused' : ''} estado-${opt.value}`}
                                    onClick={() => { setEstadoMenuAbiertoId(null); handleCambiarEstado(servicioId, opt.value); }}
                                  >
                                    <span className="estado-ico">{getEstadoIcon(opt.value)}</span>
                                    <span className="estado-label">{opt.label}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <button className="detail-link" onClick={() => handleVerDetalles(servicio)}>Ver detalle</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="kanban-see-all" onClick={() => setFiltroEstado(column.filter)}>Ver todos ({column.count})</button>
              </article>
            );
          })}
        </section>
      </section>
      {modalOpen && servicioSeleccionado && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, margin: 'auto', padding: 24 }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}
              aria-label="Cerrar modal"
            >
              &times;
            </button>
            <h3>Detalle de Servicio</h3>
            <div style={{ marginBottom: 16 }}>
              <strong>Orden:</strong> {servicioSeleccionado.servicioNumero ? `#${formatServicioNumero(servicioSeleccionado.servicioNumero)}` : shortId(servicioSeleccionado._id || servicioSeleccionado.id)}<br />
              <strong>Estado:</strong> {getEstadoLabel(servicioSeleccionado.estado)}<br />
              <strong>Entrada:</strong> {servicioSeleccionado.fechaEntrada ? new Date(servicioSeleccionado.fechaEntrada).toLocaleString() : '—'}<br />
              <strong>Fecha de Salida:</strong> {servicioSeleccionado.fechaSalida ? new Date(servicioSeleccionado.fechaSalida).toLocaleString() : '—'}<br />
              <hr />
              <strong>Datos del Cliente:</strong><br />
              {(() => {
                const clienteObj = typeof servicioSeleccionado.cliente === 'object' && servicioSeleccionado.cliente !== null
                  ? servicioSeleccionado.cliente
                  : clientes.find(c => String(c._id || c.id) === String(servicioSeleccionado.clienteId));
                if (!clienteObj) return <span>Cliente no encontrado</span>;
                return (
                  <div style={{ marginBottom: 8 }}>
                    <div><strong>Nombre:</strong> {clienteObj.nombreCompleto}</div>
                    <div><strong>Teléfono:</strong> {clienteObj.telefono || '—'}</div>
                    <div><strong>Email:</strong> {clienteObj.email || '—'}</div>
                    <div><strong>DNI:</strong> {clienteObj.dni || '—'}</div>
                    <div><strong>Dirección:</strong> {clienteObj.direccion || '—'}</div>
                  </div>
                );
              })()}
              <hr />
              <strong>Datos del Producto:</strong><br />
              <div style={{ marginBottom: 8 }}>
                <div><strong>Marca:</strong> {servicioSeleccionado.marcaProducto || '—'}</div>
                <div><strong>Modelo:</strong> {servicioSeleccionado.modeloProducto || '—'}</div>
                <div><strong>Tipo de Servicio:</strong> {servicioSeleccionado.tipoServicio || '—'}</div>
                <div><strong>Detalles:</strong> {servicioSeleccionado.detalles || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-sinsolucion" onClick={() => { setModalOpen(false); handleMarcarNotificacion(servicioSeleccionado); }}>Notificar</button>
              <button className="btn-entregar" onClick={() => { setModalOpen(false); handleEntregarServicio(servicioSeleccionado._id || servicioSeleccionado.id); }}>Entregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelTrabajo;
