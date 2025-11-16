import { create } from 'zustand';
import Swal from 'sweetalert2';
import { getCartByUsername, upsertCartByUsername, clearCart as clearCartAPI } from '../services/cartService';
import { toIdString } from '../utils/id';
import { api } from '../services/api';

// Store de carrito con Zustand - Sin localStorage, solo API como fuente de verdad
const useCartStore = create((set, get) => ({
  // Estado
  cartItems: [],
  isLoading: false,
  currentUser: null,
  currentToken: null,

  // Acciones de sincronización
  
  /**
   * Inicializar carrito para un usuario - carga desde API
   */
  initCart: async (user, token) => {
    const username = user?.username;
    console.log('🛒 [CartStore INIT] Usuario:', username);
    
    // Si cambia el usuario, limpiar inmediatamente el estado
    const prevUser = get().currentUser;
    if (prevUser !== username) {
      set({ cartItems: [], currentUser: username, currentToken: token, isLoading: true });
    } else {
      set({ currentUser: username, currentToken: token, isLoading: true });
    }

    if (!username) {
      // Usuario guest - carrito vacío (sin localStorage)
      console.log('🛒 [CartStore INIT] Guest - carrito vacío');
      set({ cartItems: [], isLoading: false });
      return;
    }

    try {
      // Cargar desde servidor
      console.log('🛒 [CartStore INIT] Cargando desde servidor...');
      const serverCart = await getCartByUsername(username);
      
      // Validar que el carrito devuelto corresponde al usuario actual
      const sid = serverCart?._id || serverCart?.username;
      if (serverCart && sid && toIdString(sid) !== toIdString(username)) {
        console.warn('🛡️ [CartStore INIT] Mismatch! Esperado:', username, 'Recibido:', sid);
        // Forzar carrito vacío
        await upsertCartByUsername(username, [], { token });
        set({ cartItems: [], isLoading: false });
        return;
      }

      const items = serverCart?.items || [];
      console.log('✅ [CartStore INIT] Items cargados:', items.length);
      set({ cartItems: items, isLoading: false });
    } catch (error) {
      console.error('❌ [CartStore INIT] Error:', error);
      set({ cartItems: [], isLoading: false });
    }
  },

  /**
   * Persistir carrito en el servidor
   */
  persistCart: async () => {
    const { currentUser, currentToken, cartItems } = get();
    if (!currentUser || !currentToken) {
      console.log('⚠️ [CartStore PERSIST] Sin usuario/token, skip');
      return;
    }

    try {
      console.log('☁️ [CartStore PERSIST] Guardando en servidor. User:', currentUser, 'Items:', cartItems.length);
      await upsertCartByUsername(currentUser, cartItems, { token: currentToken });
      console.log('✅ [CartStore PERSIST] Guardado exitoso');
    } catch (error) {
      console.error('❌ [CartStore PERSIST] Error:', error);
    }
  },

  // Acciones del carrito

  /**
   * Agregar producto al carrito
   */
  addToCart: (product) => {
    const { cartItems } = get();
    const pid = toIdString(product?.id ?? product?._id);
    const existingItem = cartItems.find(item => toIdString(item.id) === pid);

    if (existingItem) {
      // Verificar stock
      if (existingItem.cantidad >= product.stock) {
        Swal.fire('Sin Stock', `Solo quedan ${product.stock} unidades de este producto.`, 'warning');
        return;
      }

      // Incrementar cantidad
      const updatedItems = cartItems.map(item =>
        toIdString(item.id) === pid
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      );
      set({ cartItems: updatedItems });
    } else {
      // Agregar nuevo item
      const newItem = { ...product, id: pid, cantidad: 1 };
      set({ cartItems: [...cartItems, newItem] });
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `¡${product.nombre} agregado!`,
      showConfirmButton: false,
      timer: 1500
    });

    // Persistir después de agregar
    get().persistCart();
  },

  /**
   * Remover una unidad del producto
   */
  removeFromCart: (productId) => {
    const { cartItems } = get();
    const existingItem = cartItems.find(item => toIdString(item.id) === toIdString(productId));

    if (!existingItem) return;

    if (existingItem.cantidad > 1) {
      // Decrementar cantidad
      const updatedItems = cartItems.map(item =>
        toIdString(item.id) === toIdString(productId)
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      );
      set({ cartItems: updatedItems });
    } else {
      // Eliminar el producto
      const updatedItems = cartItems.filter(item => toIdString(item.id) !== toIdString(productId));
      set({ cartItems: updatedItems });
    }

    // Persistir después de remover
    get().persistCart();
  },

  /**
   * Eliminar producto completamente del carrito
   */
  removeItemTotally: (productId) => {
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
        const { cartItems } = get();
        const updatedItems = cartItems.filter(item => toIdString(item.id) !== toIdString(productId));
        set({ cartItems: updatedItems });

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Producto eliminado',
          showConfirmButton: false,
          timer: 1500
        });

        // Persistir después de eliminar
        get().persistCart();
      }
    });
  },

  /**
   * Vaciar todo el carrito
   */
  clearCart: () => {
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
        const { currentUser, currentToken } = get();
        
        try {
          // Vaciar en servidor si hay sesión
          if (currentUser && currentToken) {
            await clearCartAPI(currentUser, { token: currentToken });
          }
          
          set({ cartItems: [] });
          
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Carrito vaciado',
            showConfirmButton: false,
            timer: 1500
          });
        } catch (err) {
          console.warn('Error al vaciar en servidor, vaciando localmente', err);
          set({ cartItems: [] });
        }
      }
    });
  },

  /**
   * Actualizar stock en el backend tras compra
   */
  updateStockOnPurchase: async () => {
    const { cartItems } = get();
    
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
      
      // Vaciar carrito tras compra exitosa
      set({ cartItems: [] });
      
      // Persistir carrito vacío
      await get().persistCart();
      
      return true;
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      throw new Error("Fallo al actualizar stock en el servidor.");
    }
  },

  // Getters computados
  getTotalAmount: () => {
    const { cartItems } = get();
    return cartItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  },

  getTotalItems: () => {
    const { cartItems } = get();
    return cartItems.reduce((acc, item) => acc + item.cantidad, 0);
  },
}));

export default useCartStore;
