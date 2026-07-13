import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { FaClock, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import '../styles/pages/MisPagos.css';

function MisPagos() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pagos-pendientes/mis-pagos');
      setPagos(response || []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
    const interval = setInterval(fetchPagos, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const formatNumber = (num) => new Intl.NumberFormat('es-AR').format(num);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mis-pagos-container">
      <div className="mis-pagos-header">
        <h1>Mis Comprobantes</h1>
        <p>Estado de tus pagos por transferencia</p>
      </div>

      {loading ? (
        <div className="mis-pagos-loading">Cargando...</div>
      ) : pagos.length === 0 ? (
        <div className="mis-pagos-empty">
          <FaClock size={40} />
          <p>No enviaste comprobantes aún</p>
        </div>
      ) : (
        <div className="mis-pagos-lista">
          {pagos.map(pago => (
            <div key={pago._id} className={`pago-item estado-${pago.estado.toLowerCase()}`}>
              <div className="pago-item-header">
                <span className="pago-fecha">{formatDate(pago.fechaCompra)}</span>
                <span className={`pago-estado-badge estado-${pago.estado.toLowerCase()}`}>
                  {pago.estado === 'Pendiente' && <FaClock size={12} />}
                  {pago.estado === 'Aceptado' && <FaCheck size={12} />}
                  {pago.estado === 'Rechazado' && <FaTimes size={12} />}
                  {pago.estado}
                </span>
              </div>

              <div className="pago-item-body">
                <div className="pago-dato">
                  <span className="pago-label">Total:</span>
                  <span className="pago-total">${formatNumber(pago.totalVenta)}</span>
                </div>
                <div className="pago-dato">
                  <span className="pago-label">Productos:</span>
                  <span>{(pago.productosComprados || []).length} items</span>
                </div>
                {pago.notasAdmin && (
                  <div className="pago-dato">
                    <span className="pago-label">Notas:</span>
                    <span className="pago-notas">{pago.notasAdmin}</span>
                  </div>
                )}
              </div>

              <div className="pago-item-actions">
                <button className="btn-ver-comprobante" onClick={() => handleVerComprobante(pago.comprobante)}>
                  <FaEye size={14} /> Ver comprobante
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MisPagos;
