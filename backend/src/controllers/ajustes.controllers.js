import AjustesModel from "../models/ajustesSchema.js";

// Obtener todos los ajustes
export const obtenerAjustes = async (req, res) => {
  try {
    const ajustes = await AjustesModel.find().sort({ createdAt: -1 });
    res.json(ajustes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener ajustes por producto
export const obtenerAjustesPorProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    const ajustes = await AjustesModel.find({ productoId }).sort({ createdAt: -1 });
    res.json(ajustes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Crear un ajuste
export const crearAjuste = async (req, res) => {
  try {
    const { productoId, productoNombre, productoCodigo, tipo, cambios, stockAnterior, stockNuevo, precioAnterior, precioNuevo, motivo, usuario } = req.body;
    
    const nuevoAjuste = new AjustesModel({
      productoId,
      productoNombre,
      productoCodigo,
      tipo,
      cambios,
      stockAnterior,
      stockNuevo,
      precioAnterior,
      precioNuevo,
      motivo,
      usuario
    });
    
    await nuevoAjuste.save();
    res.status(201).json(nuevoAjuste);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
