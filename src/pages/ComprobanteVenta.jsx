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

  const renderComprobanteCliente = () => (
    <div className="comprobante-bloque comprobante-cliente">
      <header className="comprobante-header">
        <div className="comprobante-brand">
          <div className="logo-placeholder">SG</div>
          <div>
            <h2 className="brand-name">Sistema SG</h2>
            <div className="brand-sub">Comprobante de Venta — Original Cliente</div>
          </div>
        </div>
        <div className="comprobante-meta">
          <div><strong>N° Venta:</strong> <span className="meta-value">{venta._id || venta.id}</span></div>
          <div><strong>Fecha:</strong> <span className="meta-value">{formatFecha(venta.fechaCompra)}</span></div>
          <div><strong>Estado:</strong> <span className={`badge estado-${(venta.estado||'').toLowerCase().replace(/\s+/g,'-')}`}>{venta.estado || '—'}</span></div>
        </div>
      </header>

      <section className="comprobante-body">
        <div className="cliente-info-detallado">
          <h3>Datos del cliente</h3>
          <div className="cliente-grid">
            <p><strong>Usuario:</strong> {venta.username}</p>
            {venta.nombreCliente && <p><strong>Nombre completo:</strong> {venta.nombreCliente}</p>}
            {venta.email && <p><strong>Email:</strong> {venta.email}</p>}
            {venta.telefono && <p><strong>Teléfono:</strong> {venta.telefono}</p>}
            {venta.direccion && <p><strong>Dirección:</strong> {venta.direccion}</p>}
            {venta.dni && <p><strong>DNI:</strong> {venta.dni}</p>}
            <p><strong>Método de pago:</strong> {venta.metodoPago || '—'}</p>
          </div>
        </div>

        <div className="productos-table-wrap">
          <table className="productos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto / Servicio</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(venta.productosComprados || []).map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="td-nombre">{p.nombre}</td>
                  <td>{p.cantidad || 0}</td>
                  <td>{formatCurrency(p.precioUnitario || 0)}</td>
                  <td>{formatCurrency((p.subtotal != null) ? p.subtotal : ((p.precioUnitario || 0) * (p.cantidad || 0)))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="td-total-label">Total</td>
                <td className="td-total-value">{formatCurrency(venta.totalVenta != null ? venta.totalVenta : totalCalc(venta.productosComprados))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="comprobante-totales">
          <div className="total-row">
            <span>Subtotal:</span>
            <strong>{formatCurrency(venta.totalVenta != null ? venta.totalVenta : totalCalc(venta.productosComprados))}</strong>
          </div>
          <div className="total-row grand-total">
            <span>TOTAL A PAGAR:</span>
            <strong>{formatCurrency(venta.totalVenta != null ? venta.totalVenta : totalCalc(venta.productosComprados))}</strong>
          </div>
        </div>

        {venta.notas && <div className="comprobante-notes"><strong>Notas:</strong> <div>{venta.notas}</div></div>}
      </section>

      <footer className="comprobante-footer">
        <div className="footer-left">
          <p>Gracias por tu compra.</p>
          <p className="footer-small">Conservá este comprobante para cualquier reclamo o devolución.</p>
        </div>
        <div className="footer-qr">
          <div className="qr-placeholder">QR</div>
          <span>Escaneá para verificar</span>
        </div>
      </footer>
    </div>
  );

  const renderTicketVendedor = () => (
    <div className="comprobante-bloque comprobante-vendedor">
      <div className="ticket-header">
        <div className="ticket-logo">SG</div>
        <div className="ticket-tipo">COPIA VENDEDOR</div>
      </div>
      
      <div className="ticket-body">
        <div className="ticket-fila">
          <span className="ticket-label">N° Venta:</span>
          <span className="ticket-valor">{venta._id || venta.id}</span>
        </div>
        <div className="ticket-fila">
          <span className="ticket-label">Fecha:</span>
          <span className="ticket-valor">{formatFecha(venta.fechaCompra)}</span>
        </div>
        <div className="ticket-separador"></div>
        <div className="ticket-fila">
          <span className="ticket-label">Cliente:</span>
          <span className="ticket-valor">{venta.nombreCliente || venta.username || '—'}</span>
        </div>
        {venta.telefono && (
          <div className="ticket-fila">
            <span className="ticket-label">Teléfono:</span>
            <span className="ticket-valor">{venta.telefono}</span>
          </div>
        )}
        <div className="ticket-separador"></div>
        <div className="ticket-fila ticket-total">
          <span className="ticket-label">Total:</span>
          <span className="ticket-valor">{formatCurrency(venta.totalVenta != null ? venta.totalVenta : totalCalc(venta.productosComprados))}</span>
        </div>
      </div>

      <div className="ticket-footer">
        Control interno
      </div>
    </div>
  );

  return (
    <div className="comprobante-page">
      <div className="comprobante-card">
        {/* ORIGINAL PARA EL CLIENTE — MÁS DETALLADO */}
        {renderComprobanteCliente()}

        {/* LÍNEA DE CORTE */}
        <div className="comprobante-corte">
          <div className="corte-linea"></div>
          <div className="corte-icono">✂</div>
          <div className="corte-texto">Recortar aquí</div>
          <div className="corte-linea"></div>
        </div>

        {/* TICKET PEQUEÑO PARA EL VENDEDOR */}
        {renderTicketVendedor()}

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
