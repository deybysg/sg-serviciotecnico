import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Swal from 'sweetalert2';
import '../pages/ComprobanteVenta.css';

function ComprobanteVenta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const v = await api.get(`/ventas/${id}`);
        setVenta(v);
      } catch (err) {
        console.error('Error cargando venta:', err);
        if (err.status === 403) {
          setForbidden(true);
        } else {
          setVenta(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVenta();
    } else {
      setLoading(false);
    }
  }, [id, user]);

  if (loading) return <div>Cargando comprobante...</div>;
  if (forbidden) return <Navigate to="/" replace />;
  if (!venta) return <div>No se encontró la venta.</div>;

  const formatCurrency = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);
  const formatFecha = (iso) => {
    try { return new Date(iso).toLocaleString('es-AR', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return iso; }
  };

  const totalCalc = (items) => {
    return (items || []).reduce((s, it) => s + ((it.subtotal != null) ? it.subtotal : ((it.precioUnitario || 0) * (it.cantidad || 0))), 0);
  };

  const handleDescargarPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const url = `${apiBase}/ventas/comprobante/${id}/pdf`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined
        }
      });
      
      if (!resp.ok) {
        throw new Error('No se pudo descargar el comprobante PDF');
      }
      
      const blob = await resp.blob();
      const enlace = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      enlace.href = objectUrl;
      enlace.download = `comprobante-${id}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(objectUrl);
      
      Swal.fire({
        icon: 'success',
        title: '¡Descarga exitosa!',
        text: 'El comprobante PDF se ha descargado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire('Error', e.message || 'No se pudo descargar el PDF.', 'error');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleVolver = () => {
    navigate('/miscomprasmodal');
  };

  const renderComprobante = (tipo = 'cliente') => (
    <div className={`comprobante-bloque comprobante-${tipo}`}>
      <header className="comprobante-header">
        <div className="comprobante-brand">
          <div className="logo-placeholder">SG</div>
          <div>
            <h2 className="brand-name">Sistema SG</h2>
            <div className="brand-sub">
              {tipo === 'cliente' ? 'Comprobante de Venta — Original' : 'Comprobante de Venta — Copia Vendedor'}
            </div>
          </div>
        </div>
        <div className="comprobante-meta">
          <div><strong>Venta:</strong> <span className="meta-value">{venta._id || venta.id}</span></div>
          <div><strong>Fecha:</strong> <span className="meta-value">{formatFecha(venta.fechaCompra)}</span></div>
          <div><strong>Estado:</strong> <span className={`badge estado-${(venta.estado||'').toLowerCase().replace(/\s+/g,'-')}`}>{venta.estado || '—'}</span></div>
        </div>
      </header>

      <section className="comprobante-body">
        <div className="cliente-info">
          <h3>Datos del cliente</h3>
          <p><strong>Usuario:</strong> {venta.username}</p>
          {venta.nombreCliente && <p><strong>Nombre:</strong> {venta.nombreCliente}</p>}
          {venta.direccion && <p><strong>Dirección:</strong> {venta.direccion}</p>}
          <p><strong>Método de pago: </strong>  {venta.metodoPago || '—'}</p>
        </div>

        <div className="productos-table-wrap">
          <table className="productos-table">
            <thead>
              <tr>
                <th>Producto / Servicio</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(venta.productosComprados || []).map((p, i) => (
                <tr key={i}>
                  <td className="td-nombre">{p.nombre}</td>
                  <td>{p.cantidad || 0}</td>
                  <td>{formatCurrency(p.precioUnitario || 0)}</td>
                  <td>{formatCurrency((p.subtotal != null) ? p.subtotal : ((p.precioUnitario || 0) * (p.cantidad || 0)))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="td-total-label">Total</td>
                <td className="td-total-value">{formatCurrency(venta.totalVenta != null ? venta.totalVenta : totalCalc(venta.productosComprados))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {venta.notas && <div className="comprobante-notes"><strong>Notas:</strong> <div>{venta.notas}</div></div>}
      </section>

      {tipo === 'cliente' ? (
        <footer className="comprobante-footer">
          <div className="footer-left">Gracias por tu compra.</div>
        </footer>
      ) : (
        <footer className="comprobante-footer comprobante-footer-vendedor">
          <div className="footer-left">Control interno — No válido como factura.</div>
        </footer>
      )}
    </div>
  );

  return (
    <div className="comprobante-page">
      <div className="comprobante-card">
        {/* ORIGINAL PARA EL CLIENTE */}
        {renderComprobante('cliente')}

        {/* LÍNEA DE CORTE */}
        <div className="comprobante-corte">
          <div className="corte-linea"></div>
          <div className="corte-icono">✂</div>
          <div className="corte-texto">Recortar aquí</div>
          <div className="corte-linea"></div>
        </div>

        {/* COPIA PARA EL VENDEDOR */}
        {renderComprobante('vendedor')}

        {/* BOTONES DE ACCIÓN (solo visibles en pantalla, no en impresión) */}
        <div className="comprobante-actions-screen">
          <button className="btn-volver" onClick={handleVolver}>← Volver</button>
          <button className="btn-print" onClick={() => window.print()}>Imprimir</button>
          <button 
            className="btn-download" 
            onClick={handleDescargarPDF}
            disabled={downloadingPDF}
          >
            {downloadingPDF ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Descargando...
              </>
            ) : (
              'Descargar PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComprobanteVenta;
