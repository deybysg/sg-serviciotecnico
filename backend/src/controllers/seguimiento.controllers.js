import mongoose from 'mongoose';
import Servicio from '../models/serviciosSchema.js';

// GET público: devuelve datos limitados del servicio por número (3-5 dígitos) o _id
export const obtenerServicioPublico = async (req, res) => {
  try {
    const { id } = req.params;
    let query = null;

    if (/^\d+$/.test(id)) {
      // Buscar por número de servicio
      query = { servicioNumero: Number(id) };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      // Permitir buscar también por _id si fuera necesario
      query = { _id: id };
    } else {
      return res.status(400).json({ message: 'Identificador inválido' });
    }

    const servicio = await Servicio.findOne(query)
      .select('servicioNumero estado fechaEntrada fechaSalida marcaProducto tipoServicio detalles presupuesto cliente detalleCliente seguimiento')
      .populate('cliente', 'nombreCompleto telefono');

    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    return res.json(servicio);
  } catch (err) {
    console.error('Error obtenerServicioPublico:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
