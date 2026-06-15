import { verifyToken } from '../helpers/jwtHelper.js';
import { isPostgres } from '../config/dbProvider.js';
import { getPool } from '../database/postgres.js';

// Middleware para verificar si el usuario está autenticado
export const authenticate = (req, res, next) => {
  try {
    // Primero buscamos token en header Authorization
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Si no viene por header, intentamos obtenerlo de la cookie 'token'
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ 
        mensaje: 'No autorizado. Token no proporcionado.' 
      });
    }
  const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        mensaje: 'Token inválido o expirado.' 
      });
    }

    // Agregar información del usuario a req
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      mensaje: 'Error de autenticación.' 
    });
  }
};

// Middleware para verificar roles específicos
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        mensaje: 'Usuario no autenticado.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para realizar esta acción.' 
      });
    }

    next();
  };
};

// Middleware para proteger al superadmin de edición/eliminación
export const protectSuperAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let isProtected = false;
    
    if (isPostgres()) {
      const pool = getPool();
      const { rows } = await pool.query('SELECT is_protected FROM usuarios WHERE id = $1', [id]);
      if (rows.length > 0 && rows[0].is_protected) {
        isProtected = true;
      }
    } else {
      const UsuariosModel = (await import('../models/usuariosSchema.js')).default;
      const usuario = await UsuariosModel.findById(id);
      if (usuario && usuario.isProtected) {
        isProtected = true;
      }
    }
    
    if (isProtected) {
      return res.status(403).json({ 
        mensaje: 'No se puede modificar o eliminar al SuperAdmin.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      mensaje: 'Error al verificar protección de usuario.' 
    });
  }
};
