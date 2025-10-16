import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
import { getCartByUsername, upsertCartByUsername } from '../services/cartService';

const GUEST_KEY = 'SG_cart_guest';

const CartContext = createContext();

// ----------------------------------------------------
// Hook personalizado para usar el carrito
// ----------------------------------------------------
export function useCart() {
    // Si se usa fuera del proveedor, React lanza un error útil
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart debe ser usado dentro de un CartProvider");
    }
    return context;
}

// ----------------------------------------------------
// Proveedor del Carrito
// ----------------------------------------------------
export function CartProvider({ children }) {
    const { user } = useAuth();

    // 1. Inicializar el carrito desde localStorage (guest) y luego intentar cargar del servidor si hay user
    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem(GUEST_KEY);
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error("Error al cargar carrito desde localStorage:", error);
            return [];
        }
    });

    const getStorageKey = (usr) => (usr && usr.username ? `SG_cart_${usr.username}` : GUEST_KEY);

    // 2. Guardar el carrito en localStorage cada vez que cambia (guest fallback)
    useEffect(() => {
        try {
            // always keep guest local copy
            localStorage.setItem(GUEST_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error("Error al guardar carrito en localStorage:", error);
        }
    }, [cartItems]);

    // 2b. Cuando cambia de usuario, intentar cargar carrito desde server y, si no existe, mantener guest
    useEffect(() => {
        let mounted = true;

        async function loadCart() {
            try {
                if (user && user.username) {
                    // obtener carrito del servidor
                    const serverCart = await getCartByUsername(user.username);
                    if (!mounted) return;

                    if (serverCart && serverCart.items) {
                        setCartItems(serverCart.items);
                        // guardar copia local por usuario
                        localStorage.setItem(getStorageKey(user), JSON.stringify(serverCart.items));
                    } else {
                        // si no hay carrito en server, mirar si hay guest local y dejarlo como está (no sobrescribir server)
                        const guest = localStorage.getItem(GUEST_KEY);
                        if (guest) {
                            setCartItems(JSON.parse(guest));
                        } else {
                            setCartItems([]);
                        }
                    }
                } else {
                    // logout -> cargar guest
                    const guest = localStorage.getItem(GUEST_KEY);
                    setCartItems(guest ? JSON.parse(guest) : []);
                }
            } catch (err) {
                console.error('Error cargando carrito desde server:', err);
                // fallback: mantener lo que haya en localStorage
                const guest = localStorage.getItem(GUEST_KEY);
                setCartItems(guest ? JSON.parse(guest) : []);
            }
        }

        loadCart();

        return () => { mounted = false; };
    }, [user]);

    // 3. Cálculos de totales (memoizados para rendimiento)
    const { totalAmount, totalItems } = useMemo(() => {
        const amount = cartItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        const items = cartItems.reduce((acc, item) => acc + item.cantidad, 0);
        return { totalAmount: amount, totalItems: items };
    }, [cartItems]);


    // ----------------------------------------------------
    // Lógica de Modificación
    // ----------------------------------------------------
    
    /**
     * Agrega un producto o incrementa su cantidad.
     */
    const addToCart = (productToAdd) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === productToAdd.id);
            
            if (existingItem) {
                // Verificar si hay stock disponible para sumar 1 más
                if (existingItem.cantidad >= productToAdd.stock) {
                    Swal.fire('Sin Stock', `Solo quedan ${productToAdd.stock} unidades de este producto.`, 'warning');
                    return prevItems; // No modificar el carrito
                }

                // Incrementar la cantidad
                const updatedItems = prevItems.map(item => 
                    item.id === productToAdd.id 
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `¡${productToAdd.nombre} agregado!`,
                    showConfirmButton: false,
                    timer: 1500
                });
                return updatedItems;
            } else {
                // Agregar nuevo ítem
                const newItem = { ...productToAdd, cantidad: 1 };
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `¡${productToAdd.nombre} agregado!`,
                    showConfirmButton: false,
                    timer: 1500
                });
                return [...prevItems, newItem];
            }
        });
    };

    /**
     * Remueve una unidad del producto o lo elimina si la cantidad es 1.
     */
    const removeFromCart = (productId) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === productId);

            if (!existingItem) return prevItems; // Evitar errores si no existe

            if (existingItem.cantidad > 1) {
                // Decrementar la cantidad
                return prevItems.map(item => 
                    item.id === productId 
                        ? { ...item, cantidad: item.cantidad - 1 }
                        : item
                );
            } else {
                // Eliminar el producto si la cantidad es 1
                return prevItems.filter(item => item.id !== productId);
            }
        });
    };

    /**
     * Elimina el producto completamente del carrito, independientemente de la cantidad.
     */
    const removeItemTotally = (productId) => {
         Swal.fire({
            title: '¿Eliminar producto?',
            text: "Quitarás todas las unidades de tu carrito.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                 setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
                 Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: 'Producto eliminado',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    };

    /**
     * Vacía todo el carrito.
     */
    const clearCart = () => {
        Swal.fire({
            title: '¿Vaciar carrito?',
            text: "Se eliminarán todos los productos de tu carrito.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, vaciar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                setCartItems([]);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: 'Carrito vaciado',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    };
    
    /**
     * Simula la compra y actualiza el stock en el "backend" (API JSON Server).
     */
    const updateStockOnPurchase = async () => {
        if (cartItems.length === 0) {
            throw new Error("El carrito está vacío.");
        }

        const updates = cartItems.map(item => ({
            id: item.id,
            newStock: item.stock - item.cantidad
        }));

        // NOTA: En una app real, verificarías si el newStock es negativo antes de enviar.
        // Aquí asumimos que el control de stock en addToCart es suficiente.

        try {
            const updatePromises = updates.map(update => 
                fetch(`http://localhost:3001/productos/${update.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock: update.newStock })
                })
            );

            await Promise.all(updatePromises);
            
            // Si todo fue bien, vacía el carrito
            setCartItems([]); 
            return true; 
        } catch (error) {
            console.error("Error al actualizar stock:", error);
            throw new Error("Fallo al contactar el servidor para actualizar stock. Revisa tu JSON Server.");
        }
    };

    // 4. Valores del Contexto
    // Persistir en server cada vez que cambie el carrito y hay usuario
    useEffect(() => {
        let mounted = true;
        async function persist() {
            try {
                if (user && user.username) {
                    await upsertCartByUsername(user.username, cartItems);
                    // también guardar copia local por usuario
                    localStorage.setItem(getStorageKey(user), JSON.stringify(cartItems));
                }
            } catch (err) {
                console.warn('No se pudo persistir carrito en server, se mantiene localmente', err);
            }
        }
        persist();
        return () => { mounted = false; };
    }, [cartItems, user]);

    const contextValue = useMemo(() => ({
        cartItems,
        totalAmount,
        totalItems,
        addToCart,
        removeFromCart,
        removeItemTotally,
        clearCart,
        updateStockOnPurchase,
    }), [cartItems, totalAmount, totalItems]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
}