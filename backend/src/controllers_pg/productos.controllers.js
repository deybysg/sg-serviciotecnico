import { getPool } from '../database/postgres.js';

export const obtenerProductos = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM productos ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const obtenerProducto = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const crearProducto = async (req, res) => {
  try {
    const pool = getPool();
    const { nombre, categoria, precio, stock, descripcion, imagen } = req.body;
    
    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: "El nombre del producto es obligatorio" });
    }
    
    // Asignar valores por defecto para campos vacíos
    const descripcionFinal = descripcion || '';
    const imagenFinal = imagen || '/img/default-product.png';
    const categoriaFinal = categoria || 'General';
    const precioFinal = precio || 0;
    const stockFinal = stock || 0;
    
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, categoria, precio, stock, descripcion, imagen)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, categoriaFinal, precioFinal, stockFinal, descripcionFinal, imagenFinal]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ mensaje: "Error al crear el producto: " + error.message });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { nombre, categoria, precio, stock, descripcion, imagen } = req.body;
    
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: "El nombre del producto es obligatorio" });
    }
    
    const descripcionFinal = descripcion || '';
    const imagenFinal = imagen || '/img/default-product.png';
    const categoriaFinal = categoria || 'General';
    const precioFinal = precio || 0;
    const stockFinal = stock || 0;
    
    const { rows } = await pool.query(
      `UPDATE productos SET nombre = $1, categoria = $2, precio = $3, stock = $4, descripcion = $5, imagen = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [nombre, categoriaFinal, precioFinal, stockFinal, descripcionFinal, imagenFinal, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
