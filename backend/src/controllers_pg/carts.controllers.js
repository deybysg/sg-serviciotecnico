import { getPool } from '../database/postgres.js';

export const obtenerCarrito = async (req, res) => {
  try {
    const requested = req.query.username || req.user?.username;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    if (!requested) return res.status(400).json({ mensaje: "Username es requerido" });
    if (!isAdmin && requested !== req.user.username) return res.status(403).json({ mensaje: "No puedes acceder al carrito de otro usuario" });
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM carts WHERE username = $1', [requested]);
    if (rows.length === 0) {
      const { rows: newCart } = await pool.query(
        `INSERT INTO carts (username, items, updated_at, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours') RETURNING *`,
        [requested, JSON.stringify([])]
      );
      return res.json({ ...newCart[0], items: [] });
    }
    const carrito = rows[0];
    let items = carrito.items || [];
    if (typeof items === 'string') items = JSON.parse(items);
    if (carrito.expires_at && new Date() > new Date(carrito.expires_at)) {
      await pool.query(
        `UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours' WHERE username = $2`,
        [JSON.stringify([]), requested]
      );
      return res.json({ username: requested, items: [], updated_at: new Date(), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    }
    res.json({ ...carrito, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const upsertCarrito = async (req, res) => {
  try {
    const { items } = req.body;
    const actor = req.user?.username;
    if (!actor) return res.status(401).json({ mensaje: "No autenticado" });
    const pool = getPool();
    const { rows: existing } = await pool.query('SELECT * FROM carts WHERE username = $1', [actor]);
    if (existing.length === 0) {
      const { rows } = await pool.query(
        `INSERT INTO carts (username, items, updated_at, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours') RETURNING *`,
        [actor, JSON.stringify(items || [])]
      );
      return res.json({ ...rows[0], items: items || [] });
    }
    const { rows } = await pool.query(
      `UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours' WHERE username = $2 RETURNING *`,
      [JSON.stringify(items || []), actor]
    );
    res.json({ ...rows[0], items: items || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el carrito" });
  }
};

export const limpiarCarrito = async (req, res) => {
  try {
    const requested = req.params.username || req.user?.username;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    if (!requested) return res.status(400).json({ mensaje: "Username es requerido" });
    if (!isAdmin && requested !== req.user.username) return res.status(403).json({ mensaje: "No puedes limpiar el carrito de otro usuario" });
    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours' WHERE username = $2 RETURNING *`,
      [JSON.stringify([]), requested]
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Carrito no encontrado" });
    res.json({ ...rows[0], items: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const limpiarTodosLosCarritos = async (req, res) => {
  try {
    const role = req.user?.role;
    const actor = req.user?.username || req.user?.id || 'desconocido';
    if (role !== 'superadmin') return res.status(403).json({ mensaje: 'No autorizado' });
    const pool = getPool();
    const { rowCount } = await pool.query(
      `UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours'`,
      [JSON.stringify([])]
    );
    console.log(`🧹 [RESET ALL CARTS] actor=${actor} role=${role} modified=${rowCount} at=${new Date().toISOString()}`);
    res.json({ mensaje: 'Todos los carritos fueron limpiados', modificados: rowCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};
