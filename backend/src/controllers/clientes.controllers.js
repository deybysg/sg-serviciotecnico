import ClientesModel from "../models/clientesSchema.js";

// Obtener todos los clientes
export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await ClientesModel.find().populate('serviciosRealizados');
    res.json(clientes);
  } catch (error) {   
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Obtener un cliente por ID
export const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await ClientesModel.findById(id).populate('serviciosRealizados');
    
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Crear cliente
export const crearCliente = async (req, res) => {
  try {
    const { nombreCompleto, celular, telefono, correo, email, direccion, dni } = req.body;
    
    const nuevoCliente = new ClientesModel({
      nombreCompleto,
      celular: celular || telefono || '',
      correo: correo || email || '',
      direccion: direccion || '',
      dni: dni || '',
      serviciosRealizados: []
    });
    
    await nuevoCliente.save();
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el cliente" });
  }
};

// Actualizar cliente
export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await ClientesModel.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Eliminar cliente
export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await ClientesModel.findByIdAndDelete(id);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    
    res.json({ mensaje: "Cliente eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};
