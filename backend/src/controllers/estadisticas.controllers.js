import VentasModel from "../models/ventasSchema.js";
import ServiciosModel from "../models/serviciosSchema.js";

// Estadísticas de ventas por categoría
export const estadisticasVentasPorCategoria = async (req, res) => {
  try {
    const { year } = req.query;
    
    let filtro = {};
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      filtro.fechaCompra = { $gte: startDate, $lte: endDate };
    }
    
    const ventas = await VentasModel.find(filtro);
    
    // Agregar por categoría
    const categorias = {};
    
    ventas.forEach(venta => {
      venta.productosComprados.forEach(producto => {
        const cat = producto.categoria || 'otros';
        if (!categorias[cat]) {
          categorias[cat] = { total: 0, cantidad: 0 };
        }
        categorias[cat].total += producto.subtotal;
        categorias[cat].cantidad += producto.cantidad;
      });
    });
    
    res.json({
      year: year || 'todos',
      categorias
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Estadísticas de ventas por mes
export const estadisticasVentasPorMes = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const ventas = await VentasModel.aggregate([
      {
        $match: {
          fechaCompra: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: "$fechaCompra" },
          total: { $sum: "$totalVenta" },
          cantidad: { $sum: 1 },
          ventas: { 
            $push: {
              id: "$_id",
              username: "$username",
              fecha: "$fechaCompra",
              total: "$totalVenta",
              productos: "$productosComprados"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Crear array con todos los meses (incluso los sin ventas)
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      nombre: new Date(currentYear, i).toLocaleString('es', { month: 'long' }),
      total: 0,
      cantidad: 0,
      ventas: []
    }));
    
    // Llenar con datos reales
    ventas.forEach(venta => {
      const index = venta._id - 1;
      meses[index].total = venta.total;
      meses[index].cantidad = venta.cantidad;
      meses[index].ventas = venta.ventas;
    });
    
    res.json({
      year: currentYear,
      meses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Estadísticas de servicios por tipo
export const estadisticasServiciosPorTipo = async (req, res) => {
  try {
    const { year } = req.query;
    
    let filtro = { 
      estado: 'entregado',
      fechaSalida: { $ne: null }
    };
    
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      filtro.fechaSalida = { $gte: startDate, $lte: endDate };
    }
    
    const servicios = await ServiciosModel.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: "$tipoServicio",
          cantidad: { $sum: 1 },
          totalIngresos: { $sum: "$presupuesto.total" }
        }
      },
      {
        $sort: { cantidad: -1 }
      }
    ]);
    
    res.json({
      year: year || 'todos',
      tipos: servicios.map(s => ({
        tipo: s._id,
        cantidad: s.cantidad,
        totalIngresos: s.totalIngresos
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Estadísticas de servicios por mes
export const estadisticasServiciosPorMes = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const servicios = await ServiciosModel.aggregate([
      {
        $match: {
          estado: 'entregado',
          fechaSalida: { $gte: startDate, $lte: endDate, $ne: null }
        }
      },
      {
        $group: {
          _id: { $month: "$fechaSalida" },
          cantidad: { $sum: 1 },
          totalIngresos: { $sum: "$presupuesto.total" },
          servicios: {
            $push: {
              id: "$_id",
              cliente: "$cliente",
              tipo: "$tipoServicio",
              marca: "$marcaProducto",
              fecha: "$fechaSalida",
              total: "$presupuesto.total"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Crear array con todos los meses
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      nombre: new Date(currentYear, i).toLocaleString('es', { month: 'long' }),
      cantidad: 0,
      totalIngresos: 0,
      servicios: []
    }));
    
    // Llenar con datos reales
    servicios.forEach(servicio => {
      const index = servicio._id - 1;
      meses[index].cantidad = servicio.cantidad;
      meses[index].totalIngresos = servicio.totalIngresos;
      meses[index].servicios = servicio.servicios;
    });
    
    res.json({
      year: currentYear,
      meses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Resumen general (dashboard)
export const resumenGeneral = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    
    // Total de ventas
    const totalVentas = await VentasModel.aggregate([
      {
        $match: {
          fechaCompra: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalVenta" },
          cantidad: { $sum: 1 }
        }
      }
    ]);
    
    // Total de servicios entregados
    const totalServicios = await ServiciosModel.aggregate([
      {
        $match: {
          estado: 'entregado',
          fechaSalida: { $gte: startDate, $lte: endDate, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$presupuesto.total" },
          cantidad: { $sum: 1 }
        }
      }
    ]);
    
    // Servicios pendientes
    const serviciosPendientes = await ServiciosModel.countDocuments({ estado: 'pendiente' });
    
    res.json({
      year: currentYear,
      ventas: totalVentas[0] || { total: 0, cantidad: 0 },
      servicios: totalServicios[0] || { total: 0, cantidad: 0 },
      serviciosPendientes,
      ingresosTotales: (totalVentas[0]?.total || 0) + (totalServicios[0]?.total || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};
