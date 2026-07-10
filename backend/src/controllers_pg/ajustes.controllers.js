import { getPool } from '../database/postgres.js';

// Obtener todos los ajustes
export const obtenerAjustes = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM ajustes ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener ajustes por producto
export const obtenerAjustesPorProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM ajustes WHERE producto_id = $1 ORDER BY created_at DESC', [productoId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Crear un ajuste
export const crearAjuste = async (req, res) => {
  try {
    const { productoId, productoNombre, productoCodigo, tipo, cambios, stockAnterior, stockNuevo, precioAnterior, precioNuevo, motivo, usuario, imagen } = req.body;
    
    console.log('[AJUSTES] Creando ajuste:', { productoId, productoNombre, tipo, usuario, cambiosCount: Object.keys(cambios || {}).length });
    
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO ajustes (producto_id, producto_nombre, producto_codigo, tipo, cambios, stock_anterior, stock_nuevo, precio_anterior, precio_nuevo, motivo, usuario, imagen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [productoId, productoNombre, productoCodigo, tipo, JSON.stringify(cambios || {}), stockAnterior || 0, stockNuevo || 0, precioAnterior || 0, precioNuevo || 0, motivo || '', usuario, imagen || '']
    );
    
    console.log('[AJUSTES] Ajuste creado exitosamente ID:', rows[0].id);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[AJUSTES] Error creando ajuste:', error);
    res.status(500).json({ message: error.message });
  }
};
