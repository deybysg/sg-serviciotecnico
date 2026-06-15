import { getPool } from '../database/postgres.js';
import bcrypt from 'bcrypt';

export const obtenerUsuarios = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, username, role, email, is_protected, created_at, updated_at FROM usuarios ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const obtenerUsuario = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { rows } = await pool.query('SELECT id, username, role, email, is_protected, created_at, updated_at FROM usuarios WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username y password son requeridos", code: "VALIDATION_ERROR" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres", code: "PASSWORD_SHORT" });
    }
    const pool = getPool();
    const { rows: existing } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "El nombre de usuario ya está en uso", code: "USERNAME_EXISTS" });
    }
    if (email) {
      const { rows: existingEmail } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: "El email ya está en uso", code: "EMAIL_EXISTS" });
      }
    }
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, password, email, role)
       VALUES ($1, $2, $3, $4) RETURNING id, username, role, email, is_protected, created_at, updated_at`,
      [username, passwordEncriptada, email || null, role || 'user']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el usuario", code: "SERVER_ERROR" });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, role } = req.body;
    if (password && password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres", code: "PASSWORD_SHORT" });
    }
    if (!username) {
      return res.status(400).json({ message: "Username requerido", code: "VALIDATION_ERROR" });
    }
    const pool = getPool();
    const { rows: current } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (current.length === 0) return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });
    if (email && current[0].email !== email) {
      const { rows: existingEmail } = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND id <> $2', [email, id]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: "El email ya está en uso", code: "EMAIL_EXISTS" });
      }
    }
    let updates = [];
    let values = [];
    let idx = 1;
    if (username) { updates.push(`username = $${idx}`); values.push(username); idx++; }
    if (role) { updates.push(`role = $${idx}`); values.push(role); idx++; }
    if (email !== undefined) { updates.push(`email = $${idx}`); values.push(email || null); idx++; }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordEncriptada = await bcrypt.hash(password, salt);
      updates.push(`password = $${idx}`); values.push(passwordEncriptada); idx++;
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, username, role, email, is_protected, created_at, updated_at`,
      values
    );
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
};

export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });
    const username = rows[0].username;
    await pool.query('DELETE FROM ventas WHERE username = $1', [username]);
    await pool.query('DELETE FROM carts WHERE username = $1', [username]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ message: "Usuario y datos asociados eliminados correctamente.", code: "DELETED" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    const usuario = rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) return res.status(401).json({ message: "Contraseña incorrecta" });
    res.json({ message: "Login exitoso", usuario: { id: usuario.id, username: usuario.username, role: usuario.role, isProtected: usuario.is_protected } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
