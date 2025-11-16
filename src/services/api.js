// Helper para hacer fetch con autenticación automática
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Wrapper de fetch con manejo de JWT automático
 * @param {string} endpoint - Ruta relativa (ej: '/productos' o '/auth/login')
 * @param {object} options - Opciones de fetch (method, body, headers, etc)
 * @param {boolean} requiresAuth - Si requiere token JWT (default: true)
 */
export const apiFetch = async (endpoint, options = {}, requiresAuth = true) => {
    const url = `${API_URL}${endpoint}`;
    
    // Headers por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Agregar token si es necesario
    if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Configuración final
    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);

    // Manejar errores HTTP
        if (!response.ok) {
            // Si es 401, y la solicitud requería auth, redirigimos al login.
            // Si NO requería auth (página pública), NO redirigimos: solo lanzamos error.
            if (response.status === 401) {
                if (requiresAuth) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                    window.location.href = '/login'; // Redirigir al login
                    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                } else {
                    throw new Error('No autorizado (recurso público)');
                }
            }

            // Si es 403, no tiene permisos
            if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción.');
            }

            // Otros errores: intentamos extraer un mensaje útil del backend
            const errorData = await response.json().catch(() => ({}));
            const msg = (
                errorData.message ||
                errorData.mensaje ||
                (Array.isArray(errorData.errors) && errorData.errors[0]?.msg) ||
                `Error ${response.status}`
            );
            const err = new Error(msg);
            // Opcional: propagar código/status para decisiones en UI
            err.status = response.status;
            if (errorData.code) err.code = errorData.code;
            throw err;
        }

        // Parsear respuesta JSON
        return await response.json();
    } catch (error) {
        console.error(`Error en ${endpoint}:`, error);
        throw error;
    }
};

/**
 * Métodos HTTP comunes para usar fácilmente
 */
export const api = {
    // GET
    get: (endpoint, requiresAuth = true) => 
        apiFetch(endpoint, { method: 'GET' }, requiresAuth),

    // POST
    post: (endpoint, data, requiresAuth = true) => 
        apiFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }, requiresAuth),

    // PUT
    put: (endpoint, data, requiresAuth = true) => 
        apiFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, requiresAuth),

    // DELETE
    delete: (endpoint, requiresAuth = true) => 
        apiFetch(endpoint, { method: 'DELETE' }, requiresAuth),

    // PATCH
    patch: (endpoint, data, requiresAuth = true) => 
        apiFetch(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }, requiresAuth)
};

// Ejemplos de uso:
// import { api } from '../services/api';
//
// GET con auth automática:
//   const productos = await api.get('/productos', false); // false = no requiere auth
//
// POST con auth automática:
//   const nuevoProducto = await api.post('/productos', { nombre: 'Laptop', precio: 1000 });
//
// PUT con auth automática:
//   const actualizado = await api.put(`/productos/${id}`, { nombre: 'Laptop Pro' });
//
// DELETE con auth automática:
//   await api.delete(`/productos/${id}`);
