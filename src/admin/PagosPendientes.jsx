import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { 
  FaCheck, FaTimes, FaEye, FaClock, FaSearch, FaFileExcel, FaFilePdf,
  FaSpinner, FaHistory, FaBoxes, FaDollarSign, FaUser, FaHourglassHalf,
  FaCheckCircle, FaTimesCircle, FaBan, FaTrash
} from 'react-icons/fa';
import '../styles/admin/PagosPendientes.css';

function PagosPendientes() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Pendiente');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [acciones, setAcciones] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pagos-pendientes');
      setPagos(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricas = async () => {
    try {
      const data = await api.get('/pagos-pendientes/metricas');
      setMetricas(data);
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    }
  };

  const fetchAcciones = async () => {
    try {
      const data = await api.get('/pagos-pendientes/acciones');
      setAcciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar acciones:', error);
    }
  };

  useEffect(() => {
    fetchPagos();
    fetchMetricas();
  }, []);

  useEffect(() => {
    if (showLog) fetchAcciones();
  }, [showLog]);

  // Funciones de limpieza de historial
  const handleLimpiarTodo = async () => {
    const result = await Swal.fire({
      title: '⚠️ ¿Limpiar TODO el historial?',
      html: '<p style="color: #94a3b8;">Se eliminarán <strong style="color: #ff4d4d;">TODAS</strong> las ventas, pagos pendientes y acciones del admin.</p><p style="color: #ff4d4d; font-size: 0.85rem;">Esta acción no se puede deshacer.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, borrar TODO',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0'
    });

    if (result.isConfirmed) {
      try {
        await api.delete('/pagos-pendientes/limpiar-todo');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Historial completo limpiado', showConfirmButton: false, timer: 2500 });
        fetchPagos();
        fetchMetricas();
        setSeleccionados([]);
      } catch (error) {
        Swal.fire('Error', 'No se pudo limpiar el historial', 'error');
      }
    }
  };

  const handleLimpiarPendientes = async () => {
    const result = await Swal.fire({
      title: '¿Limpiar pagos pendientes?',
      text: 'Se eliminarán todos los pagos pendientes.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0'
    });

    if (result.isConfirmed) {
      try {
        await api.delete('/pagos-pendientes/limpiar-pendientes');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pagos pendientes limpiados', showConfirmButton: false, timer: 2000 });
        fetchPagos();
        fetchMetricas();
      } catch (error) {
        Swal.fire('Error', 'No se pudieron limpiar los pagos', 'error');
      }
    }
  };

  const handleLimpiarVentas = async () => {
    const result = await Swal.fire({
      title: '¿Limpiar historial de ventas?',
      text: 'Se eliminarán todas las ventas completadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0'
    });

    if (result.isConfirmed) {
      try {
        await api.delete('/pagos-pendientes/limpiar-ventas');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Ventas limpiadas', showConfirmButton: false, timer: 2000 });
        fetchPagos();
        fetchMetricas();
      } catch (error) {
        Swal.fire('Error', 'No se pudieron limpiar las ventas', 'error');
      }
    }
  };

  const handleLimpiarAcciones = async () => {
    const result = await Swal.fire({
      title: '¿Limpiar log de acciones?',
      text: 'Se eliminará el historial de acciones del admin.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0'
    });

    if (result.isConfirmed) {
      try {
        await api.delete('/pagos-pendientes/limpiar-acciones');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Acciones limpiadas', showConfirmButton: false, timer: 2000 });
        fetchAcciones();
      } catch (error) {
        Swal.fire('Error', 'No se pudieron limpiar las acciones', 'error');
      }
    }
  };

  const handleVerComprobante = (comprobante, username) => {
    Swal.fire({
      title: `Comprobante de ${username}`,
      imageUrl: comprobante,
      imageWidth: '100%',
      imageMaxWidth: 500,
      showCloseButton: true,
      showConfirmButton: false,
      background: '#0f172a',
      color: '#e2e8f0'
    });
  };

  const handleVerDetalle = (pago) => {
    const productos = pago.productosComprados || [];
    Swal.fire({
      title: `Detalle de compra - ${pago.username}`,
      html: `
        <div style="text-align: left; padding: 10px; color: #94a3b8;">
          <p><strong style="color: #00b7ff;">Fecha:</strong> ${formatDate(pago.fechaCompra)}</p>
          <p><strong style="color: #00b7ff;">Total:</strong> <span style="color: #23dd5f; font-weight: bold;">$${formatNumber(pago.totalVenta)}</span></p>
          <hr style="border-color: rgba(0,183,255,0.1); margin: 10px 0;">
          <p><strong style="color: #00b7ff;">Productos:</strong></p>
          ${productos.map(p => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(0,183,255,0.05);">
              <span>${p.nombre} x${p.cantidad}</span>
              <span style="color: #00b7ff;">$${formatNumber(p.precioUnitario * p.cantidad)}</span>
            </div>
          `).join('')}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#00b7ff',
      background: '#0f172a',
      color: '#e2e8f0'
    });
  };

  const handleAceptar = async (id) => {
    const { value: notas } = await Swal.fire({
        title: '¿Aceptar pago?',
        html: '<p style="color: #94a3b8; font-size: 0.9rem;">Se registrará la venta y se descontará el stock</p>',
        input: 'text',
        inputLabel: 'Notas (opcional)',
        inputPlaceholder: 'Agregar notas...',
        showCancelButton: true,
        confirmButtonColor: '#23dd5f',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<FaCheck /> Aceptar',
        cancelButtonText: 'Cancelar',
        background: '#0f172a',
        color: '#e2e8f0'
    });

    if (notas !== undefined) {
      try {
        await api.patch(`/pagos-pendientes/${id}/aceptar`, { notas: notas || '' });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pago aceptado', showConfirmButton: false, timer: 2000 });
        fetchPagos();
        fetchMetricas();
        setSeleccionados(prev => prev.filter(x => x !== id));
      } catch (error) {
        Swal.fire('Error', 'No se pudo aceptar el pago', 'error');
      }
    }
  };

  const handleRechazar = async (id) => {
    const { value: notas } = await Swal.fire({
        title: '¿Rechazar pago?',
        input: 'text',
        inputLabel: 'Motivo del rechazo',
        inputPlaceholder: 'Ej: Comprobante ilegible...',
        showCancelButton: true,
        confirmButtonColor: '#ff4d4d',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => !value && 'Debes indicar un motivo',
        background: '#0f172a',
        color: '#e2e8f0'
    });

    if (notas !== undefined) {
      try {
        await api.patch(`/pagos-pendientes/${id}/rechazar`, { notas });
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Pago rechazado', showConfirmButton: false, timer: 2000 });
        fetchPagos();
        fetchMetricas();
        setSeleccionados(prev => prev.filter(x => x !== id));
      } catch (error) {
        Swal.fire('Error', 'No se pudo rechazar el pago', 'error');
      }
    }
  };

  const handleBatchAccion = async (accion) => {
    if (seleccionados.length === 0) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Seleccioná al menos un pago', showConfirmButton: false, timer: 2000 });
      return;
    }

    const texto = accion === 'aceptar' ? 'aceptar' : 'rechazar';
    const color = accion === 'aceptar' ? '#23dd5f' : '#ff4d4d';

    const { value: notas } = await Swal.fire({
      title: `${accion === 'aceptar' ? 'Aceptar' : 'Rechazar'} ${seleccionados.length} pagos?`,
      input: 'text',
      inputLabel: accion === 'aceptar' ? 'Notas (opcional)' : 'Motivo del rechazo',
      showCancelButton: true,
      confirmButtonColor: color,
      cancelButtonColor: '#64748b',
      confirmButtonText: `${accion === 'aceptar' ? 'Aceptar' : 'Rechazar'} todos`,
      background: '#0f172a',
      color: '#e2e8f0'
    });

    if (notas !== undefined) {
      try {
        const endpoint = accion === 'aceptar' ? '/pagos-pendientes/batch-aceptar' : '/pagos-pendientes/batch-rechazar';
        const result = await api.post(endpoint, { ids: seleccionados, notas: notas || '' });
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: result.message || `${seleccionados.length} pagos procesados`,
          showConfirmButton: false, timer: 2500
        });
        setSeleccionados([]);
        fetchPagos();
        fetchMetricas();
      } catch (error) {
        Swal.fire('Error', 'No se pudieron procesar los pagos', 'error');
      }
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSeleccionTodos = () => {
    const pendientesIds = pagosFiltrados.map(p => p._id);
    if (seleccionados.length === pendientesIds.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(pendientesIds);
    }
  };

  const pagosFiltrados = useMemo(() => {
    let resultado = (pagos || []).filter(p => p.estado === filtro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(p => 
        p.username?.toLowerCase().includes(q) ||
        String(p.totalVenta).includes(q) ||
        p.notasAdmin?.toLowerCase().includes(q)
      );
    }
    return resultado;
  }, [pagos, filtro, busqueda]);

  const formatNumber = (num) => new Intl.NumberFormat('es-AR').format(num);
  const formatDate = (date) => new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const ws_data = [['ID', 'Usuario', 'Fecha', 'Total', 'Estado', 'Productos', 'Notas Admin', 'Revisado Por', 'Fecha Revisión']];
      pagos.forEach(p => {
        ws_data.push([
          p._id, p.username, formatDate(p.fechaCompra), p.totalVenta, p.estado,
          (p.productosComprados || []).map(pr => `${pr.nombre} x${pr.cantidad}`).join(', '),
          p.notasAdmin || '', p.revisadoPor || '', p.fechaRevision ? formatDate(p.fechaRevision) : ''
        ]);
      });
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pagos');
      XLSX.writeFile(wb, `pagos-pendientes-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exportando:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Reporte de Pagos', 14, 20);
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);

      let y = 38;
      pagos.forEach(p => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`#${p._id} | ${p.username} | $${formatNumber(p.totalVenta)} | ${p.estado} | ${formatDate(p.fechaCompra)}`, 14, y);
        y += 5;
      });

      doc.save(`pagos-pendientes-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="pagos-pendientes-container">
      {/* Dashboard de métricas */}
      {metricas && (
        <div className="metricas-dashboard">
          <div className="metrica-card metrica-pendientes">
            <FaHourglassHalf size={20} />
            <div className="metrica-info">
              <span className="metrica-numero">{metricas.pendientes}</span>
              <span className="metrica-label">Pendientes</span>
            </div>
          </div>
          <div className="metrica-card metrica-monto-pendiente">
            <FaDollarSign size={20} />
            <div className="metrica-info">
              <span className="metrica-numero">${formatNumber(metricas.montoPendiente)}</span>
              <span className="metrica-label">Monto pendiente</span>
            </div>
          </div>
          <div className="metrica-card metrica-aceptados">
            <FaCheckCircle size={20} />
            <div className="metrica-info">
              <span className="metrica-numero">{metricas.aceptados}</span>
              <span className="metrica-label">Aceptados</span>
            </div>
          </div>
          <div className="metrica-card metrica-rechazados">
            <FaTimesCircle size={20} />
            <div className="metrica-info">
              <span className="metrica-numero">{metricas.rechazados}</span>
              <span className="metrica-label">Rechazados</span>
            </div>
          </div>
          <div className="metrica-card">
            <FaDollarSign size={20} />
            <div className="metrica-info">
              <span className="metrica-numero">${formatNumber(metricas.montoAceptado)}</span>
              <span className="metrica-label">Total aprobado</span>
            </div>
          </div>
          <div className="metrica-card">
            <FaClock size={20} />
            <div className="metrica-info">
              <span className="metrica-numero">{metricas.tiempoPromedioHoras}h</span>
              <span className="metrica-label">Tiempo prom. respuesta</span>
            </div>
          </div>
        </div>
      )}

      <div className="pagos-header">
        <div className="header-left">
          <h1>Pagos Pendientes</h1>
          <div className="busqueda-wrapper">
            <FaSearch className="busqueda-icon" />
            <input
              type="text"
              placeholder="Buscar por usuario, monto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="busqueda-input"
            />
          </div>
        </div>
        <div className="header-right">
          <div className="pagos-filtros">
            <button className={`filtro-btn ${filtro === 'Pendiente' ? 'active' : ''}`} onClick={() => setFiltro('Pendiente')}>
              <FaClock size={14} /> Pendientes ({(pagos || []).filter(p => p.estado === 'Pendiente').length})
            </button>
            <button className={`filtro-btn ${filtro === 'Aceptado' ? 'active' : ''}`} onClick={() => setFiltro('Aceptado')}>
              <FaCheck size={14} /> Aceptados
            </button>
            <button className={`filtro-btn ${filtro === 'Rechazado' ? 'active' : ''}`} onClick={() => setFiltro('Rechazado')}>
              <FaTimes size={14} /> Rechazados
            </button>
          </div>
          <div className="header-actions">
            <button className="btn-action" onClick={() => setShowLog(!showLog)}>
              <FaHistory /> {showLog ? 'Ocultar' : 'Historial'}
            </button>
            <button className="btn-action" onClick={handleExportExcel} disabled={exporting}>
              {exporting ? <FaSpinner className="spin" /> : <FaFileExcel />} Excel
            </button>
            <button className="btn-action" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? <FaSpinner className="spin" /> : <FaFilePdf />} PDF
            </button>
            <div className="limpiar-dropdown">
              <button className="btn-action btn-limpiar">
                <FaTrash /> Limpiar
              </button>
              <div className="limpiar-dropdown-menu">
                <button onClick={handleLimpiarTodo}>🗑️ Todo el historial</button>
                <button onClick={handleLimpiarPendientes}>⏳ Solo pagos pendientes</button>
                <button onClick={handleLimpiarVentas}>✅ Solo ventas completadas</button>
                <button onClick={handleLimpiarAcciones}>📋 Solo log de acciones</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de acciones */}
      {showLog && (
        <div className="acciones-log">
          <h3><FaHistory /> Últimas acciones</h3>
          <div className="acciones-lista">
            {acciones.length === 0 ? (
              <p className="acciones-empty">No hay acciones registradas</p>
            ) : (
              acciones.map(a => (
                <div key={a.id} className={`accion-item accion-${a.accion.includes('Aceptado') ? 'aceptado' : a.accion.includes('Rechazado') ? 'rechazado' : 'otro'}`}>
                  <span className="accion-fecha">{formatDate(a.createdAt)}</span>
                  <span className="accion-user"><FaUser size={10} /> {a.username}</span>
                  <span className={`accion-tipo ${a.accion.includes('Aceptado') ? 'aceptado' : 'rechazado'}`}>{a.accion}</span>
                  <span className="accion-monto">${formatNumber(a.monto)}</span>
                  <span className="accion-admin">por {a.adminUser}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Batch actions */}
      {seleccionados.length > 0 && (
        <div className="batch-actions">
          <span className="batch-count">{seleccionados.length} seleccionados</span>
          <button className="batch-btn batch-aceptar" onClick={() => handleBatchAccion('aceptar')}>
            <FaCheck /> Aceptar todos
          </button>
          <button className="batch-btn batch-rechazar" onClick={() => handleBatchAccion('rechazar')}>
            <FaTimes /> Rechazar todos
          </button>
          <button className="batch-btn batch-cancelar" onClick={() => setSeleccionados([])}>
            <FaBan /> Cancelar selección
          </button>
        </div>
      )}

      {loading ? (
        <div className="pagos-loading">Cargando pagos...</div>
      ) : pagosFiltrados.length === 0 ? (
        <div className="pagos-empty">
          <FaClock size={40} />
          <p>No hay pagos {filtro.toLowerCase()}{busqueda ? ' que coincidan con la búsqueda' : ''}</p>
        </div>
      ) : (
        <div className="pagos-grid">
          {filtro === 'Pendiente' && (
            <div className="select-all-row">
              <label className="select-all-label">
                <input 
                  type="checkbox" 
                  checked={seleccionados.length === pagosFiltrados.length && pagosFiltrados.length > 0}
                  onChange={toggleSeleccionTodos}
                />
                Seleccionar todos
              </label>
            </div>
          )}
          {pagosFiltrados.map(pago => (
            <div key={pago._id} className={`pago-card pago-${pago.estado.toLowerCase()} ${seleccionados.includes(pago._id) ? 'seleccionado' : ''}`}>
              {filtro === 'Pendiente' && (
                <div className="pago-checkbox">
                  <input 
                    type="checkbox" 
                    checked={seleccionados.includes(pago._id)}
                    onChange={() => toggleSeleccion(pago._id)}
                  />
                </div>
              )}
              <div className="pago-card-header">
                <span className="pago-username">{pago.username}</span>
                <span className={`pago-estado estado-${pago.estado.toLowerCase()}`}>
                  {pago.estado}
                </span>
              </div>
              
              <div className="pago-card-body">
                <div className="pago-info">
                  <span className="pago-label">Fecha:</span>
                  <span className="pago-value">{formatDate(pago.fechaCompra)}</span>
                </div>
                <div className="pago-info">
                  <span className="pago-label">Total:</span>
                  <span className="pago-total">${formatNumber(pago.totalVenta)}</span>
                </div>
                <div className="pago-info">
                  <span className="pago-label">Productos:</span>
                  <span className="pago-value">{pago.productosComprados.length} items</span>
                </div>
                {/* Productos preview */}
                <div className="pago-productos-preview">
                  {(pago.productosComprados || []).slice(0, 2).map((p, i) => (
                    <div key={i} className="producto-preview-item">
                      <FaBoxes size={12} />
                      <span>{p.nombre} x{p.cantidad}</span>
                    </div>
                  ))}
                  {pago.productosComprados.length > 2 && (
                    <span className="producto-mas">+{pago.productosComprados.length - 2} más</span>
                  )}
                </div>
                {pago.notasAdmin && (
                  <div className="pago-info">
                    <span className="pago-label">Notas:</span>
                    <span className="pago-value pago-notas">{pago.notasAdmin}</span>
                  </div>
                )}
              </div>

              <div className="pago-card-actions">
                <button className="pago-action-btn pago-ver" onClick={() => handleVerComprobante(pago.comprobante, pago.username)}>
                  <FaEye size={14} /> Comprobante
                </button>
                <button className="pago-action-btn pago-detalle" onClick={() => handleVerDetalle(pago)}>
                  <FaBoxes size={14} /> Detalle
                </button>
                {pago.estado === 'Pendiente' && (
                  <>
                    <button className="pago-action-btn pago-aceptar" onClick={() => handleAceptar(pago._id)}>
                      <FaCheck size={14} /> Aceptar
                    </button>
                    <button className="pago-action-btn pago-rechazar" onClick={() => handleRechazar(pago._id)}>
                      <FaTimes size={14} /> Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PagosPendientes;
