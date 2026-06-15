import { getPool } from '../database/postgres.js';

export const obtenerClientes = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM clientes ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const obtenerCliente = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const { nombreCompleto, celular, telefono, correo, email, direccion, dni } = req.body;
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre_completo, celular, correo, direccion, dni)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombreCompleto, celular || telefono || '', correo || email || '', direccion || '', dni || '']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el cliente" });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreCompleto, celular, correo, direccion, dni } = req.body;
    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE clientes SET nombre_completo = $1, celular = $2, correo = $3, direccion = $4, dni = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [nombreCompleto, celular, correo, direccion, dni, id]
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json({ mensaje: "Cliente eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};
