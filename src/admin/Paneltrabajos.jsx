import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import ModalDetalles from "./ModalDetalles";
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Paneltrabajos.css';
import { FiEye, FiClipboard, FiUser, FiPhone, FiTool, FiTruck, FiBell, FiClock, FiSearch, FiCheckCircle, FiSmartphone, FiTag, FiCalendar, FiHash, FiDollarSign } from 'react-icons/fi';
import logoTech from '../assets/logo3.png';
import { ESTADO_OPTIONS, getEstadoLabel, TIPO_SERVICIO_OPTIONS } from '../constants';

const getTipoLabel = (value) => TIPO_SERVICIO_OPTIONS.find(o => o.value === value)?.label || value;

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
    case 'notificacion':
      return <FiBell />;
    case 'entregado':
      return <FiCheckCircle />;
    default:
      return <FiBell />;
  }
};

const getClienteName = (clienteId, clientes) => {
  // Si clienteId es un objeto (viene populado del backend)
  if (typeof clienteId === 'object' && clienteId !== null) {
    if (clienteId.nombreCompleto) return clienteId.nombreCompleto;
    // Si es un ObjectId u otro objeto, convertir a string para buscar
    clienteId = String(clienteId);
  }

  if (!clienteId || clienteId === 'null' || clienteId === 'undefined') return "Cliente Desconocido";

  // Si es un ID, buscar en el array de clientes
  const cliente = clientes.find(c => String(c._id || c.id) === String(clienteId));
  return cliente?.nombreCompleto || "Cliente Desconocido";
};

// Normaliza propiedades snake_case a camelCase para compatibilidad entre MongoDB y PostgreSQL
function normalizeCliente(c) {
  if (!c) return c;
  const id = c.id || c._id;
  return {
    id: id,
    _id: id,
    nombreCompleto: c.nombre_completo || c.nombreCompleto || '',
    celular: c.celular || '',
    correo: c.correo || c.email || '',
    direccion: c.direccion || '',
    dni: c.dni || '',
    serviciosRealizados: c.servicios_realizados || c.serviciosRealizados || [],
    createdAt: c.created_at || c.createdAt,
    updatedAt: c.updated_at || c.updatedAt,
  };
}

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
    cliente: clienteId, // compatibilidad con código que usa s.cliente
    tipoEquipo: s.tipo_equipo ?? s.tipoEquipo,
    marcaProducto: s.marca_producto ?? s.marcaProducto,
    modeloProducto: s.modelo_producto ?? s.modeloProducto,
    tipoServicio: s.tipo_servicio ?? s.tipoServicio,
    fallaReportada: s.falla_reportada ?? s.fallaReportada,
    asunto: s.asunto,
    detalles: s.detalles,
    notasAdicionales: s.notas_adicionales ?? s.notasAdicionales,
    metodoPago: s.metodo_pago ?? s.metodoPago,
    anticipo: Number(s.anticipo) || 0,
    motivoNotificacion: s.motivo_notificacion ?? s.motivoNotificacion,
    estadoAnterior: s.estado_anterior ?? s.estadoAnterior,
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

// Helper para obtener datos del equipo de forma segura
const getEquipoPanel = (servicio) =>
  [servicio?.marcaProducto, servicio?.modeloProducto].filter(Boolean).join(' ') ||
  servicio?.tipoServicio ||
  'Equipo sin nombre';

// Helper para obtener el detalle del servicio de forma segura
const getDetallePanel = (servicio) =>
  servicio?.detalles ||
  servicio?.detalle ||
  servicio?.tipoServicio ||
  'Servicio técnico';

// Helper para mostrar IDs cortos en la UI (últimos 8 caracteres)
const shortId = (id, length = 8) => String(id || "").slice(-length).toUpperCase();
// Formatear/mostrar el número de servicio (3 dígitos) cuando exista
const formatServicioNumero = (num) => (num !== undefined && num !== null && num !== "") ? String(num).padStart(3, '0') : null;

// Flujo de estados para el stepper (avance lineal)
const FLUJO_ESTADOS = [
  'pendiente',
  'enRevision',
  'revisionTerminada',
  'terminado',
  'entregado'
];

const PanelTrabajo = () => {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("todos"); // 'todos', 'cliente', 'equipo', 'servicio'
  const [modalOpen, setModalOpen] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [visibleTooltipId, setVisibleTooltipId] = useState(null);
  const tooltipTimer = useRef(null);
  const [estadoMenuAbiertoId, setEstadoMenuAbiertoId] = useState(null);
  const [estadoFocusIndex, setEstadoFocusIndex] = useState(0);
  const [vistaModo, setVistaModo] = useState('lista'); // 'kanban' | 'lista'
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showResolverModal, setShowResolverModal] = useState(false);
  const [resolverData, setResolverData] = useState(null);

  const navigate = useNavigate(); // 👈 2. Declarar useNavigate

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [serviciosData, clientesData] = await Promise.all([
        api.get('/servicios'),
        api.get('/clientes'),
      ]);

      const serviciosNormalizados = Array.isArray(serviciosData)
        ? serviciosData.map(normalizeServicio)
        : [];
      const clientesNormalizados = Array.isArray(clientesData)
        ? clientesData.map(normalizeCliente)
        : [];
      setServicios(serviciosNormalizados);
      setClientes(clientesNormalizados);
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
      notificacion: 0,
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
      } else if (servicio.estado === "notificacion") {
        counts.notificacion++;
      }
    });

    return counts;
  }, [serviciosActivos]);

  // Lógica de filtrado mejorada con tipo de búsqueda
  const serviciosFiltrados = serviciosOrdenados.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    let coincideBusqueda = true;

    if (query) {
      // Manejar tanto cliente populado como clienteId
      const clienteData = s.cliente || s.clienteId;
      const clienteNombre = getClienteName(clienteData, clientes).toLowerCase();
      const servicioId = String(s._id || s.id);
      const servicioIdCorto = shortId(servicioId).toLowerCase();
      const servicioNumeroStr = String(s.servicioNumero || "").toLowerCase();
      const equipoStr = getEquipoPanel(s).toLowerCase();
      const servicioStr = (s.tipoServicio || "").toLowerCase();
      const detalleStr = (s.detalles || s.detalle || "").toLowerCase();

      switch (searchType) {
        case "cliente":
          coincideBusqueda = clienteNombre.includes(query);
          break;
        case "equipo":
          coincideBusqueda = equipoStr.includes(query);
          break;
        case "servicio":
          coincideBusqueda = servicioStr.includes(query) || detalleStr.includes(query);
          break;
        case "todos":
        default:
          coincideBusqueda =
            servicioId.includes(query) ||
            servicioIdCorto.includes(query) ||
            servicioNumeroStr.includes(query) ||
            clienteNombre.includes(query) ||
            equipoStr.includes(query) ||
            servicioStr.includes(query) ||
            detalleStr.includes(query);
          break;
      }
    }

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
        case "notificacion":
          coincideFiltro = s.estado === "notificacion";
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
      if (showNotifDropdown && !e.target.closest('.notif-dropdown-container')) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [estadoMenuAbiertoId, showNotifDropdown]);

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
  const handleCambiarEstado = async (idServicio, nuevoEstado, estadoActual) => {
    // Si cambia A notificación, pedir motivo
    if (nuevoEstado === 'notificacion') {
      const { value: motivo, isConfirmed } = await Swal.fire({
        title: 'Motivo de notificación',
        input: 'textarea',
        inputLabel: '¿Qué necesitás notificar al cliente?',
        inputPlaceholder: 'Ej: El equipo no tiene solución, hay que cambiar una pieza, etc.',
        inputAttributes: {
          'aria-label': 'Motivo de notificación'
        },
        showCancelButton: true,
        confirmButtonText: 'Notificar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f59e0b'
      });

      if (!isConfirmed) return;

      const datosActualizados = {
        estado: 'notificacion',
        estadoAnterior: estadoActual,
        motivoNotificacion: motivo || 'Sin motivo especificado'
      };

      try {
        await api.put(`/servicios/${idServicio}`, datosActualizados);

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
        });

        Toast.fire({
          icon: 'success',
          title: 'Notificación enviada al cliente'
        });

        cargarDatos();
      } catch (error) {
        console.error('Error al notificar:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo enviar la notificación.',
          confirmButtonColor: '#3b82f6'
        });
      }
      return;
    }

    // Si sale DE notificación, abrir modal de resolver
    if (estadoActual === 'notificacion') {
      const servicio = servicios.find(s => String(s._id || s.id) === String(idServicio));
      setResolverData({
        id: idServicio,
        estadoAnterior: servicio?.estadoAnterior || 'pendiente',
        fallaReportada: servicio?.fallaReportada || '',
        anticipo: Number(servicio?.anticipo) || 0,
        presupuestoTotal: Number(servicio?.presupuesto?.total) || 0
      });
      setShowResolverModal(true);
      return;
    }

    // Flujo normal de estados
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
      return;
    }

    try {
      const datosActualizados = { estado: nuevoEstado };
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

  const handleResolverSubmit = async () => {
    try {
      const datosActualizados = {
        estado: resolverData.estadoAnterior,
        estadoAnterior: null,
        motivoNotificacion: null,
        fallaReportada: resolverData.fallaReportada,
        anticipo: Math.round(Number(resolverData.anticipo) || 0),
        presupuesto: {
          items: [],
          subtotal: Math.round(Number(resolverData.presupuestoTotal) || 0),
          iva: 0,
          total: Math.round(Number(resolverData.presupuestoTotal) || 0)
        }
      };

      await api.put(`/servicios/${resolverData.id}`, datosActualizados);

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'success',
        title: `Estado restaurado a "${getEstadoLabel(resolverData.estadoAnterior)}"`
      });

      setShowResolverModal(false);
      setResolverData(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al resolver notificación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo resolver la notificación.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // 🚀 Función para avanzar al siguiente estado en el flujo
  const handleAvanzarEstado = async (idServicio, estadoActual) => {
    // Si está en notificación, no puede avanzar
    if (estadoActual === 'notificacion') {
      Swal.fire({
        icon: 'info',
        title: 'Notificación pendiente',
        text: 'Resolvé la notificación primero para continuar con el flujo.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    const idx = FLUJO_ESTADOS.indexOf(estadoActual);
    if (idx === -1 || idx >= FLUJO_ESTADOS.length - 1) return;
    const nuevoEstado = FLUJO_ESTADOS[idx + 1];
    await handleCambiarEstado(idServicio, nuevoEstado, estadoActual);
  };

  // 🚀 Función para retroceder al estado anterior en el flujo
  const handleRetrocederEstado = async (idServicio, estadoActual) => {
    // Si está en notificación, no puede retroceder
    if (estadoActual === 'notificacion') {
      Swal.fire({
        icon: 'info',
        title: 'Notificación pendiente',
        text: 'Resolvé la notificación primero para continuar con el flujo.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    const idx = FLUJO_ESTADOS.indexOf(estadoActual);
    if (idx <= 0) return;
    const nuevoEstado = FLUJO_ESTADOS[idx - 1];
    await handleCambiarEstado(idServicio, nuevoEstado, estadoActual);
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

  // Determinar si hay filtros activos
  const hayFiltrosActivos = searchQuery.trim() !== '' || filtroEstado !== 'todos';

  // Renderizar una tarjeta de servicio (reutilizable)
  const renderTarjetaServicio = (servicio) => {
    const clienteData = servicio.cliente || servicio.clienteId;
    const clienteNombre = getClienteName(clienteData, clientes);
    const servicioId = servicio._id || servicio.id;
    const numero = servicio.servicioNumero ? `#TFX-${formatServicioNumero(servicio.servicioNumero)}` : `#TFX-${shortId(servicioId, 6)}`;
    const equipo = getEquipoPanel(servicio);
    const detalle = getDetallePanel(servicio);
    const fechaIngreso = formatFechaPanel(servicio.fechaEntrada);
    const diasEnTaller = servicio.fechaEntrada ? Math.floor((Date.now() - new Date(servicio.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    return (
      <div className={`kanban-card card-estado-${servicio.estado}`} key={servicioId}>
        {/* HEADER: ID + Prioridad */}
        <div className="kanban-card-header">
          <div className="kanban-card-id">
            <FiHash size={12} />
            <button onClick={() => handleCopyId(servicio.servicioNumero ? formatServicioNumero(servicio.servicioNumero) : servicioId)}>{numero}</button>
          </div>
          <span className={`priority-pill priority-${servicio.estado}`}>
            {servicio.estado === 'notificacion' ? 'Urgente' : servicio.estado === 'pendiente' ? 'Alta' : servicio.estado === 'revisionTerminada' ? 'Media' : 'Normal'}
          </span>
        </div>

        {/* BODY: Cliente */}
        <div className="kanban-card-section">
          <div className="section-icon"><FiUser /></div>
          <div className="section-content">
            <span className="section-label">Cliente</span>
            <span className="section-value">{clienteNombre}</span>
          </div>
        </div>

        {/* BODY: Equipo */}
        <div className="kanban-card-section">
          <div className="section-icon"><FiSmartphone /></div>
          <div className="section-content">
            <span className="section-label">Equipo</span>
            <span className="section-value">{equipo}</span>
          </div>
        </div>

        {/* BODY: Servicio / Detalle */}
        <div className="kanban-card-section">
          <div className="section-icon"><FiTool /></div>
          <div className="section-content">
            <span className="section-label">Servicio</span>
            <span className="section-value">{detalle}</span>
          </div>
        </div>

        {/* BODY: Fecha + Días */}
        <div className="kanban-card-section">
          <div className="section-icon"><FiCalendar /></div>
          <div className="section-content">
            <span className="section-label">Ingreso</span>
            <span className="section-value">{fechaIngreso} <span className="dias-badge">{diasEnTaller}d</span></span>
          </div>
        </div>

        {/* NOTIFICACIÓN: Banner de motivo */}
        {servicio.estado === 'notificacion' && (servicio.motivoNotificacion || servicio.seguimiento?.filter(s => s.tipo === 'notificacion').pop()?.mensaje) && (
          <div className="kanban-card-notificacion">
            <FiBell size={12} />
            <span>{servicio.motivoNotificacion || servicio.seguimiento?.filter(s => s.tipo === 'notificacion').pop()?.mensaje}</span>
          </div>
        )}

        {/* FOOTER: Acciones */}
        <div className="kanban-card-actions">
          <button className="detail-link" onClick={() => handleVerDetalles(servicio)}>
            <FiEye size={14} /> Ver
          </button>
          {servicio.estado !== 'notificacion' && (
            <button className="card-btn-entregar" onClick={() => handleEntregarServicio(servicioId)}>
              <FiCheckCircle size={14} /> Entregar
            </button>
          )}
        </div>
      </div>
    );
  };

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
            <button className="workboard-primary-btn" onClick={() => navigate('/seguimiento')}>
              <FiSearch /> Seguimiento
            </button>
            <div className="notif-dropdown-container">
              <button 
                className={`workboard-icon-btn ${conteosEstado.notificacion > 0 ? 'has-notifications' : ''}`} 
                aria-label="Notificaciones pendientes"
                title={conteosEstado.notificacion > 0 ? `${conteosEstado.notificacion} notificación(es) pendiente(s)` : 'Sin notificaciones pendientes'}
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <FiBell />
                {conteosEstado.notificacion > 0 && <strong>{conteosEstado.notificacion}</strong>}
              </button>
              {showNotifDropdown && conteosEstado.notificacion > 0 && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <FiBell size={14} />
                    <span>Notificaciones Pendientes</span>
                  </div>
                  <div className="notif-dropdown-list">
                    {serviciosActivos.filter(s => s.estado === 'notificacion').map(servicio => {
                      const sId = servicio._id || servicio.id;
                      const sNum = servicio.servicioNumero ? `#TFX-${formatServicioNumero(servicio.servicioNumero)}` : `#TFX-${shortId(sId, 6)}`;
                      const sCliente = getClienteName(servicio.cliente || servicio.clienteId, clientes);
                      const sEquipo = getEquipoPanel(servicio);
                      const msgNotif = servicio.motivoNotificacion || servicio.seguimiento?.filter(s => s.tipo === 'notificacion').pop()?.mensaje || '';
                      return (
                        <div 
                          key={sId} 
                          className="notif-dropdown-item"
                          onClick={() => {
                            setShowNotifDropdown(false);
                            handleVerDetalles(servicio);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="notif-item-info">
                            <div className="notif-item-top">
                              <span className="notif-item-orden">{sNum}</span>
                              <span className="notif-item-cliente">{sCliente}</span>
                            </div>
                            <span className="notif-item-equipo">{sEquipo}</span>
                            {msgNotif && (
                              <div className="notif-item-motivo">
                                <FiBell size={10} />
                                <span>{msgNotif}</span>
                              </div>
                            )}
                          </div>
                          <button 
                            className="notif-item-resolver"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNotifDropdown(false);
                              handleCambiarEstado(sId, 'resolver', servicio.estado);
                            }}
                          >
                            <FiCheckCircle size={12} /> Resolver
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
        </section>

        <section className="workboard-filters">
          <div className="workboard-search-group">
            <label className="workboard-search">
              <input
                type="text"
                placeholder={
                  searchType === 'cliente' ? "Buscar por nombre de cliente..." :
                  searchType === 'equipo' ? "Buscar por marca o modelo de equipo..." :
                  searchType === 'servicio' ? "Buscar por tipo de servicio o detalle..." :
                  "Buscar por cliente, equipo, servicio o número de orden..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch />
            </label>
            <select
              className="search-type-select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              title="Tipo de búsqueda"
            >
              <option value="todos">🔍 Todos</option>
              <option value="cliente">👤 Cliente</option>
              <option value="equipo">📱 Equipo</option>
              <option value="servicio">🔧 Servicio</option>
            </select>
          </div>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Estado: Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="enRevision">En Revisión</option>
            <option value="enReparacion">En Reparación</option>
            <option value="listoParaEntrega">Listo para Entregar</option>
            <option value="notificacion">Notificación</option>
          </select>
          <button className="workboard-filter-btn" onClick={() => { setFiltroEstado('todos'); setSearchQuery(''); setSearchType('todos'); }}>
            <FiSearch /> Limpiar Filtros
          </button>
          <div className="vista-toggle-group">
            <button
              className={`vista-toggle-btn ${vistaModo === 'lista' ? 'active' : ''}`}
              onClick={() => setVistaModo('lista')}
              title="Vista Lista"
            >
              <span>&#9776;</span> Lista
            </button>
            <button
              className={`vista-toggle-btn ${vistaModo === 'kanban' ? 'active' : ''}`}
              onClick={() => setVistaModo('kanban')}
              title="Vista Cuadros"
            >
              <span>&#9638;</span> Cuadros
            </button>
          </div>
        </section>

        {/* VISTA FILTRADA: Respetando el modo seleccionado (lista o cuadros) */}
        {hayFiltrosActivos && (
          <section className="workboard-filtered-results">
            <div className="filtered-results-header">
              <h2>
                <FiSearch /> Resultados
                {searchQuery && (
                  <span className="filtered-tag">"{searchQuery}"</span>
                )}
                {filtroEstado !== 'todos' && (
                  <span className="filtered-tag">{getEstadoLabel(filtroEstado)}</span>
                )}
                <span className="filtered-count">{serviciosFiltrados.length} encontrados</span>
              </h2>
            </div>
            {serviciosFiltrados.length === 0 ? (
              <div className="filtered-empty">
                <FiSearch size={48} />
                <p>No se encontraron trabajos con los filtros aplicados.</p>
                <button className="workboard-filter-btn" onClick={() => { setFiltroEstado('todos'); setSearchQuery(''); setSearchType('todos'); }}>
                  Limpiar filtros
                </button>
              </div>
            ) : vistaModo === 'lista' ? (
              <div className="lista-moderna-body">
                {serviciosFiltrados.map((servicio) => {
                  const sId = servicio._id || servicio.id;
                  const sNum = servicio.servicioNumero ? `#TFX-${formatServicioNumero(servicio.servicioNumero)}` : `#TFX-${shortId(sId, 6)}`;
                  const sCliente = getClienteName(servicio.cliente || servicio.clienteId, clientes);
                  const sEquipo = getEquipoPanel(servicio);
                  const sFalla = servicio.fallaReportada || 'Sin falla reportada';
                  const sFecha = formatFechaPanel(servicio.fechaEntrada);
                  const sDias = servicio.fechaEntrada ? Math.floor((Date.now() - new Date(servicio.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const estadoIdx = FLUJO_ESTADOS.indexOf(servicio.estado);
                  return (
                    <div key={sId} className={`lista-fila fila-${servicio.estado}`}>
                      <div className="lista-fila-bar" />
                      <button className="lista-fila-orden" onClick={() => handleCopyId(servicio.servicioNumero ? formatServicioNumero(servicio.servicioNumero) : sId)}>
                        {sNum}
                      </button>
                      <div className="lista-fila-dias">
                        <FiClock size={11} />
                        <span>{sDias}d</span>
                      </div>
                      <div className="lista-fila-cliente">
                        <FiUser size={13} />
                        <span>{sCliente}</span>
                      </div>
                      <div className="lista-fila-equipo">
                        <FiSmartphone size={13} />
                        <span>{sEquipo}</span>
                      </div>
                      <div className="lista-fila-falla">
                        <FiTool size={12} />
                        <span>{sFalla}</span>
                      </div>
                      <div className="lista-fila-fecha">
                        <FiCalendar size={12} />
                        <span>{sFecha}</span>
                      </div>
                      <span className={`lista-fila-badge badge-${servicio.estado}`}>
                        {getEstadoIcon(servicio.estado)} {getEstadoLabel(servicio.estado)}
                      </span>
                      <div className="lista-fila-actions">
                        <button className="lista-fila-ver" onClick={() => handleVerDetalles(servicio)}>
                          <FiEye size={14} />
                        </button>
                        {servicio.estado !== 'notificacion' && (
                          <button className="lista-fila-entregar" onClick={() => handleEntregarServicio(sId)}>
                            <FiCheckCircle size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="filtered-grid">
                {serviciosFiltrados.map((servicio) => renderTarjetaServicio(servicio))}
              </div>
            )}
          </section>
        )}

{/* VISTA KANBAN: Tarjetas individuales sin columnas */}
        {!hayFiltrosActivos && vistaModo === 'kanban' && (
          <section className="workboard-cards-grid">
            <div className="cards-grid-header">
              <h2>Todas las tarjetas</h2>
              <span>{serviciosOrdenados.length} trabajos</span>
            </div>
            <div className="cards-grid">
              {serviciosOrdenados.map((servicio) => {
                const clienteData = servicio.cliente || servicio.clienteId;
                const clienteNombre = getClienteName(clienteData, clientes);
                const servicioId = servicio._id || servicio.id;
                const numero = servicio.servicioNumero ? `#TFX-${formatServicioNumero(servicio.servicioNumero)}` : `#TFX-${shortId(servicioId, 6)}`;
                const equipo = getEquipoPanel(servicio);
                const detalle = getDetallePanel(servicio);
                const fechaIngreso = formatFechaPanel(servicio.fechaEntrada);
                const diasEnTaller = servicio.fechaEntrada ? Math.floor((Date.now() - new Date(servicio.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const estadoIdx = FLUJO_ESTADOS.indexOf(servicio.estado);
                const estadoLabel = getEstadoLabel(servicio.estado);
                const estadoIcon = getEstadoIcon(servicio.estado);
                return (
                  <div className={`card-item card-${servicio.estado}`} key={servicioId}>
                    <div className="card-item-header">
                      <div className="card-item-id-row">
                        <button className="card-item-id" onClick={() => handleCopyId(servicio.servicioNumero ? formatServicioNumero(servicio.servicioNumero) : servicioId)}>
                          {numero}
                        </button>
                        <span className="card-item-dias">{diasEnTaller} días</span>
                      </div>
                      <span className={`card-item-badge badge-${servicio.estado}`}>
                        {estadoIcon} {estadoLabel}
                      </span>
                    </div>
                    <div className="card-item-body">
                      <div className="card-item-cliente">
                        <FiUser size={14} />
                        <span>{clienteNombre}</span>
                      </div>
                      <div className="card-item-equipo">
                        <FiSmartphone size={14} />
                        <span>{equipo}</span>
                      </div>
                      <div className="card-item-detalle">
                        <FiTool size={14} />
                        <span>{detalle}</span>
                      </div>
                      <div className="card-item-fecha">
                        <FiCalendar size={14} />
                        <span>Ingreso: {fechaIngreso}</span>
                      </div>
                    </div>
                    <div className="card-item-actions">
                      <button className="card-item-ver" onClick={() => handleVerDetalles(servicio)}>
                        <FiEye size={15} /> Ver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
</section>
        )}

{/* VISTA LISTA: Lista moderna tipo tracker */}
        {!hayFiltrosActivos && vistaModo === 'lista' && (
          <section className="workboard-lista-moderna">
            <div className="lista-moderna-header">
              <div className="lista-moderna-titulo">
                <h2><FiClipboard /> Lista de Trabajos</h2>
                <span>{serviciosOrdenados.length} trabajos</span>
              </div>
            </div>
            <div className="lista-moderna-body">
              {serviciosOrdenados.length === 0 ? (
                <div className="lista-moderna-empty">
                  <FiSearch size={48} />
                  <p>No hay trabajos registrados</p>
                </div>
              ) : (
                serviciosOrdenados.map((servicio) => {
                  const sId = servicio._id || servicio.id;
                  const sNum = servicio.servicioNumero ? `#TFX-${formatServicioNumero(servicio.servicioNumero)}` : `#TFX-${shortId(sId, 6)}`;
                  const sCliente = getClienteName(servicio.cliente || servicio.clienteId, clientes);
                  const sEquipo = getEquipoPanel(servicio);
                  const sFalla = servicio.fallaReportada || 'Sin falla reportada';
                  const sFecha = formatFechaPanel(servicio.fechaEntrada);
                  const sDias = servicio.fechaEntrada ? Math.floor((Date.now() - new Date(servicio.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const estadoIdx = FLUJO_ESTADOS.indexOf(servicio.estado);
                  return (
                    <div key={sId} className={`lista-fila fila-${servicio.estado}`}>
                      <div className="lista-fila-bar" />
                      <button className="lista-fila-orden" onClick={() => handleCopyId(servicio.servicioNumero ? formatServicioNumero(servicio.servicioNumero) : sId)}>
                        {sNum}
                      </button>
                      <div className="lista-fila-dias">
                        <FiClock size={11} />
                        <span>{sDias}d</span>
                      </div>
                      <div className="lista-fila-cliente">
                        <FiUser size={13} />
                        <span>{sCliente}</span>
                      </div>
                      <div className="lista-fila-equipo">
                        <FiSmartphone size={13} />
                        <span>{sEquipo}</span>
                      </div>
                      <div className="lista-fila-falla">
                        <FiTool size={12} />
                        <span>{sFalla}</span>
                      </div>
                      <div className="lista-fila-fecha">
                        <FiCalendar size={12} />
                        <span>{sFecha}</span>
                      </div>
                      <span className={`lista-fila-badge badge-${servicio.estado}`}>
                        {getEstadoIcon(servicio.estado)} {getEstadoLabel(servicio.estado)}
                      </span>
                      <div className="lista-fila-actions">
                        <button className="lista-fila-ver" onClick={() => handleVerDetalles(servicio)}>
                          <FiEye size={14} />
                        </button>
                        {servicio.estado !== 'notificacion' && (
                          <button className="lista-fila-entregar" onClick={() => handleEntregarServicio(sId)}>
                            <FiCheckCircle size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </section>
      {modalOpen && servicioSeleccionado && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-detalle-servicio modal-compact" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="modal-detalle-close"
              onClick={() => setModalOpen(false)}
              aria-label="Cerrar modal"
            >
              &times;
            </button>

            <div className="modal-detalle-header">
              <div className="modal-detalle-orden">
                <FiHash size={14} />
                <span>{servicioSeleccionado.servicioNumero ? `TFX-${formatServicioNumero(servicioSeleccionado.servicioNumero)}` : `TFX-${shortId(servicioSeleccionado._id || servicioSeleccionado.id, 6)}`}</span>
              </div>
              <span className={`modal-detalle-badge badge-${servicioSeleccionado.estado}`}>
                {getEstadoIcon(servicioSeleccionado.estado)} {getEstadoLabel(servicioSeleccionado.estado)}
              </span>
            </div>

            {servicioSeleccionado.estado === 'notificacion' && (
              <div className="modal-notificacion-banner modal-notif-compact">
                <FiBell size={14} />
                <span>{servicioSeleccionado.motivoNotificacion || servicioSeleccionado.seguimiento?.filter(s => s.tipo === 'notificacion').pop()?.mensaje || 'Sin mensaje'}</span>
              </div>
            )}

            <div className="modal-compact-grid">
              <div className="modal-compact-col">
                <div className="modal-compact-row">
                  <span className="modal-compact-label"><FiUser size={12} /> Cliente</span>
                  <span className="modal-compact-value">{(() => {
                    const clienteObj = typeof servicioSeleccionado.cliente === 'object' && servicioSeleccionado.cliente !== null
                      ? servicioSeleccionado.cliente
                      : clientes.find(c => String(c._id || c.id) === String(servicioSeleccionado.clienteId));
                    return clienteObj?.nombreCompleto || '—';
                  })()}</span>
                </div>
                {(() => {
                  const clienteObj = typeof servicioSeleccionado.cliente === 'object' && servicioSeleccionado.cliente !== null
                    ? servicioSeleccionado.cliente
                    : clientes.find(c => String(c._id || c.id) === String(servicioSeleccionado.clienteId));
                  return clienteObj?.celular || clienteObj?.telefono ? (
                    <div className="modal-compact-row">
                      <span className="modal-compact-label"><FiPhone size={12} /> Teléfono</span>
                      <span className="modal-compact-value">{clienteObj.celular || clienteObj.telefono}</span>
                    </div>
                  ) : null;
                })()}
                {(() => {
                  const clienteObj = typeof servicioSeleccionado.cliente === 'object' && servicioSeleccionado.cliente !== null
                    ? servicioSeleccionado.cliente
                    : clientes.find(c => String(c._id || c.id) === String(servicioSeleccionado.clienteId));
                  return clienteObj?.correo ? (
                    <div className="modal-compact-row">
                      <span className="modal-compact-label"><FiClipboard size={12} /> Email</span>
                      <span className="modal-compact-value">{clienteObj.correo}</span>
                    </div>
                  ) : null;
                })()}
                <div className="modal-compact-row">
                  <span className="modal-compact-label"><FiSmartphone size={12} /> Equipo</span>
                  <span className="modal-compact-value">{[servicioSeleccionado.marcaProducto, servicioSeleccionado.modeloProducto].filter(Boolean).join(' ') || servicioSeleccionado.tipoServicio || '—'}</span>
                </div>
                {servicioSeleccionado.tipoServicio && (
                  <div className="modal-compact-row">
                    <span className="modal-compact-label"><FiTool size={12} /> Servicio</span>
                    <span className="modal-compact-value">{getTipoLabel(servicioSeleccionado.tipoServicio) || servicioSeleccionado.tipoServicio}</span>
                  </div>
                )}
              </div>

              <div className="modal-compact-col">
                <div className="modal-compact-row">
                  <span className="modal-compact-label modal-compact-label-falla"><FiTool size={12} /> Falla</span>
                  <span className="modal-compact-value modal-compact-value-falla">{servicioSeleccionado.fallaReportada || 'Sin falla reportada'}</span>
                </div>
                {servicioSeleccionado.detalles && (
                  <div className="modal-compact-row">
                    <span className="modal-compact-label"><FiClipboard size={12} /> Detalles</span>
                    <span className="modal-compact-value">{servicioSeleccionado.detalles}</span>
                  </div>
                )}
                {servicioSeleccionado.notasAdicionales && (
                  <div className="modal-compact-row">
                    <span className="modal-compact-label"><FiClipboard size={12} /> Notas</span>
                    <span className="modal-compact-value">{servicioSeleccionado.notasAdicionales}</span>
                  </div>
                )}
                <div className="modal-compact-row">
                  <span className="modal-compact-label"><FiCalendar size={12} /> Entrada</span>
                  <span className="modal-compact-value">{servicioSeleccionado.fechaEntrada ? new Date(servicioSeleccionado.fechaEntrada).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                {servicioSeleccionado.fechaSalida && (
                  <div className="modal-compact-row">
                    <span className="modal-compact-label"><FiCalendar size={12} /> Salida</span>
                    <span className="modal-compact-value">{new Date(servicioSeleccionado.fechaSalida).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {servicioSeleccionado.metodoPago && (
                  <div className="modal-compact-row">
                    <span className="modal-compact-label"><FiDollarSign size={12} /> Pago</span>
                    <span className="modal-compact-value">{servicioSeleccionado.metodoPago}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-compact-precios">
              <div className="modal-precio-compact-item">
                <span>Costo</span>
                <span>${servicioSeleccionado.presupuesto?.subtotal?.toLocaleString() || '0'}</span>
              </div>
              {servicioSeleccionado.presupuesto?.iva > 0 && (
                <div className="modal-precio-compact-item">
                  <span>IVA</span>
                  <span>${servicioSeleccionado.presupuesto?.iva?.toLocaleString() || '0'}</span>
                </div>
              )}
              <div className="modal-precio-compact-item modal-precio-compact-sena">
                <span>Seña</span>
                <span>-${(servicioSeleccionado.anticipo || 0).toFixed(2)}</span>
              </div>
              <div className="modal-precio-compact-divider" />
              <div className="modal-precio-compact-item modal-precio-compact-total">
                <span>Total</span>
                <span>${((servicioSeleccionado.presupuesto?.subtotal || 0) - (servicioSeleccionado.anticipo || 0)).toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-estado-control">
              <div className="modal-estado-select-group">
                <span className="modal-estado-select-label">Estado:</span>
                <select
                  className="modal-estado-select"
                  value={servicioSeleccionado.estado}
                  onChange={(e) => { handleCambiarEstado(servicioSeleccionado._id || servicioSeleccionado.id, e.target.value, servicioSeleccionado.estado); setModalOpen(false); }}
                >
                  {ESTADO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-detalle-actions">
              {servicioSeleccionado.estado === 'notificacion' ? (
                <button className="modal-btn-resolver" onClick={() => { setModalOpen(false); handleCambiarEstado(servicioSeleccionado._id || servicioSeleccionado.id, 'resolver', servicioSeleccionado.estado); }}>
                  <FiCheckCircle size={14} /> Resolver Notificación
                </button>
              ) : (
                <>
                  <button className="modal-btn-notificar-rojo" onClick={() => { setModalOpen(false); handleMarcarNotificacion(servicioSeleccionado); }}>
                    <FiBell size={14} /> Notificar
                  </button>
                  <button className="modal-btn-sena" onClick={async () => {
                    setModalOpen(false);
                    const { value: monto, isConfirmed } = await Swal.fire({
                      title: 'Agregar Seña',
                      input: 'number',
                      inputLabel: `Anticipo actual: $${(servicioSeleccionado.anticipo || 0).toFixed(2)}`,
                      inputPlaceholder: 'Monto a agregar',
                      inputAttributes: { min: 1 },
                      showCancelButton: true,
                      confirmButtonText: 'Agregar',
                      cancelButtonText: 'Cancelar',
                      confirmButtonColor: '#10b981',
                      inputValidator: (value) => {
                        if (!value || Number(value) <= 0) return 'Ingresá un monto válido';
                      }
                    });
                    if (!isConfirmed) return;
                    try {
                      const id = servicioSeleccionado._id || servicioSeleccionado.id;
                      const nuevoAnticipo = (servicioSeleccionado.anticipo || 0) + Number(monto);
                      await api.put(`/servicios/${id}`, { anticipo: nuevoAnticipo });
                      const actualizado = { ...servicioSeleccionado, anticipo: nuevoAnticipo };
                      setServicioSeleccionado(actualizado);
                      await cargarDatos();
                      setModalOpen(true);
                      Swal.fire({ icon: 'success', title: 'Seña agregada', timer: 1500, showConfirmButton: false });
                    } catch (err) {
                      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo agregar la seña.' });
                    }
                  }}>
                    <FiDollarSign size={14} /> Agregar Seña
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Resolver Notificación */}
      {showResolverModal && resolverData && (
        <div className="modal-backdrop">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, margin: 'auto', padding: 24 }}>
            <button
              type="button"
              onClick={() => setShowResolverModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <h3>Resolver Notificación</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>
              Modificá los datos antes de volver al estado <strong>{getEstadoLabel(resolverData.estadoAnterior)}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                  <FiTool size={12} /> Falla Reportada
                </label>
                <textarea
                  value={resolverData.fallaReportada}
                  onChange={(e) => setResolverData({ ...resolverData, fallaReportada: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Describe la falla del equipo..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                    <FiTag size={12} /> Seña / Anticipo ($)
                  </label>
                  <input
                    type="number"
                    value={resolverData.anticipo}
                    onChange={(e) => setResolverData({ ...resolverData, anticipo: e.target.value })}
                    min="0"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                    <FiDollarSign size={12} /> Total Estimado ($)
                  </label>
                  <input
                    type="number"
                    value={resolverData.presupuestoTotal}
                    onChange={(e) => setResolverData({ ...resolverData, presupuestoTotal: e.target.value })}
                    min="0"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button
                onClick={() => setShowResolverModal(false)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button className="modal-btn-resolver" onClick={handleResolverSubmit}>
                <FiCheckCircle size={14} /> Guardar y Resolver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelTrabajo;
