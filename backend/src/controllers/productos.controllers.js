import ProductosModel from "../models/productosSchema";

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

    const producto = await ProductosModel.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
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


