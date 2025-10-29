import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
import { getCartByUsername, upsertCartByUsername } from '../services/cartService';
import { api } from '../services/api';

const GUEST_KEY = 'SG_cart_guest';
const CART_EXPIRY_HOURS = 24; // Tiempo de expiración del carrito en horas

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
// Funciones auxiliares para manejo de timestamp
// ----------------------------------------------------
const isCartExpired = (timestamp) => {
    if (!timestamp) return true;
    const now = new Date().getTime();
    const expiryTime = CART_EXPIRY_HOURS * 60 * 60 * 1000; // 24 horas en milisegundos
    return (now - timestamp) > expiryTime;
};

const loadCartFromStorage = (key) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return { items: [], timestamp: null };
        
        const parsed = JSON.parse(stored);
        
        // Si es formato antiguo (array directo), convertir
        if (Array.isArray(parsed)) {
            return { items: parsed, timestamp: new Date().getTime() };
        }
        
        // Si es formato nuevo con timestamp
        if (parsed.timestamp && isCartExpired(parsed.timestamp)) {
            // Carrito expirado, limpiar y devolver vacío
            localStorage.removeItem(key);
            return { items: [], timestamp: null };
        }
        
        return parsed;
    } catch (error) {
        console.error("Error al cargar carrito desde localStorage:", error);
        return { items: [], timestamp: null };
    }
};

const saveCartToStorage = (key, items) => {
    try {
        const data = {
            items,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Error al guardar carrito en localStorage:", error);
    }
};

// ----------------------------------------------------
// Proveedor del Carrito
// ----------------------------------------------------
export function CartProvider({ children }) {
    const { user } = useAuth();

    // 1. Inicializar el carrito desde localStorage según el usuario actual
    const [cartItems, setCartItems] = useState(() => {
        // Intentar cargar del usuario si hay sesión activa (rehidratación)
        const storedUser = localStorage.getItem('currentUser');
        console.log('🔵 [CartContext INIT] storedUser:', storedUser);
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser.username) {
                    const userKey = `SG_cart_${parsedUser.username}`;
                    console.log('🔵 [CartContext INIT] Cargando carrito de:', userKey);
                    const cartData = loadCartFromStorage(userKey);
                    console.log('🔵 [CartContext INIT] Items cargados:', cartData.items.length);
                    return cartData.items;
                }
            } catch (e) {
                console.error("Error cargando usuario almacenado:", e);
            }
        }
        // Fallback: cargar guest
        console.log('🔵 [CartContext INIT] Cargando guest');
        const cartData = loadCartFromStorage(GUEST_KEY);
        return cartData.items;
    });

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const getStorageKey = (usr) => (usr && usr.username ? `SG_cart_${usr.username}` : GUEST_KEY);

    // 2. Guardar el carrito en localStorage por contexto (guest o usuario) con timestamp
    useEffect(() => {
        const key = getStorageKey(user);
        console.log('💾 [CartContext SAVE] Guardando en:', key, 'Items:', cartItems.length, 'User:', user?.username);
        saveCartToStorage(key, cartItems);
    }, [cartItems, user]);

    // 2b. Cargar carrito específico del usuario cuando cambia de usuario (login/logout)
    useEffect(() => {
        let mounted = true;

        async function syncWithServer() {
            console.log('🔄 [CartContext SYNC] Iniciando sync. User:', user?.username, 'isInitialLoad:', isInitialLoad);
            try {
                if (user && user.username) {
                    // Primero cargar el carrito local específico del usuario
                    const userKey = getStorageKey(user);
                    console.log('🔄 [CartContext SYNC] Cargando localStorage de:', userKey);
                    const localUserCart = loadCartFromStorage(userKey);
                    console.log('🔄 [CartContext SYNC] Items locales:', localUserCart.items.length);
                    
                    // obtener carrito del servidor
                    console.log('🔄 [CartContext SYNC] Consultando servidor...');
                    const serverCart = await getCartByUsername(user.username);
                    if (!mounted) return;

                    console.log('🔄 [CartContext SYNC] Items servidor:', serverCart?.items?.length || 0);

                    // Priorizar el que tenga más items (merge inteligente)
                    if (serverCart && serverCart.items && serverCart.items.length > 0) {
                        // Si el servidor tiene items, usarlos
                        console.log('✅ [CartContext SYNC] Usando items del servidor');
                        setCartItems(serverCart.items);
                        saveCartToStorage(getStorageKey(user), serverCart.items);
                    } else if (localUserCart.items && localUserCart.items.length > 0) {
                        // Si el servidor está vacío pero hay items locales del usuario, usar esos
                        console.log('✅ [CartContext SYNC] Usando items locales y subiendo al servidor');
                        setCartItems(localUserCart.items);
                        // Y sincronizar al servidor
                        await upsertCartByUsername(user.username, localUserCart.items);
                    } else {
                        // Ambos vacíos, dejar vacío
                        console.log('✅ [CartContext SYNC] Ambos vacíos, limpiando carrito');
                        setCartItems([]);
                    }
                } else {
                    // logout -> cargar guest
                    console.log('🔄 [CartContext SYNC] Sin usuario, cargando guest');
                    const guestCart = loadCartFromStorage(GUEST_KEY);
                    setCartItems(guestCart.items);
                }
            } catch (err) {
                console.error('❌ [CartContext SYNC] Error sincronizando con servidor:', err);
                // En caso de error, cargar desde localStorage del usuario actual
                const key = getStorageKey(user);
                const fallbackCart = loadCartFromStorage(key);
                if (mounted) {
                    console.log('⚠️ [CartContext SYNC] Usando fallback local');
                    setCartItems(fallbackCart.items);
                }
            } finally {
                if (mounted) {
                    setIsInitialLoad(false);
                }
            }
        }

        // Solo ejecutar si es la primera carga o si cambió el usuario
        if (isInitialLoad) {
            syncWithServer();
        }

        return () => { mounted = false; };
    }, [user, isInitialLoad]);

    // 2c. Cuando cambia el usuario (login/logout), marcar para recargar
    useEffect(() => {
        // Cuando cambia el usuario, permitir que se recargue el carrito
        console.log('👤 [CartContext USER CHANGE] Usuario cambió a:', user?.username);
        setIsInitialLoad(true);
    }, [user?.username]); // Solo cuando cambia el username

    // 2d. Si hay usuario logueado, asegurarse de no dejar restos de carrito guest
    useEffect(() => {
        if (user && user.username) {
            try { localStorage.removeItem(GUEST_KEY); } catch {}
        }
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
     * Simula la compra y actualiza el stock en el backend vía API.
     */
    const updateStockOnPurchase = async () => {
        if (cartItems.length === 0) {
            throw new Error("El carrito está vacío.");
        }

        const updates = cartItems.map(item => ({
            id: item._id || item.id,
            newStock: item.stock - item.cantidad
        }));

        try {
            const updatePromises = updates.map(update => 
                api.put(`/productos/${update.id}`, { stock: update.newStock })
            );

            await Promise.all(updatePromises);
            
            // Si todo fue bien, vacía el carrito
            setCartItems([]); 
            return true; 
        } catch (error) {
            console.error("Error al actualizar stock:", error);
            throw new Error("Fallo al actualizar stock en el servidor.");
        }
    };

    // 4. Valores del Contexto
    // Persistir en server cada vez que cambie el carrito y hay usuario
    useEffect(() => {
        let mounted = true;
        async function persist() {
            try {
                if (user && user.username && cartItems.length >= 0) {
                    console.log('☁️ [CartContext PERSIST] Guardando en servidor. User:', user.username, 'Items:', cartItems.length);
                    await upsertCartByUsername(user.username, cartItems);
                    // también guardar copia local por usuario con timestamp
                    saveCartToStorage(getStorageKey(user), cartItems);
                    console.log('✅ [CartContext PERSIST] Guardado exitoso');
                }
            } catch (err) {
                console.warn('⚠️ [CartContext PERSIST] No se pudo persistir carrito en server, se mantiene localmente', err);
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