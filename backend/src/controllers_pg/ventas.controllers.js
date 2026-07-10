import { getPool } from '../database/postgres.js';
import PDFDocument from "pdfkit";

export const obtenerVentas = async (req, res) => {
  try {
    const { username, year, month } = req.query;
    const pool = getPool();
    let query = 'SELECT * FROM ventas WHERE 1=1';
    const params = [];
    let idx = 1;
    if (username) { query += ` AND username = $${idx}`; params.push(username); idx++; }
    if (year) {
      if (month) {
        query += ` AND fecha_compra >= $${idx} AND fecha_compra <= $${idx+1}`;
        params.push(new Date(year, month - 1, 1));
        params.push(new Date(year, month, 0, 23, 59, 59));
        idx += 2;
      } else {
        query += ` AND fecha_compra >= $${idx} AND fecha_compra <= $${idx+1}`;
        params.push(new Date(year, 0, 1));
        params.push(new Date(year, 11, 31, 23, 59, 59));
        idx += 2;
      }
    }
    query += ' ORDER BY fecha_compra DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows.map(r => ({ ...r, productosComprados: typeof r.productos_comprados === 'string' ? JSON.parse(r.productos_comprados) : r.productos_comprados })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM ventas WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });
    const venta = rows[0];
    const requestUser = req.user;
    if (!requestUser) return res.status(401).json({ mensaje: "No autenticado" });
    const allowedRoles = ["admin", "superadmin"];
    const isOwner = requestUser.username === venta.username;
    const isPrivileged = allowedRoles.includes(requestUser.role);
    if (!isOwner && !isPrivileged) return res.status(403).json({ mensaje: "No tienes permisos para ver esta venta" });
    venta.productosComprados = typeof venta.productos_comprados === 'string' ? JSON.parse(venta.productos_comprados) : venta.productos_comprados;
    res.json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const crearVenta = async (req, res) => {
  try {
    const { username, totalVenta, metodoPago, estado, productosComprados } = req.body;
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO ventas (username, fecha_compra, total_venta, metodo_pago, estado, productos_comprados)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, new Date(), totalVenta, metodoPago, estado || 'Completado', JSON.stringify(productosComprados || [])]
    );
    const venta = rows[0];
    venta.productosComprados = typeof venta.productos_comprados === 'string' ? JSON.parse(venta.productos_comprados) : venta.productos_comprados;
    res.status(201).json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear la venta" });
  }
};

export const devolverVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    // Obtener la venta
    const { rows: ventaRows } = await pool.query('SELECT * FROM ventas WHERE id = $1', [id]);
    if (ventaRows.length === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });
    const venta = ventaRows[0];
    if (venta.estado === 'Devuelto') return res.status(400).json({ mensaje: "Esta venta ya fue devuelta" });

    const productos = typeof venta.productos_comprados === 'string' ? JSON.parse(venta.productos_comprados) : venta.productos_comprados;

    // Devolver stock
    for (const p of (productos || [])) {
      if (!p.nombre) continue;
      const { rows: prodRows } = await pool.query('SELECT * FROM productos WHERE LOWER(nombre) = LOWER($1)', [p.nombre]);
      if (prodRows.length > 0) {
        const prod = prodRows[0];
        await pool.query(
          'UPDATE productos SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [(prod.stock || 0) + (p.cantidad || 0), prod.id]
        );
      }
    }

    // Actualizar estado de venta
    const { rows } = await pool.query(
      `UPDATE ventas SET estado = $1, total_venta = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      ['Devuelto', id]
    );
    const ventaDevuelta = rows[0];
    ventaDevuelta.productosComprados = typeof ventaDevuelta.productos_comprados === 'string' ? JSON.parse(ventaDevuelta.productos_comprados) : ventaDevuelta.productos_comprados;
    res.json(ventaDevuelta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const obtenerVentasDevueltas = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query("SELECT * FROM ventas WHERE estado = 'Devuelto' ORDER BY fecha_compra DESC");
    res.json(rows.map(r => ({ ...r, productosComprados: typeof r.productos_comprados === 'string' ? JSON.parse(r.productos_comprados) : r.productos_comprados })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const obtenerVentasPorUsuario = async (req, res) => {
  try {
    const { username } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM ventas WHERE username = $1 ORDER BY fecha_compra DESC', [username]);
    res.json(rows.map(r => ({ ...r, productosComprados: typeof r.productos_comprados === 'string' ? JSON.parse(r.productos_comprados) : r.productos_comprados })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const generarComprobantePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM ventas WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });
    const venta = rows[0];
    venta.productosComprados = typeof venta.productos_comprados === 'string' ? JSON.parse(venta.productos_comprados) : venta.productos_comprados;
    const requestUser = req.user;
    if (!requestUser) return res.status(401).json({ mensaje: "No autenticado" });
    const allowedRoles = ["admin", "superadmin"];
    const isOwner = requestUser.username === venta.username;
    const isPrivileged = allowedRoles.includes(requestUser.role);
    if (!isOwner && !isPrivileged) return res.status(403).json({ mensaje: "No tienes permisos para descargar este comprobante" });

    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    let timestamp = '';
    try {
      timestamp = new Date(venta.fecha_compra).toISOString().slice(0, 10).replace(/-/g, '');
    } catch (e) {
      timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }
    const filename = `comprobante-${venta.username}-${timestamp}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    doc.pipe(res);
    const colorPrimario = '#0b2545';
    const colorSecundario = '#1f6f9f';
    const colorFondo = '#f8fbff';
    const colorBorde = '#eef3f8';
    const colorTexto = '#333333';
    doc.rect(50, 50, 60, 60).fillAndStroke(colorPrimario, colorPrimario);
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('SG', 50, 70, { width: 60, align: 'center' });
    doc.fillColor(colorPrimario).fontSize(20).font('Helvetica-Bold').text('Sistema SG', 125, 55);
    doc.fillColor('#6c757d').fontSize(12).font('Helvetica').text('Comprobante de Venta', 125, 78);
    const metaX = 350;
    doc.fillColor(colorTexto).fontSize(10).font('Helvetica-Bold').text('Venta:', metaX, 55).font('Helvetica').text(String(venta.id).slice(-8).toUpperCase(), metaX + 60, 55);
    doc.font('Helvetica-Bold').text('Fecha:', metaX, 70).font('Helvetica').text(new Date(venta.fecha_compra).toLocaleString('es-AR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), metaX + 60, 70);
    const estadoColor = venta.estado === 'Completado' ? '#28a745' : '#ffc107';
    doc.font('Helvetica-Bold').text('Estado:', metaX, 85);
    doc.roundedRect(metaX + 60, 82, 80, 18, 4).fillAndStroke(estadoColor, estadoColor);
    doc.fillColor('#ffffff').fontSize(9).text(venta.estado || 'Completado', metaX + 60, 86, { width: 80, align: 'center' });
    doc.moveTo(50, 130).lineTo(545, 130).strokeColor(colorBorde).lineWidth(1).stroke();
    let yPos = 150;
    doc.fillColor(colorPrimario).fontSize(14).font('Helvetica-Bold').text('Datos del Cliente', 50, yPos);
    yPos += 25;
    doc.roundedRect(50, yPos, 495, 80, 6).fillAndStroke('#fbfdff', colorBorde);
    yPos += 15;
    doc.fillColor(colorTexto).fontSize(10).font('Helvetica-Bold').text('Usuario:', 65, yPos).font('Helvetica').text(venta.username || '—', 115, yPos);
    yPos += 20;
    if (venta.nombreCliente) { doc.font('Helvetica-Bold').text('Nombre:', 65, yPos).font('Helvetica').text(venta.nombreCliente, 115, yPos); yPos += 20; }
    if (venta.direccion) { doc.font('Helvetica-Bold').text('Dirección:', 65, yPos).font('Helvetica').text(venta.direccion, 125, yPos); yPos += 20; }
    doc.font('Helvetica-Bold').text('Método de pago:', 65, yPos).font('Helvetica').text(venta.metodo_pago || '—', 160, yPos);
    yPos += 40;
    doc.fillColor(colorPrimario).fontSize(14).font('Helvetica-Bold').text('Productos / Servicios', 50, yPos);
    yPos += 25;
    const tableTop = yPos;
    const colProducto = 50; const colCantidad = 320; const colPrecioUnit = 390; const colSubtotal = 480; const rowHeight = 30;
    doc.rect(colProducto, tableTop, 495, rowHeight).fillAndStroke(colorFondo, colorBorde);
    doc.fillColor(colorPrimario).fontSize(10).font('Helvetica-Bold').text('Producto / Servicio', colProducto + 10, tableTop + 10, { width: 250 }).text('Cant.', colCantidad + 5, tableTop + 10, { width: 60, align: 'center' }).text('Precio unit.', colPrecioUnit + 5, tableTop + 10, { width: 80, align: 'right' }).text('Subtotal', colSubtotal + 5, tableTop + 10, { width: 60, align: 'right' });
    yPos = tableTop + rowHeight;
    const productos = venta.productosComprados || [];
    productos.forEach((p, i) => {
      if (i % 2 === 0) { doc.rect(colProducto, yPos, 495, rowHeight).fillAndStroke('#ffffff', colorBorde); }
      else { doc.rect(colProducto, yPos, 495, rowHeight).fillAndStroke('#fafcff', colorBorde); }
      doc.fillColor(colorTexto).fontSize(9).font('Helvetica').text(p.nombre || '—', colProducto + 10, yPos + 10, { width: 250, ellipsis: true }).text(String(p.cantidad || 0), colCantidad + 5, yPos + 10, { width: 60, align: 'center' }).text(formatCurrency(p.precioUnitario || 0), colPrecioUnit + 5, yPos + 10, { width: 80, align: 'right' }).text(formatCurrency(p.subtotal || (p.precioUnitario || 0) * (p.cantidad || 0)), colSubtotal + 5, yPos + 10, { width: 60, align: 'right' });
      yPos += rowHeight;
    });
    doc.rect(colProducto, yPos, 495, rowHeight).fillAndStroke('#fafcff', colorBorde);
    doc.fillColor(colorPrimario).fontSize(12).font('Helvetica-Bold').text('TOTAL', colProducto + 10, yPos + 10, { width: 350, align: 'right' });
    doc.text(formatCurrency(venta.total_venta || 0), colPrecioUnit, yPos + 10, { width: 155, align: 'right' });
    yPos += rowHeight + 20;
    if (venta.notas) {
      yPos += 10;
      doc.roundedRect(50, yPos, 495, 60, 6).fillAndStroke('#fff9f0', '#ffd580');
      doc.fillColor('#856404').fontSize(10).font('Helvetica-Bold').text('Notas:', 65, yPos + 10);
      doc.fillColor(colorTexto).font('Helvetica').text(venta.notas, 65, yPos + 25, { width: 465 });
      yPos += 70;
    }
    yPos = Math.max(yPos + 20, 720);
    doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor(colorBorde).lineWidth(1).stroke();
    yPos += 15;
    doc.fillColor('#6c757d').fontSize(9).font('Helvetica').text('Gracias por tu compra.', 50, yPos);
    doc.text('Documento generado automáticamente.', 50, yPos, { align: 'right' });
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al generar comprobante PDF" });
  }
};

function formatCurrency(value) {
  if (value == null) value = 0;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}
