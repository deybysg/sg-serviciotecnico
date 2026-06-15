import CartsModel from "../models/cartsSchema.js";

// Obtener carrito por username
export const obtenerCarrito = async (req, res) => {
  try {
    // Permitir query param pero forzar que coincida con el usuario autenticado (salvo admin/superadmin)
    const requested = req.query.username || req.user?.username;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    console.log('🛒 [Backend GET Cart] Token user:', req.user?.username, 'Requested:', requested);

    if (!requested) {
      return res.status(400).json({ mensaje: "Username es requerido" });
    }

    if (!isAdmin && requested !== req.user.username) {
      return res.status(403).json({ mensaje: "No puedes acceder al carrito de otro usuario" });
    }

    console.log('🛒 [Backend GET Cart] Buscando carrito con _id:', requested);
    const carrito = await CartsModel.findById(requested);
    
    console.log('🛒 [Backend GET Cart] Carrito encontrado:', carrito ? `Sí (_id: ${carrito._id}, items: ${carrito.items.length})` : 'No');
    
    if (!carrito) {
      // Crear carrito vacío si no existe
      const nuevoCarrito = new CartsModel({
        _id: requested,
        username: requested,
        items: [],
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });
      await nuevoCarrito.save();
      return res.json(nuevoCarrito);
    }
    
    // Verificar si el carrito ha expirado
    if (carrito.expiresAt && new Date() > carrito.expiresAt) {
      // Carrito expirado, limpiar items
      carrito.items = [];
      carrito.updatedAt = new Date();
      carrito.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await carrito.save();
    }
    
    res.json(carrito);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Crear o actualizar carrito
export const upsertCarrito = async (req, res) => {
  try {
    const { items } = req.body;
    const actor = req.user?.username;

    console.log('🛒 [Backend PUT Cart] Token user:', actor, 'Items recibidos:', items?.length || 0);

    if (!actor) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }

    console.log('🛒 [Backend PUT Cart] Actualizando carrito con _id:', actor);
    const carrito = await CartsModel.findByIdAndUpdate(
      actor,
      {
        _id: actor,
        username: actor,
        items,
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // renovar 24 horas desde ahora
      },
      { new: true, upsert: true }
    );
    
    console.log('🛒 [Backend PUT Cart] Carrito guardado:', carrito._id, 'Items:', carrito.items.length);
    res.json(carrito);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el carrito" });
  }
};

// Limpiar carrito
export const limpiarCarrito = async (req, res) => {
  try {
    // Permitir limpiar por ruta con param o por usuario autenticado
    const requested = req.params.username || req.user?.username;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!requested) {
      return res.status(400).json({ mensaje: "Username es requerido" });
    }

    if (!isAdmin && requested !== req.user.username) {
      return res.status(403).json({ mensaje: "No puedes limpiar el carrito de otro usuario" });
    }

    const carrito = await CartsModel.findByIdAndUpdate(
      requested,
      { 
        items: [], 
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // renovar expiración
      },
      { new: true }
    );
    
    if (!carrito) {
      return res.status(404).json({ mensaje: "Carrito no encontrado" });
    }
    
    res.json(carrito);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

// Limpiar todos los carritos (solo superadmin)
export const limpiarTodosLosCarritos = async (req, res) => {
  try {
    const role = req.user?.role;
    const actor = req.user?.username || req.user?.id || 'desconocido';
    if (role !== 'superadmin') {
      return res.status(403).json({ mensaje: 'No autorizado' });
    }
    const result = await CartsModel.updateMany({}, {
      $set: {
        items: [],
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    console.log(`🧹 [RESET ALL CARTS] actor=${actor} role=${role} modified=${result.modifiedCount} at=${new Date().toISOString()}`);
    res.json({ mensaje: 'Todos los carritos fueron limpiados', modificados: result.modifiedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};
