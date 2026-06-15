import UsuariosModel from "../models/usuariosSchema.js";
import bcrypt from "bcrypt";

export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await UsuariosModel.find();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export const crearUsuario = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({ message: "Username y password son requeridos", code: "VALIDATION_ERROR" });
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
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);
    const nuevoUsuario = new UsuariosModel({ 
      username, 
      password: passwordEncriptada, 
      email: email || undefined,
      role 
    });
    await nuevoUsuario.save();
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el usuario", code: "SERVER_ERROR" });
  }
}

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    // Validaciones básicas
    if (req.body.password && req.body.password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres", code: "PASSWORD_SHORT" });
    }
    if (!req.body.username) {
      return res.status(400).json({ message: "Username requerido", code: "VALIDATION_ERROR" });
    }
    
    // Verificar si el email ya existe (solo si se proporciona y es diferente al actual)
    if (req.body.email) {
      const usuarioActual = await UsuariosModel.findById(id);
      if (usuarioActual && usuarioActual.email !== req.body.email) {
        const emailExistente = await UsuariosModel.findOne({ email: req.body.email });
        if (emailExistente) {
          return res.status(400).json({ message: "El email ya está en uso", code: "EMAIL_EXISTS" });
        }
      }
    }
    
    const update = { 
      username: req.body.username, 
      role: req.body.role,
      email: req.body.email || undefined
    };
    // Si viene password, encriptar
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(req.body.password, salt);
    }
    const usuario = await UsuariosModel.findByIdAndUpdate(id, update, { new: true });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
}

export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await UsuariosModel.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });

    // Borrado en cascada: eliminar ventas y carritos asociados
    // Importar modelos
    // Ventas: username
    // Carritos: username
    // Obtener el username del usuario borrado
    const username = usuario.username;
    // Lazy import para evitar problemas circulares
    const VentasModel = (await import("../models/ventasSchema.js")).default;
    const CartsModel = (await import("../models/cartsSchema.js")).default;
    // Eliminar ventas
    await VentasModel.deleteMany({ username });
    // Eliminar carritos
    await CartsModel.deleteMany({ username });

    res.json({ message: "Usuario y datos asociados eliminados correctamente.", code: "DELETED" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
}

export const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await UsuariosModel.findById(id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado", code: "NOT_FOUND" });
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const usuario = await UsuariosModel.findOne({ username });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) return res.status(401).json({ message: "Contraseña incorrecta" });
    res.json({ message: "Login exitoso", usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}