import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const LOCALE = 'es-AR';

const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return '$0';
    return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(Number(value));
};

const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(LOCALE);
};

const getFechaActual = () => {
    const now = new Date();
    return now.toLocaleDateString(LOCALE) + ' ' + now.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
};

// =================================================================
// GENERACIÓN DE PDF
// =================================================================

export const generarPDF = ({ titulo, subtitulo, columnas, filas, nombreArchivo }) => {
    const doc = new jsPDF({ orientation: filas.length > 30 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, margin, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const subtituloLinea = subtitulo || `Generado: ${getFechaActual()}`;
    doc.text(subtituloLinea, margin, 25);
    doc.setTextColor(0, 0, 0);

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 28, pageWidth - margin, 28);

    // Calcular anchos de columna
    const colCount = columnas.length;
    const colWidths = columnas.map(col => col.width || (contentWidth / colCount));
    const totalUsedWidth = colWidths.reduce((s, w) => s + w, 0);
    const scale = totalUsedWidth > contentWidth ? contentWidth / totalUsedWidth : 1;
    const finalWidths = colWidths.map(w => w * scale);

    let y = 34;
    const rowHeight = 7;
    const headerHeight = 8;

    const drawHeader = () => {
        doc.setFillColor(30, 40, 70);
        doc.rect(margin, y, contentWidth, headerHeight, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        let x = margin + 2;
        columnas.forEach((col, i) => {
            doc.text(col.label, x, y + 5.5);
            x += finalWidths[i];
        });
        doc.setTextColor(0, 0, 0);
        y += headerHeight;
    };

    drawHeader();

    // Filas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    filas.forEach((fila, rowIndex) => {
        if (y + rowHeight > pageHeight - 15) {
            doc.addPage();
            y = 18;
            drawHeader();
        }

        if (rowIndex % 2 === 0) {
            doc.setFillColor(245, 247, 252);
            doc.rect(margin, y, contentWidth, rowHeight, 'F');
        }

        let x = margin + 2;
        columnas.forEach((col, i) => {
            const valor = fila[col.key] ?? '-';
            doc.setTextColor(50, 50, 50);
            doc.text(String(valor), x, y + 5);
            x += finalWidths[i];
        });

        y += rowHeight;
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sistema SG - ${getFechaActual()}`, margin, pageHeight - 8);
    doc.text(`Total: ${filas.length} registros`, pageWidth - margin - 30, pageHeight - 8);

    doc.save(`${nombreArchivo}.pdf`);
};

// =================================================================
// GENERACIÓN DE EXCEL
// =================================================================

export const generarExcel = ({ titulo, sheetName, columnas, filas, nombreArchivo }) => {
    const wb = XLSX.utils.book_new();

    // Construir datos: título + headers + filas
    const datos = [];

    // Fila del título
    datos.push([titulo]);
    datos.push([`Generado: ${getFechaActual()}`]);
    datos.push([]); // fila vacía

    // Headers
    datos.push(columnas.map(col => col.label));

    // Filas de datos
    filas.forEach(fila => {
        datos.push(columnas.map(col => {
            const val = fila[col.key];
            if (val === null || val === undefined) return '-';
            return val;
        }));
    });

    // Fila resumen
    datos.push([]);
    datos.push([`Total: ${filas.length} registros`]);

    const ws = XLSX.utils.aoa_to_sheet(datos);

    // Combinar celda del título
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columnas.length - 1 } }];

    // Auto-anchos de columna
    const colWidths = columnas.map(col => {
        const maxLen = Math.max(
            col.label.length,
            ...filas.map(f => String(f[col.key] ?? '-').length)
        );
        return { wch: Math.min(maxLen + 4, 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Reporte');

    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
};

// =================================================================
// FUNCIONES DE CÁLCULO DE DATOS
// =================================================================

export const calcularProductosMasVendidos = (ventas) => {
    const map = new Map();
    ventas.forEach(venta => {
        venta.productosComprados?.forEach(p => {
            const nombre = p.nombre;
            const cantidad = p.cantidad || 1;
            const precio = p.precioUnitario || 0;
            if (map.has(nombre)) {
                const existing = map.get(nombre);
                existing.cantidad += cantidad;
                existing.ingresos += precio * cantidad;
            } else {
                map.set(nombre, { nombre, cantidad, ingresos: precio * cantidad });
            }
        });
    });
    return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad);
};

export const calcularProductosMenosVendidos = (ventas) => {
    return calcularProductosMasVendidos(ventas).sort((a, b) => a.cantidad - b.cantidad);
};

export const calcularProductosSinMovimiento = (productos, ventas) => {
    const vendidos = new Set();
    ventas.forEach(venta => {
        venta.productosComprados?.forEach(p => vendidos.add(p.nombre));
    });
    return productos
        .filter(p => !vendidos.has(p.nombre))
        .map(p => ({
            nombre: p.nombre,
            codigo: p.codigo || '-',
            categoria: p.categoria || '-',
            stock: p.stock ?? 0,
            precio: p.precio ?? 0
        }));
};

export const calcularStockBajo = (productos, umbral = 5) => {
    return productos
        .filter(p => (p.stock ?? 0) <= umbral)
        .map(p => ({
            nombre: p.nombre,
            codigo: p.codigo || '-',
            categoria: p.categoria || '-',
            stock: p.stock ?? 0,
            precio: p.precio ?? 0
        }))
        .sort((a, b) => a.stock - b.stock);
};

export const calcularDistribucionCategoria = (ventas) => {
    const map = {};
    ventas.forEach(venta => {
        venta.productosComprados?.forEach(p => {
            const cat = p.categoria || 'Sin categoría';
            const cant = p.cantidad || 1;
            map[cat] = (map[cat] || 0) + cant;
        });
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
        .map(([categoria, cantidad]) => ({
            categoria,
            cantidad,
            porcentaje: total > 0 ? ((cantidad / total) * 100).toFixed(1) + '%' : '0%'
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
};

export const calcularResumenMensualServicios = (servicios) => {
    const map = {};
    servicios.filter(s => s.estado === 'entregado' && s.fechaSalida).forEach(s => {
        const d = new Date(s.fechaSalida);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        if (!map[key]) map[key] = { mes: label, cantidad: 0, ingresos: 0 };
        map[key].cantidad += 1;
        map[key].ingresos += Number(s.presupuesto?.total || 0);
    });
    return Object.values(map).sort((a, b) => b.ingresos - a.ingresos);
};

export const calcularServiciosPorTipo = (servicios) => {
    const map = {};
    servicios.filter(s => s.estado === 'entregado').forEach(s => {
        const tipo = s.tipoServicio || 'Otros';
        map[tipo] = (map[tipo] || 0) + 1;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
        .map(([tipo, cantidad]) => ({
            tipo,
            cantidad,
            porcentaje: total > 0 ? ((cantidad / total) * 100).toFixed(1) + '%' : '0%'
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
};
