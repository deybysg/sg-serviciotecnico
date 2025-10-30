import { api } from './api';

/**
 * Obtener el carrito de un usuario
 */
export async function getCartByUsername(username) {
  try {
    // El backend usará el usuario autenticado; el username se ignora salvo admin
    const cart = await api.get(`/carts`);
    return cart || null;
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    return null;
  }
}

/**
 * Guardar o actualizar el carrito
 */
export async function upsertCartByUsername(username, items) {
  if (!username) {
    // Para invitados, no persistimos en el servidor
    return null;
  }

  try {
    const payload = {
      // el backend tomará el username del token
      items,
      updatedAt: new Date().toISOString()
    };

    const cart = await api.put('/carts', payload);
    return cart;
  } catch (error) {
    console.error('Error al guardar carrito:', error);
    throw error;
  }
}

/**
 * Limpiar el carrito del usuario
 */
export async function clearCart(username) {
  // Requiere sesión; el backend toma el usuario del token
  try {
    await api.patch(`/carts/limpiar`, {});
    return true;
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
    throw error;
  }
}
