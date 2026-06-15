import ServiciosModel from "../models/serviciosSchema.js";
import ClientesModel from "../models/clientesSchema.js";
import mongoose from 'mongoose';

// Obtener todos los servicios
export const obtenerServicios = async (req, res) => {
  try {
    const servicios = await ServiciosModel.find().populate('cliente');
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Obtener un servicio por ID (acepta _id de MongoDB o servicioNumero)
export const obtenerServicio = async (req, res) => {
  try {
    const { id } = req.params;
    let servicio;
    
    // Si el ID es numérico, buscar por servicioNumero
    if (/^\d+$/.test(id)) {
      servicio = await ServiciosModel.findOne({ servicioNumero: parseInt(id) }).populate('cliente');
    } else {
      // Si no, buscar por _id de MongoDB
      servicio = await ServiciosModel.findById(id).populate('cliente');
    }
    
    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }
    
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Crear servicio
export const crearServicio = async (req, res) => {
  try {
    const { cliente, marcaProducto, modeloProducto, tipoServicio, tipoEquipo, fallaReportada, asunto, detalles, notasAdicionales, metodoPago, anticipo, presupuesto, estado, fechaEntrada } = req.body;
    
    console.log("BODY RECIBIDO:", JSON.stringify(req.body, null, 2));
    
    // Verificar que el cliente existe
    const clienteExiste = await ClientesModel.findById(cliente);
    if (!clienteExiste) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    
    const nuevoServicio = new ServiciosModel({
      cliente,
      marcaProducto: marcaProducto || 'Sin marca',
      modeloProducto: modeloProducto || '',
      tipoServicio: tipoServicio || 'reparacion',
      tipoEquipo: tipoEquipo || '',
      fallaReportada: fallaReportada || '',
      asunto: asunto || '',
      detalles: detalles || '',
      notasAdicionales: notasAdicionales || '',
      metodoPago: metodoPago || '',
      anticipo: anticipo || 0,
      presupuesto: presupuesto || { items: [], subtotal: 0, iva: 0, total: 0 },
      estado: estado || 'pendiente',
      fechaEntrada: fechaEntrada || new Date(),
      fechaSalida: null
    });
    
    await nuevoServicio.save();
    
    await ClientesModel.findByIdAndUpdate(
      cliente,
      { $push: { serviciosRealizados: nuevoServicio._id } }
    );
    
    res.status(201).json(nuevoServicio);
  } catch (error) {
    console.error("ERROR CREAR SERVICIO:", error.message || error);
    res.status(500).json({ mensaje: error.message || "Error al crear el servicio" });
  }
};

// Actualizar servicio
export const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await ServiciosModel.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }
    
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Marcar servicio como entregado
export const marcarEntregado = async (req, res) => {
  try {
    const { id } = req.params;
    
    const servicio = await ServiciosModel.findByIdAndUpdate(
      id,
      { 
        estado: 'entregado',
        fechaSalida: new Date()
      },
      { new: true }
    );
    
    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }
    
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Eliminar servicio
export const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await ServiciosModel.findById(id);
    
    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }
    
    // Remover servicio del cliente
    await ClientesModel.findByIdAndUpdate(
      servicio.cliente,
      { $pull: { serviciosRealizados: id } }
    );
    
    await ServiciosModel.findByIdAndDelete(id);
    
    res.json({ mensaje: "Servicio eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Agregar entrada de seguimiento y opcionalmente actualizar estado/detalleCliente
export const agregarSeguimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje, tipo, autor, marcarSinSolucion, marcarNotificacion } = req.body;

    // Validar id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID de servicio inválido' });
    }

    const servicio = await ServiciosModel.findById(id);
    if (!servicio) return res.status(404).json({ mensaje: 'Servicio no encontrado' });

    // Construir entrada de seguimiento
    const entry = {
      tipo: tipo || (marcarNotificacion || marcarSinSolucion ? 'notificacion' : 'nota'),
      mensaje: mensaje || '',
      autor: autor || 'taller',
      fecha: new Date()
    };

    // Push a arreglo seguimiento (crea el array si no existe)
    servicio.seguimiento = servicio.seguimiento || [];
    servicio.seguimiento.push(entry);

    // Si el payload indica marcar notificacion (o tipo === 'notificacion'), actualizar estado y detalleCliente
    if (entry.tipo === 'notificacion' || marcarNotificacion || marcarSinSolucion) {
      servicio.estado = 'notificacion';
      servicio.detalleCliente = mensaje || servicio.detalleCliente || '';
    }

    await servicio.save();

    return res.json({ mensaje: 'Seguimiento agregado', servicio });
  } catch (error) {
    console.error('Error agregarSeguimiento:', error);
    return res.status(500).json({ mensaje: error.message });
  }
};
