import VentasModel from "../models/ventasSchema.js";
import ProductosModel from "../models/productosSchema.js";
import PDFDocument from "pdfkit";

// Obtener todas las ventas
export const obtenerVentas = async (req, res) => {
  try {
    const { username, year, month } = req.query;
    let filtro = {};
    
    // Filtrar por usuario si se proporciona
    if (username) {
      filtro.username = username;
    }
    
    // Filtrar por año/mes si se proporciona
    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1);
      const endDate = month 
        ? new Date(year, month, 0, 23, 59, 59) 
        : new Date(year, 11, 31, 23, 59, 59);
      
      filtro.fechaCompra = { $gte: startDate, $lte: endDate };
    }
    
    const ventas = await VentasModel.find(filtro).sort({ fechaCompra: -1 });
    res.json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Obtener una venta por ID (usuario dueño o admin/superadmin)
export const obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await VentasModel.findById(id);
    
    if (!venta) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    // Verificar permisos: el usuario dueño (username) o roles elevados
    const requestUser = req.user; // viene del middleware authenticate
    if (!requestUser) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }
    const allowedRoles = ["admin", "superadmin"];
    const isOwner = requestUser.username === venta.username;
    const isPrivileged = allowedRoles.includes(requestUser.role);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ mensaje: "No tienes permisos para ver esta venta" });
    }
    
    res.json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Crear venta
export const crearVenta = async (req, res) => {
  try {
    const { username, totalVenta, metodoPago, estado, productosComprados } = req.body;
    
    const nuevaVenta = new VentasModel({
      username,
      fechaCompra: new Date(),
      totalVenta,
      metodoPago,
      estado: estado || 'Completado',
      productosComprados
    });
    
    await nuevaVenta.save();
    res.status(201).json(nuevaVenta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear la venta" });
  }
};

// Devolver venta y reintegrar stock
export const devolverVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await VentasModel.findById(id);
    if (!venta) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (venta.estado === "Devuelto") {
      return res.status(400).json({ mensaje: "Esta venta ya fue devuelta" });
    }

    const productos = venta.productosComprados || [];
    for (const p of productos) {
      if (!p.nombre) continue;
      const prod = await ProductosModel.findOne({
        nombre: { $regex: new RegExp(`^${p.nombre}$`, "i") }
      });
      if (prod) {
        prod.stock = (prod.stock || 0) + (p.cantidad || 0);
        await prod.save();
      }
    }

    venta.estado = "Devuelto";
    venta.totalVenta = 0;
    await venta.save();

    res.json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Obtener ventas por usuario (mis compras)
export const obtenerVentasPorUsuario = async (req, res) => {
  try {
    const { username } = req.params;
    const ventas = await VentasModel.find({ username }).sort({ fechaCompra: -1 });
    res.json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Generar comprobante PDF por ID (usuario dueño o admin/superadmin)
export const generarComprobantePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await VentasModel.findById(id);
    if (!venta) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    // Verificar permisos: el usuario dueño (username) o roles elevados
    const requestUser = req.user; // viene del middleware authenticate
    if (!requestUser) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }
    const allowedRoles = ["admin", "superadmin"];
    const isOwner = requestUser.username === venta.username;
    const isPrivileged = allowedRoles.includes(requestUser.role);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ mensaje: "No tienes permisos para descargar este comprobante" });
    }

    // Crear documento PDF con márgenes profesionales
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      bufferPages: true
    });

    // Configurar headers
    let timestamp = '';
    try {
      timestamp = new Date(venta.fecha).toISOString().slice(0, 10).replace(/-/g, '');
    } catch (e) {
      timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }
    const filename = `comprobante-${venta.username}-${timestamp}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Pipe al response
    doc.pipe(res);

    // Colores del tema
    const colorPrimario = '#0b2545';
    const colorSecundario = '#1f6f9f';
    const colorFondo = '#f8fbff';
    const colorBorde = '#eef3f8';
    const colorTexto = '#333333';

    // ========== ENCABEZADO ==========
    // Logo y título
    doc.rect(50, 50, 60, 60)
       .fillAndStroke(colorPrimario, colorPrimario);
    
    doc.fillColor('#ffffff')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('SG', 50, 70, { width: 60, align: 'center' });

    // Nombre de la empresa y tipo de documento
    doc.fillColor(colorPrimario)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('Sistema SG', 125, 55);
    
    doc.fillColor('#6c757d')
       .fontSize(12)
       .font('Helvetica')
       .text('Comprobante de Venta', 125, 78);

    // Información de la venta (derecha)
    const metaX = 350;
    doc.fillColor(colorTexto)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Venta:', metaX, 55)
       .font('Helvetica')
       .text(String(venta._id).slice(-8).toUpperCase(), metaX + 60, 55);

    doc.font('Helvetica-Bold')
       .text('Fecha:', metaX, 70)
       .font('Helvetica')
       .text(new Date(venta.fechaCompra).toLocaleString('es-AR', {
         year: 'numeric', month: 'short', day: 'numeric',
         hour: '2-digit', minute: '2-digit'
       }), metaX + 60, 70);

    // Badge de estado
    const estadoColor = venta.estado === 'Completado' ? '#28a745' : '#ffc107';
    doc.font('Helvetica-Bold')
       .text('Estado:', metaX, 85);
    
    doc.roundedRect(metaX + 60, 82, 80, 18, 4)
       .fillAndStroke(estadoColor, estadoColor);
    
    doc.fillColor('#ffffff')
       .fontSize(9)
       .text(venta.estado || 'Completado', metaX + 60, 86, { width: 80, align: 'center' });

    // Línea divisoria
    doc.moveTo(50, 130)
       .lineTo(545, 130)
       .strokeColor(colorBorde)
       .lineWidth(1)
       .stroke();

    // ========== DATOS DEL CLIENTE ==========
    let yPos = 150;
    doc.fillColor(colorPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Datos del Cliente', 50, yPos);

    yPos += 25;
    doc.roundedRect(50, yPos, 495, 80, 6)
       .fillAndStroke('#fbfdff', colorBorde);

    yPos += 15;
    doc.fillColor(colorTexto)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Usuario:', 65, yPos)
       .font('Helvetica')
       .text(venta.username || '—', 115, yPos);

    yPos += 20;
    if (venta.nombreCliente) {
      doc.font('Helvetica-Bold')
         .text('Nombre:', 65, yPos)
         .font('Helvetica')
         .text(venta.nombreCliente, 115, yPos);
      yPos += 20;
    }

    if (venta.direccion) {
      doc.font('Helvetica-Bold')
         .text('Dirección:', 65, yPos)
         .font('Helvetica')
         .text(venta.direccion, 125, yPos);
      yPos += 20;
    }

    doc.font('Helvetica-Bold')
       .text('Método de pago:', 65, yPos)
       .font('Helvetica')
       .text(venta.metodoPago || '—', 160, yPos);

    // ========== TABLA DE PRODUCTOS ==========
    yPos += 40;
    doc.fillColor(colorPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Productos / Servicios', 50, yPos);

    yPos += 25;
    const tableTop = yPos;
    const colProducto = 50;
    const colCantidad = 320;
    const colPrecioUnit = 390;
    const colSubtotal = 480;
    const rowHeight = 30;

    // Encabezados de tabla
    doc.rect(colProducto, tableTop, 495, rowHeight)
       .fillAndStroke(colorFondo, colorBorde);

    doc.fillColor(colorPrimario)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Producto / Servicio', colProducto + 10, tableTop + 10, { width: 250 })
       .text('Cant.', colCantidad + 5, tableTop + 10, { width: 60, align: 'center' })
       .text('Precio unit.', colPrecioUnit + 5, tableTop + 10, { width: 80, align: 'right' })
       .text('Subtotal', colSubtotal + 5, tableTop + 10, { width: 60, align: 'right' });

    yPos = tableTop + rowHeight;

    // Filas de productos
    const productos = venta.productosComprados || [];
    productos.forEach((p, i) => {
      // Alternar color de fondo
      if (i % 2 === 0) {
        doc.rect(colProducto, yPos, 495, rowHeight)
           .fillAndStroke('#ffffff', colorBorde);
      } else {
        doc.rect(colProducto, yPos, 495, rowHeight)
           .fillAndStroke('#fafcff', colorBorde);
      }

      doc.fillColor(colorTexto)
         .fontSize(9)
         .font('Helvetica')
         .text(p.nombre || '—', colProducto + 10, yPos + 10, { width: 250, ellipsis: true })
         .text(String(p.cantidad || 0), colCantidad + 5, yPos + 10, { width: 60, align: 'center' })
         .text(formatCurrency(p.precioUnitario || 0), colPrecioUnit + 5, yPos + 10, { width: 80, align: 'right' })
         .text(formatCurrency(p.subtotal || (p.precioUnitario || 0) * (p.cantidad || 0)), colSubtotal + 5, yPos + 10, { width: 60, align: 'right' });

      yPos += rowHeight;
    });

    // Fila de total
    doc.rect(colProducto, yPos, 495, rowHeight)
       .fillAndStroke('#fafcff', colorBorde);

    doc.fillColor(colorPrimario)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL', colProducto + 10, yPos + 10, { width: 350, align: 'right' });
    
    doc.text(formatCurrency(venta.totalVenta || 0), colPrecioUnit, yPos + 10, { width: 155, align: 'right' });

    yPos += rowHeight + 20;

    // ========== NOTAS (si existen) ==========
    if (venta.notas) {
      yPos += 10;
      doc.roundedRect(50, yPos, 495, 60, 6)
         .fillAndStroke('#fff9f0', '#ffd580');
      
      doc.fillColor('#856404')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Notas:', 65, yPos + 10);
      
      doc.fillColor(colorTexto)
         .font('Helvetica')
         .text(venta.notas, 65, yPos + 25, { width: 465 });
      
      yPos += 70;
    }

    // ========== FOOTER ==========
    // Línea superior del footer
    yPos = Math.max(yPos + 20, 720);
    doc.moveTo(50, yPos)
       .lineTo(545, yPos)
       .strokeColor(colorBorde)
       .lineWidth(1)
       .stroke();

    yPos += 15;
    doc.fillColor('#6c757d')
       .fontSize(9)
       .font('Helvetica')
       .text('Gracias por tu compra.', 50, yPos);

    doc.text('Documento generado automáticamente.', 50, yPos, { align: 'right' });

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al generar comprobante PDF" });
  }
};

// Helper local para formatear moneda (ARS)
function formatCurrency(value) {
  if (value == null) value = 0;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}
