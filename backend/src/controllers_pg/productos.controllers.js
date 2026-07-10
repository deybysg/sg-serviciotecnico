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
    const { codigo, nombre, categoria, precio, stock, descripcion, imagen } = req.body;
    
    // Validar que el código no esté vacío
    if (!codigo || codigo.trim() === '') {
      return res.status(400).json({ mensaje: "El código del producto es obligatorio" });
    }

    // Validar que el código no esté duplicado
    const codigoExistente = await pool.query('SELECT id FROM productos WHERE LOWER(codigo) = LOWER($1)', [codigo.trim()]);
    if (codigoExistente.rows.length > 0) {
      return res.status(400).json({ mensaje: "Ya existe un producto con ese código" });
    }

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
      `INSERT INTO productos (codigo, nombre, categoria, precio, stock, descripcion, imagen)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [codigo.trim(), nombre, categoriaFinal, precioFinal, stockFinal, descripcionFinal, imagenFinal]
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
    const { codigo, nombre, categoria, precio, stock, descripcion, imagen } = req.body;

    if (!codigo || codigo.trim() === '') {
      return res.status(400).json({ mensaje: "El código del producto es obligatorio" });
    }

    // Validar que el código no esté duplicado (excluyendo el producto actual)
    const codigoExistente = await pool.query(
      'SELECT id FROM productos WHERE LOWER(codigo) = LOWER($1) AND id != $2', 
      [codigo.trim(), id]
    );
    if (codigoExistente.rows.length > 0) {
      return res.status(400).json({ mensaje: "Ya existe un producto con ese código" });
    }
    
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: "El nombre del producto es obligatorio" });
    }

    // Obtener el producto antes de actualizar para comparar cambios
    const { rows: productoAntesRows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (productoAntesRows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    const productoAntes = productoAntesRows[0];
    
    const descripcionFinal = descripcion || '';
    const imagenFinal = imagen || '/img/default-product.png';
    const categoriaFinal = categoria || 'General';
    const precioFinal = precio || 0;
    const stockFinal = stock || 0;
    
    const { rows } = await pool.query(
      `UPDATE productos SET codigo = $1, nombre = $2, categoria = $3, precio = $4, stock = $5, descripcion = $6, imagen = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [codigo.trim(), nombre, categoriaFinal, precioFinal, stockFinal, descripcionFinal, imagenFinal, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    const producto = rows[0];

    // Detectar cambios y registrar ajuste
    const cambios = {};
    let hayCambios = false;
    
    const stockNuevo = stock !== undefined ? Number(stock) : undefined;
    const precioNuevo = precio !== undefined ? Number(precio) : undefined;
    
    if (stockNuevo !== undefined && stockNuevo !== Number(productoAntes.stock)) {
      cambios.stock = { anterior: Number(productoAntes.stock), nuevo: stockNuevo };
      hayCambios = true;
    }
    if (precioNuevo !== undefined && precioNuevo !== Number(productoAntes.precio)) {
      cambios.precio = { anterior: Number(productoAntes.precio), nuevo: precioNuevo };
      hayCambios = true;
    }
    if (nombre && nombre !== productoAntes.nombre) {
      cambios.nombre = { anterior: productoAntes.nombre, nuevo: nombre };
      hayCambios = true;
    }
    if (categoria && categoria !== productoAntes.categoria) {
      cambios.categoria = { anterior: productoAntes.categoria, nuevo: categoria };
      hayCambios = true;
    }

    if (hayCambios) {
      const usuario = req.user?.username || 'admin';
      try {
        await pool.query(
          `INSERT INTO ajustes (producto_id, producto_nombre, producto_codigo, tipo, cambios, stock_anterior, stock_nuevo, precio_anterior, precio_nuevo, motivo, usuario)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [id, producto.nombre, producto.codigo, 'modificacion', JSON.stringify(cambios), Number(productoAntes.stock), Number(producto.stock), Number(productoAntes.precio), Number(producto.precio), req.body.motivo || '', usuario]
        );
      } catch (err) {
        console.error('Error al crear ajuste:', err.message);
      }
    }
    
    res.json(producto);
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

export const obtenerProductosNuevos = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT * FROM productos WHERE created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
