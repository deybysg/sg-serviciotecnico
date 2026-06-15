import { getPool } from '../database/postgres.js';

export const obtenerServicioPublico = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    let query;
    let params;
    if (/^\d+$/.test(id)) {
      query = `SELECT s.*, c.nombre_completo as cliente_nombre, c.celular as cliente_celular, c.correo as cliente_correo FROM servicios s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.servicio_numero = $1`;
      params = [parseInt(id)];
    } else {
      query = `SELECT s.*, c.nombre_completo as cliente_nombre, c.celular as cliente_celular, c.correo as cliente_correo FROM servicios s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.id = $1`;
      params = [id];
    }
    const { rows } = await pool.query(query, params);
    if (rows.length === 0) return res.status(404).json({ message: 'Servicio no encontrado' });
    const servicio = rows[0];
    servicio.seguimiento = typeof servicio.seguimiento === 'string' ? JSON.parse(servicio.seguimiento) : servicio.seguimiento;
    return res.json(servicio);
  } catch (err) {
    console.error('Error obtenerServicioPublico:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
