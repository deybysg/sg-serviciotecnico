import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import useCartStore from '../store/cartStore';

/**
 * CartProvider - Sincroniza el store de Zustand con los cambios de usuario
 * Este componente se encarga de inicializar el carrito cuando cambia el usuario
 */
export function CartProvider({ children }) {
  const { user, getToken } = useAuth();
  const initCart = useCartStore(state => state.initCart);

  useEffect(() => {
    const token = getToken?.() || localStorage.getItem('token');
    console.log('🔄 [CartProvider] Usuario cambió:', user?.username);
    
    // Inicializar carrito con el nuevo usuario
    initCart(user, token);
  }, [user?.username, initCart, getToken]);

  return children;
}
