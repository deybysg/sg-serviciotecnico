import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import ModalDetalles from "./ModalDetalles";
import { useNavigate } from 'react-router-dom'; // 👈 1. Importar useNavigate
import './Paneltrabajos.css';

const API_URL = "http://localhost:3001";

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
  return clientes.find(c => c.id === clienteId)?.nombreCompleto || "Cliente Desconocido";
};

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
      const [serviciosRes, clientesRes] = await Promise.all([
        fetch(`${API_URL}/servicios`),
        fetch(`${API_URL}/clientes`),
      ]);

      const [serviciosData, clientesData] = await Promise.all([
        serviciosRes.json(),
        clientesRes.json(),
      ]);

      setServicios(serviciosData);
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al cargar datos del panel:", error);
      Swal.fire("Error", "No se pudieron cargar los servicios o clientes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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
    const clienteNombre = getClienteName(s.clienteId, clientes).toLowerCase();
    const coincideBusqueda =
      s.id.toString().includes(query) || clienteNombre.includes(query);

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

  const handleGuardarEdicion = async (idServicio, datosEditados) => {
    try {
      const res = await fetch(`${API_URL}/servicios/${idServicio}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEditados),
      });
      if (!res.ok) throw new Error("Error al guardar la edición");

      Swal.fire("Actualizado", `Servicio ${idServicio} editado.`, "success");
      cargarDatos();
      setModalOpen(false);
    } catch (error) {
      console.error("Error al guardar edición:", error);
      Swal.fire("Error", "No se pudo guardar la edición.", "error");
    }
  };

  // 🚨 Función de Entrega modificada para redirigir 🚨
  const handleEntregarServicio = async (idServicio) => {
    const confirm = await Swal.fire({
      title: "¿Confirmar Entrega?",
      text: "El servicio se marcará como 'Entregado' y se moverá al Historial.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, Entregar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const fechaSalida = new Date().toISOString();
    const datosActualizados = {
      fechaSalida,
      estado: "entregado", // 👈 Esto lo elimina del panel porque ya no es "activo"
    };

    try {
      const res = await fetch(`${API_URL}/servicios/${idServicio}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosActualizados),
      });

      if (!res.ok) throw new Error("Error en la petición al servidor.");

      Swal.fire("¡Entregado!", `El servicio ${idServicio} fue entregado.`, "success");
      cargarDatos();
      
      // 👈 3. Redirigir al historial después del éxito
      // navigate('/historial'); 
      
    } catch (error) {
      console.error("Error al completar la entrega:", error);
      Swal.fire("Error", "No se pudo completar la entrega.", "error");
    }
  };

  if (isLoading) return <div className="panel-loading">Cargando Panel de Trabajo...</div>;

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
            const clienteNombre = getClienteName(servicio.clienteId, clientes);
            const estadoLabel = getEstadoLabel(servicio.estado);
            const esPrioridad =
              servicio.estado === "terminado" ||
              servicio.estado === "revisionTerminada";

            return (
              <div
                key={servicio.id}
                className={`tarjeta-servicio ${esPrioridad ? "prioridad-entrega" : ""}`}
              >
                <div className="info-resumen">
                  <p>
                    <strong>ID:</strong> {servicio.id},{" "}
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
                    onClick={() => handleEntregarServicio(servicio.id)}
                    title="Marcar como Entregado"
                  >
                    ✅
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ModalDetalles
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