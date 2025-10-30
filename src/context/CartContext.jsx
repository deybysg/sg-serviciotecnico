import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
import { getCartByUsername, upsertCartByUsername } from '../services/cartService';
import { api } from '../services/api';
import { toIdString } from '../utils/id';

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
// Funciones auxiliares (solo para invitados)
// ----------------------------------------------------
const isCartExpired = (timestamp) => {
    if (!timestamp) return true;
    const now = new Date().getTime();
    const expiryTime = CART_EXPIRY_HOURS * 60 * 60 * 1000; // 24 horas en milisegundos
    return (now - timestamp) > expiryTime;
};

const loadGuestCart = () => {
    try {
        const stored = localStorage.getItem(GUEST_KEY);
        if (!stored) return { items: [], timestamp: null };

        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            return { items: parsed, timestamp: new Date().getTime() };
        }

        if (parsed.timestamp && isCartExpired(parsed.timestamp)) {
            localStorage.removeItem(GUEST_KEY);
            return { items: [], timestamp: null };
        }
        return parsed;
    } catch (error) {
        console.error('Error al cargar carrito guest desde localStorage:', error);
        return { items: [], timestamp: null };
    }
};

const saveGuestCart = (items) => {
    try {
        const data = { items, timestamp: new Date().getTime() };
        localStorage.setItem(GUEST_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar carrito guest en localStorage:', error);
    }
};

// ----------------------------------------------------
// Proveedor del Carrito
// ----------------------------------------------------
export function CartProvider({ children }) {
    const { user } = useAuth();

    // 1. Estado inicial vacío; se sincroniza luego según usuario/guest
    const [cartItems, setCartItems] = useState([]);

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // 2b. Cargar carrito específico del usuario cuando cambia de usuario (login/logout)
    useEffect(() => {
        let mounted = true;

        async function syncWithServer() {
            console.log('🔄 [CartContext SYNC] Iniciando sync. User:', user?.username, 'isInitialLoad:', isInitialLoad);
            try {
                if (user && user.username) {
                    // obtener carrito del servidor (única fuente)
                    console.log('🔄 [CartContext SYNC] Consultando servidor...');
                    const serverCart = await getCartByUsername(user.username);
                    if (!mounted) return;

                    console.log('🔄 [CartContext SYNC] Items servidor:', serverCart?.items?.length || 0);

                    // Seguridad: validar que el carrito devuelto coincide con el usuario actual
                    const sid = serverCart?._id || serverCart?.username;
                    if (serverCart && sid && toIdString(sid) !== toIdString(user.username)) {
                        console.warn('🛡️ [CartContext SYNC] Mismatch de usuario en carrito del servidor. Esperado:', user.username, 'Recibido:', sid, '→ Se fuerza carrito vacío del usuario actual.');
                        await upsertCartByUsername(user.username, []);
                        setCartItems([]);
                        return;
                    }

                    if (serverCart && Array.isArray(serverCart.items)) {
                        console.log('✅ [CartContext SYNC] Aplicando carrito del servidor');
                        setCartItems(serverCart.items);
                    } else {
                        console.log('✅ [CartContext SYNC] Servidor sin carrito/items');
                        setCartItems([]);
                    }
                } else {
                    // logout -> cargar guest desde localStorage
                    console.log('🔄 [CartContext SYNC] Sin usuario, cargando guest');
                    const guestCart = loadGuestCart();
                    setCartItems(guestCart.items);
                }
            } catch (err) {
                console.error('❌ [CartContext SYNC] Error sincronizando con servidor:', err);
                if (mounted) {
                    // En error con usuario logueado, mostrar vacío (no usar localStorage)
                    setCartItems([]);
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

    // 2c. Cambio de usuario (login/logout): limpiar memoria siempre para evitar mezcla o "flicker"
    // Guardamos el último username autenticado para detectar cambios reales entre usuarios logueados
    const lastAuthUsernameRef = useRef(null);
    useEffect(() => {
        const current = user?.username || null;
        const prevAuth = lastAuthUsernameRef.current;
        console.log('👤 [CartContext USER CHANGE] prevAuth:', prevAuth, 'current:', current);

        // Limpiar inmediatamente al loguear, desloguear o cambiar de usuario para evitar que se vean items anteriores
        if (current !== prevAuth) {
            setCartItems([]);
        }

        // Forzar recarga desde backend o guest según corresponda
        setIsInitialLoad(true);

        // Solo actualizamos el "último usuario autenticado" cuando hay un usuario (evita perder referencia al desloguear)
        if (current) {
            lastAuthUsernameRef.current = current;
        }
    }, [user?.username]);

    // 2d. Guardar guest en localStorage solo si no hay usuario; si hay usuario, limpiar guest para evitar confusiones
    useEffect(() => {
        if (!user || !user.username) {
            if (!isInitialLoad) {
                saveGuestCart(cartItems);
            }
        } else {
            try { localStorage.removeItem(GUEST_KEY); } catch {}
        }
    }, [cartItems, user, isInitialLoad]);

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
    const getProductId = (p) => toIdString(p?.id ?? p?._id);

    const addToCart = (productToAdd) => {
        setCartItems(prevItems => {
            const pid = getProductId(productToAdd);
            const existingItem = prevItems.find(item => toIdString(item.id) === pid);
            
            if (existingItem) {
                // Verificar si hay stock disponible para sumar 1 más
                if (existingItem.cantidad >= productToAdd.stock) {
                    Swal.fire('Sin Stock', `Solo quedan ${productToAdd.stock} unidades de este producto.`, 'warning');
                    return prevItems; // No modificar el carrito
                }

                // Incrementar la cantidad
                const updatedItems = prevItems.map(item => 
                    toIdString(item.id) === pid 
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
                const newItem = { ...productToAdd, id: pid, cantidad: 1 };
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
            const existingItem = prevItems.find(item => toIdString(item.id) === toIdString(productId));

            if (!existingItem) return prevItems; // Evitar errores si no existe

            if (existingItem.cantidad > 1) {
                // Decrementar la cantidad
                return prevItems.map(item => 
                    toIdString(item.id) === toIdString(productId) 
                        ? { ...item, cantidad: item.cantidad - 1 }
                        : item
                );
            } else {
                // Eliminar el producto si la cantidad es 1
                return prevItems.filter(item => toIdString(item.id) !== toIdString(productId));
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
              setCartItems(prevItems => prevItems.filter(item => toIdString(item.id) !== toIdString(productId)));
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
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Vaciar también en el servidor si hay sesión
                    if (user && user.username) {
                        await import('../services/cartService').then(m => m.clearCart(user.username));
                    }
                    setCartItems([]);
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'info',
                        title: 'Carrito vaciado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } catch (err) {
                    console.warn('No se pudo vaciar en servidor, se vacía localmente', err);
                    setCartItems([]);
                }
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

    // 4. Persistir al servidor al cambiar items cuando hay usuario (sin localStorage)
    useEffect(() => {
        async function persist() {
            try {
                if (!user || !user.username || isInitialLoad) return;
                await upsertCartByUsername(user.username, cartItems);
                console.log('✅ [CartContext PERSIST] Guardado en servidor');
            } catch (err) {
                console.warn('⚠️ [CartContext PERSIST] Error guardando en servidor:', err);
            }
        }
        persist();
    }, [cartItems, user, isInitialLoad]);

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