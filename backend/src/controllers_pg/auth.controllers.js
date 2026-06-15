import { getPool } from '../database/postgres.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken } from '../helpers/jwtHelper.js';
import { sendResetEmail } from '../helpers/emailHelper.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña son requeridos", code: "VALIDATION_ERROR" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres", code: "PASSWORD_SHORT" });
    }
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });
    }
    const usuario = rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: "Contraseña incorrecta", code: "BAD_CREDENTIALS" });
    }
    const token = generateToken({
      id: usuario.id,
      username: usuario.username,
      role: usuario.role
    });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role,
        isProtected: usuario.is_protected
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor", code: "SERVER_ERROR" });
  }
};

export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña son requeridos", code: "VALIDATION_ERROR" });
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
      `INSERT INTO usuarios (username, password, email, role, is_protected)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, email, is_protected, created_at, updated_at`,
      [username, passwordEncriptada, email || null, 'user', false]
    );
    const nuevoUsuario = rows[0];
    const token = generateToken({
      id: nuevoUsuario.id,
      username: nuevoUsuario.username,
      role: nuevoUsuario.role
    });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      token,
      user: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        role: nuevoUsuario.role,
        isProtected: nuevoUsuario.is_protected
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al registrar el usuario" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Email requerido' });
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.json({ mensaje: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
    }
    const usuario = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    await pool.query(
      'UPDATE usuarios SET reset_password_token_hash = $1, reset_password_expires = $2 WHERE id = $3',
      [resetTokenHash, new Date(Date.now() + 60 * 60 * 1000), usuario.id]
    );
    await sendResetEmail(usuario.email, resetToken, usuario.username);
    res.json({ mensaje: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar token de restablecimiento' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ mensaje: 'Token y contraseña son requeridos' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE reset_password_token_hash = $1 AND reset_password_expires > $2',
      [tokenHash, new Date()]
    );
    if (rows.length === 0) return res.status(400).json({ mensaje: 'Token inválido o expirado' });
    const usuario = rows[0];
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);
    await pool.query(
      'UPDATE usuarios SET password = $1, reset_password_token_hash = NULL, reset_password_expires = NULL WHERE id = $2',
      [passwordEncriptada, usuario.id]
    );
    res.json({ mensaje: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al restablecer contraseña' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, username, role, email, is_protected, created_at, updated_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener perfil" });
  }
};
