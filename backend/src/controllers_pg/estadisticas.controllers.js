import { getPool } from '../database/postgres.js';

export const estadisticasVentasPorCategoria = async (req, res) => {
  try {
    const { year } = req.query;
    const pool = getPool();
    let query = 'SELECT productos_comprados, fecha_compra FROM ventas';
    const params = [];
    if (year) {
      query += ' WHERE fecha_compra >= $1 AND fecha_compra <= $2';
      params.push(new Date(year, 0, 1));
      params.push(new Date(year, 11, 31, 23, 59, 59));
    }
    const { rows } = await pool.query(query, params);
    const categorias = {};
    rows.forEach(venta => {
      const productos = typeof venta.productos_comprados === 'string' ? JSON.parse(venta.productos_comprados) : venta.productos_comprados || [];
      productos.forEach(producto => {
        const cat = producto.categoria || 'otros';
        if (!categorias[cat]) categorias[cat] = { total: 0, cantidad: 0 };
        categorias[cat].total += producto.subtotal || 0;
        categorias[cat].cantidad += producto.cantidad || 0;
      });
    });
    res.json({ year: year || 'todos', categorias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const estadisticasVentasPorMes = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_compra) as mes, SUM(total_venta) as total, COUNT(*) as cantidad,
        json_agg(json_build_object('id', id, 'username', username, 'fecha', fecha_compra, 'total', total_venta, 'productos', productos_comprados)) as ventas
       FROM ventas WHERE fecha_compra >= $1 AND fecha_compra <= $2 GROUP BY EXTRACT(MONTH FROM fecha_compra) ORDER BY mes`,
      [new Date(currentYear, 0, 1), new Date(currentYear, 11, 31, 23, 59, 59)]
    );
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      nombre: new Date(currentYear, i).toLocaleString('es', { month: 'long' }),
      total: 0,
      cantidad: 0,
      ventas: []
    }));
    rows.forEach(venta => {
      const index = Math.round(venta.mes) - 1;
      meses[index].total = parseFloat(venta.total);
      meses[index].cantidad = parseInt(venta.cantidad);
      meses[index].ventas = venta.ventas || [];
    });
    res.json({ year: currentYear, meses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const estadisticasServiciosPorTipo = async (req, res) => {
  try {
    const { year } = req.query;
    const pool = getPool();
    let query = `SELECT tipo_servicio, COUNT(*) as cantidad, SUM(presupuesto_total) as total_ingresos FROM servicios WHERE estado = 'entregado' AND fecha_salida IS NOT NULL`;
    const params = [];
    if (year) {
      query += ` AND fecha_salida >= $1 AND fecha_salida <= $2`;
      params.push(new Date(year, 0, 1));
      params.push(new Date(year, 11, 31, 23, 59, 59));
    }
    query += ` GROUP BY tipo_servicio ORDER BY cantidad DESC`;
    const { rows } = await pool.query(query, params);
    res.json({ year: year || 'todos', tipos: rows.map(s => ({ tipo: s.tipo_servicio, cantidad: parseInt(s.cantidad), totalIngresos: parseFloat(s.total_ingresos) })) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const estadisticasServiciosPorMes = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_salida) as mes, COUNT(*) as cantidad, SUM(presupuesto_total) as total_ingresos,
        json_agg(json_build_object('id', id, 'cliente', cliente_id, 'tipo', tipo_servicio, 'marca', marca_producto, 'fecha', fecha_salida, 'total', presupuesto_total)) as servicios
       FROM servicios WHERE estado = 'entregado' AND fecha_salida >= $1 AND fecha_salida <= $2 AND fecha_salida IS NOT NULL
       GROUP BY EXTRACT(MONTH FROM fecha_salida) ORDER BY mes`,
      [new Date(currentYear, 0, 1), new Date(currentYear, 11, 31, 23, 59, 59)]
    );
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      nombre: new Date(currentYear, i).toLocaleString('es', { month: 'long' }),
      cantidad: 0,
      totalIngresos: 0,
      servicios: []
    }));
    rows.forEach(servicio => {
      const index = Math.round(servicio.mes) - 1;
      meses[index].cantidad = parseInt(servicio.cantidad);
      meses[index].totalIngresos = parseFloat(servicio.total_ingresos);
      meses[index].servicios = servicio.servicios || [];
    });
    res.json({ year: currentYear, meses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const resumenGeneral = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const pool = getPool();
    const { rows: totalVentas } = await pool.query(
      `SELECT COALESCE(SUM(total_venta), 0) as total, COUNT(*) as cantidad FROM ventas WHERE fecha_compra >= $1 AND fecha_compra <= $2`,
      [new Date(currentYear, 0, 1), new Date(currentYear, 11, 31, 23, 59, 59)]
    );
    const { rows: totalServicios } = await pool.query(
      `SELECT COALESCE(SUM(presupuesto_total), 0) as total, COUNT(*) as cantidad FROM servicios WHERE estado = 'entregado' AND fecha_salida >= $1 AND fecha_salida <= $2 AND fecha_salida IS NOT NULL`,
      [new Date(currentYear, 0, 1), new Date(currentYear, 11, 31, 23, 59, 59)]
    );
    const { rows: serviciosPendientes } = await pool.query(
      `SELECT COUNT(*) as count FROM servicios WHERE estado = 'pendiente'`
    );
    res.json({
      year: currentYear,
      ventas: totalVentas[0] || { total: 0, cantidad: 0 },
      servicios: totalServicios[0] || { total: 0, cantidad: 0 },
      serviciosPendientes: parseInt(serviciosPendientes[0].count),
      ingresosTotales: (parseFloat(totalVentas[0]?.total) || 0) + (parseFloat(totalServicios[0]?.total) || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};
