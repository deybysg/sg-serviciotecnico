import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: API });

export async function getCartByUsername(username) {
  const res = await api.get('/carts', { params: { username } });
  return res.data && res.data.length ? res.data[0] : null;
}

export async function createCart(cart) {
  const res = await api.post('/carts', cart);
  return res.data;
}

export async function updateCart(id, partial) {
  const res = await api.patch(`/carts/${id}`, partial);
  return res.data;
}

export async function upsertCartByUsername(username, items) {
  if (!username) {
    // for guests, we won't persist to server
    return null;
  }

  const existing = await getCartByUsername(username);
  const payload = {
    username,
    items,
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    return updateCart(existing.id, payload);
  } else {
    // use username as id to make easier querying
    return createCart({ id: username, ...payload });
  }
}
