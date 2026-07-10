import ProductosModel from "../models/productosSchema.js";
import AjustesModel from "../models/ajustesSchema.js";

export const obtenerProductos = async(req, res) => {

  try {
    const productos = await ProductosModel.find();
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export const crearProducto = async (req, res) => {
  try {
    // Verificar que el código no esté duplicado
    if (req.body.codigo) {
      const existe = await ProductosModel.findOne({ codigo: req.body.codigo.trim() });
      if (existe) {
        return res.status(400).json({ mensaje: "Ya existe un producto con ese código" });
      }
    }

    const nuevoProducto = new ProductosModel(req.body);
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: "Ya existe un producto con ese código" });
    }
    res.status(500).json({ mensaje: "Error al crear el producto" });
  }
}

export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el código no esté duplicado (excluyendo el producto actual)
    if (req.body.codigo) {
      const existe = await ProductosModel.findOne({ 
        codigo: req.body.codigo.trim(), 
        _id: { $ne: id } 
      });
      if (existe) {
        return res.status(400).json({ mensaje: "Ya existe un producto con ese código" });
      }
    }

    // Obtener el producto antes de actualizar para comparar cambios
    const productoAntes = await ProductosModel.findById(id);
    if (!productoAntes) return res.status(404).json({ message: "Producto no encontrado" });

    const producto = await ProductosModel.findByIdAndUpdate(id, req.body, { new: true });
    
    // Detectar cambios y registrar ajuste
    const cambios = {};
    let hayCambios = false;
    
    const stockNuevo = req.body.stock !== undefined ? Number(req.body.stock) : undefined;
    const precioNuevo = req.body.precio !== undefined ? Number(req.body.precio) : undefined;
    
    if (stockNuevo !== undefined && stockNuevo !== Number(productoAntes.stock)) {
      cambios.stock = { anterior: Number(productoAntes.stock), nuevo: stockNuevo };
      hayCambios = true;
    }
    if (precioNuevo !== undefined && precioNuevo !== Number(productoAntes.precio)) {
      cambios.precio = { anterior: Number(productoAntes.precio), nuevo: precioNuevo };
      hayCambios = true;
    }
    if (req.body.nombre && req.body.nombre !== productoAntes.nombre) {
      cambios.nombre = { anterior: productoAntes.nombre, nuevo: req.body.nombre };
      hayCambios = true;
    }
    if (req.body.categoria && req.body.categoria !== productoAntes.categoria) {
      cambios.categoria = { anterior: productoAntes.categoria, nuevo: req.body.categoria };
      hayCambios = true;
    }

    if (hayCambios) {
      const usuario = req.user?.username || 'admin';
      try {
        await AjustesModel.create({
          productoId: id,
          productoNombre: producto.nombre,
          productoCodigo: producto.codigo,
          tipo: 'modificacion',
          cambios,
          stockAnterior: Number(productoAntes.stock),
          stockNuevo: Number(producto.stock),
          precioAnterior: Number(productoAntes.precio),
          precioNuevo: Number(producto.precio),
          motivo: req.body.motivo || '',
          usuario
        });
      } catch (err) {
        console.error('Error al crear ajuste:', err.message);
      }
    }
    
    res.json(producto);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: "Ya existe un producto con ese código" });
    }
    res.status(500).json({ message: error.message });
  }
}

export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await ProductosModel.findByIdAndDelete(id);
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await ProductosModel.findById(id);
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export const obtenerProductosNuevos = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const productos = await ProductosModel.find({ 
      createdAt: { $gte: sevenDaysAgo } 
    }).sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}


