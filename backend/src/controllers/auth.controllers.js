import UsuariosModel from "../models/usuariosSchema.js";
import bcrypt from "bcrypt";
import crypto from 'crypto';
import { generateToken } from "../helpers/jwtHelper.js";
import { sendResetEmail } from '../helpers/emailHelper.js';

// Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña son requeridos", code: "VALIDATION_ERROR" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres", code: "PASSWORD_SHORT" });
    }

    // Buscar usuario
    const usuario = await UsuariosModel.findOne({ username });
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValida) {
      return res.status(401).json({ message: "Contraseña incorrecta", code: "BAD_CREDENTIALS" });
    }

    // Generar token
    const token = generateToken({
      id: usuario._id,
      username: usuario.username,
      role: usuario.role
    });

    // Además de devolver token, seteamos cookie HttpOnly para sesiones
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Responder con token y datos del usuario (sin password)
    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: usuario._id,
        username: usuario.username,
        role: usuario.role,
        isProtected: usuario.isProtected
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor", code: "SERVER_ERROR" });
  }
};

// Register
export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña son requeridos", code: "VALIDATION_ERROR" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres", code: "PASSWORD_SHORT" });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await UsuariosModel.findOne({ username });
    
    if (usuarioExistente) {
      return res.status(400).json({ message: "El nombre de usuario ya está en uso", code: "USERNAME_EXISTS" });
    }

    // Verificar si el email ya existe (solo si se proporciona)
    if (email) {
      const emailExistente = await UsuariosModel.findOne({ email });
      if (emailExistente) {
        return res.status(400).json({ message: "El email ya está en uso", code: "EMAIL_EXISTS" });
      }
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Crear nuevo usuario (role "user" por defecto)
    const nuevoUsuario = new UsuariosModel({
      username,
      password: passwordEncriptada,
        email: email || undefined, // Solo guardar si se proporciona
      role: "user",
      isProtected: false
    });

    await nuevoUsuario.save();

    // Generar token
    const token = generateToken({
      id: nuevoUsuario._id,
      username: nuevoUsuario.username,
      role: nuevoUsuario.role
    });

    // Setear cookie HttpOnly para sesión
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Responder con token y datos del usuario
    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      token,
      user: {
        id: nuevoUsuario._id,
        username: nuevoUsuario.username,
        role: nuevoUsuario.role,
        isProtected: nuevoUsuario.isProtected
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al registrar el usuario" });
  }
};

// Solicitar restablecimiento de contraseña
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Email requerido' });

    const usuario = await UsuariosModel.findOne({ email });
    
    // Por seguridad, siempre responder igual aunque el email no exista
    if (!usuario) {
      return res.json({ mensaje: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
    }

    // Generar token (plano) y guardar su hash en la BD
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    usuario.resetPasswordToken = resetTokenHash;
    usuario.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hora
    await usuario.save();

    // Enviar email con link (si tiene email)
      await sendResetEmail(usuario.email, resetToken, usuario.username);

      res.json({ mensaje: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar token de restablecimiento' });
  }
};

// Restablecer contraseña con token
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ mensaje: 'Token y contraseña son requeridos' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const usuario = await UsuariosModel.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!usuario) return res.status(400).json({ mensaje: 'Token inválido o expirado' });

    // Hashear nueva contraseña y limpiar token
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    await usuario.save();

    res.json({ mensaje: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al restablecer contraseña' });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
  try {
    const usuario = await UsuariosModel.findById(req.user.id).select('-password');
    
    if (!usuario) {
      return res.status(404).json({ 
        mensaje: "Usuario no encontrado" 
      });
    }

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener perfil" });
  }
};
