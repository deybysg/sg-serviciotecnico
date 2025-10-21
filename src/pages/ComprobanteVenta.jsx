import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../pages/ComprobanteVenta.css';

function ComprobanteVenta() {
  const { id } = useParams();
  const { user } = useAuth();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const res = await fetch(`http://localhost:3001/ventas?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!data || data.length === 0) {
          setVenta(null);
        } else {
          const v = data[0];
          // Permitir si es dueño o si es admin/superadmin
          if (user && (user.role === 'admin' || user.role === 'superadmin' || user.username === v.username)) {
            setVenta(v);
          } else {
            setForbidden(true);
          }
        }
      } catch (err) {
        console.error('Error cargando venta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenta();
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

  return (
    <div className="comprobante-page">
      <div className="comprobante-card">
        <header className="comprobante-header">
          <div className="comprobante-brand">
            <div className="logo-placeholder">SG</div>
            <div>
              <h2 className="brand-name">Sistema SG</h2>
              <div className="brand-sub">Comprobante de Venta</div>
            </div>
          </div>
          <div className="comprobante-meta">
            <div><strong>Venta:</strong> <span className="meta-value">{venta.id}</span></div>
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
            <p><strong>Método de pago:</strong> {venta.metodoPago || '—'}</p>
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

        <footer className="comprobante-footer">
          <div className="footer-left">Gracias por tu compra.</div>
          <div className="footer-actions">
            <button className="btn-print" onClick={() => window.print()}>Imprimir</button>
            <button className="btn-download" onClick={() => alert('Descarga no implementada - usar imprimir')}>Descargar</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ComprobanteVenta;
