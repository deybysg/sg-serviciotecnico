import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import ModalDetalles from "./ModalDetalles";
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Paneltrabajos.css';

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

const PanelTrabajo = () => {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");

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
    const servicioNumero = String(s.servicioNumero || '');
    const coincideBusqueda =
      servicioNumero.includes(query) || clienteNombre.includes(query);

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
  };  if (isLoading) return <div className="panel-loading">Cargando Panel de Trabajo...</div>;

  return (
    <div className="panel-trabajo-container">
      {/* 🔽 Filtros de estado con conteo (Se mantiene) */}
      <div className="filtros-container">
        <button
          className={`filtro-btn ${filtroEstado === "todos" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("todos")}
        >
          📋 Todos ({conteosEstado.todos})
        </button>
        <button
          className={`filtro-btn ${filtroEstado === "pendiente" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("pendiente")}
        >
          ⏱️ Pendientes ({conteosEstado.pendiente})
        </button>
        <button
          className={`filtro-btn ${filtroEstado === "enRevision" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("enRevision")}
        >
          🧰 En Revisión ({conteosEstado.enRevision})
        </button>
        <button
          className={`filtro-btn ${filtroEstado === "enReparacion" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("enReparacion")}
        >
          🔨 En Reparación ({conteosEstado.enReparacion})
        </button>
        <button
          className={`filtro-btn ${filtroEstado === "listoParaEntrega" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("listoParaEntrega")}
        >
          🎁 Listo para Entrega ({conteosEstado.listoParaEntrega})
        </button>
      </div>

      {/* 🔎 Buscador (Se mantiene) */}
      <div className="panel-buscador">
        <input
          type="text"
          placeholder="Buscar por cliente o ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 🔽 Lista (Se mantiene) */}
      <div className="servicios-lista">
        {serviciosFiltrados.length === 0 ? (
          <p className="mensaje-vacio">🎉 ¡No hay trabajos con el filtro/búsqueda actual! 🎉</p>
        ) : (
          serviciosFiltrados.map((servicio) => {
            // Manejar tanto cliente populado como clienteId
            const clienteData = servicio.cliente || servicio.clienteId;
            const clienteNombre = getClienteName(clienteData, clientes);
            const estadoLabel = getEstadoLabel(servicio.estado);
            const esPrioridad =
              servicio.estado === "terminado" ||
              servicio.estado === "revisionTerminada";
            const servicioId = servicio._id || servicio.id;

            return (
              <div
                key={servicioId}
                className={`tarjeta-servicio ${esPrioridad ? "prioridad-entrega" : ""}`}
              >
                <div className="info-resumen">
                  <p>
                    <strong>N° Orden:</strong> {servicio.servicioNumero || 'N/A'},{' '}
                    <strong>Cliente:</strong> {clienteNombre},{" "}
                    <strong>Estado:</strong>{" "}
                    <span className={`estado-badge estado-${servicio.estado}`}>
                      {estadoLabel}
                    </span>
                  </p>
                </div>

                <div className="acciones">
                  <button
                    className="btn-detalles"
                    onClick={() => handleVerDetalles(servicio)}
                    title="Ver y Editar Detalles"
                  >
                    ☰
                  </button>
                  <button
                    className="btn-entregar"
                    onClick={() => handleEntregarServicio(servicioId)}
                    title="Marcar como Entregado"
                  >
                    ✅
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>      <ModalDetalles
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        servicio={servicioSeleccionado}
        clientes={clientes}
        onSave={handleGuardarEdicion}
      />
    </div>
  );
};

export default PanelTrabajo;