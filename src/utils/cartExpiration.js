// src/utils/cartExpiration.js

import Swal from 'sweetalert2';

// Duración de expiración del carrito: 24 horas
export const CART_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
//1 * 60 * 1000; // 1 minuto para pruebas
/**
 * Obtener timestamp de expiración del carrito
 */
export const getCartExpiration = () => {
    const expiration = localStorage.getItem('cart_expiration');
    return expiration ? parseInt(expiration) : null;
};

/**
 * Establecer timestamp de expiración del carrito
 */
export const setCartExpiration = () => {
    const expiration = Date.now() + CART_EXPIRATION_TIME;
    localStorage.setItem('cart_expiration', expiration.toString());
    return expiration;
};

/**
 * Limpiar timestamp de expiración
 */
export const clearCartExpiration = () => {
    localStorage.removeItem('cart_expiration');
};

/**
 * Verificar si el carrito ha expirado
 */
export const checkCartExpiration = (clearCartCallback) => {
    const expiration = getCartExpiration();
    
    if (!expiration) return false;
    
    const now = Date.now();
    
    if (now > expiration) {
        // Carrito expirado
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Carrito expirado',
            text: 'Los productos en tu carrito han expirado (24h)',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });
        
        clearCartExpiration();
        if (clearCartCallback) clearCartCallback();
        return true;
    }
    
    return false;
};

/**
 * Mostrar alerta de expiración si quedan pocas horas
 */
export const showExpirationWarning = () => {
    const expiration = getCartExpiration();
    
    if (!expiration) return;
    
    const now = Date.now();
    const timeLeft = expiration - now;
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    
    if (hoursLeft <= 2 && hoursLeft > 0) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: '⏰ Recordatorio',
            text: `Los productos en tu carrito expiran en ${hoursLeft}h`,
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });
    }
};

/**
 * Mostrar alerta al agregar primer producto
 */
export const showFirstItemAlert = () => {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: '🛒 Producto agregado',
        text: 'Los productos en tu carrito duran 24 horas',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
    });
};
