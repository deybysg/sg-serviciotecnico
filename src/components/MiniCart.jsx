import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { FaShoppingCart, FaTrash } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import '../styles/components/MiniCart.css';

function MiniCart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cartItems = useCartStore(state => state.cartItems);
  const totalAmount = useCartStore(state => state.getTotalAmount());
  const totalItems = useCartStore(state => state.getTotalItems());
  const showMiniCart = useCartStore(state => state.showMiniCart);
  const setShowMiniCart = useCartStore(state => state.setShowMiniCart);
  const removeFromCart = useCartStore(state => state.removeFromCart);

  const formatNumber = (num) => new Intl.NumberFormat('es-AR').format(num);

  if (!showMiniCart || user) return null;

  const handleFinalizar = () => {
    // Guardar carrito del invitado en localStorage antes de redirigir
    if (cartItems.length > 0) {
      localStorage.setItem('guestCart', JSON.stringify(cartItems));
    }
    setShowMiniCart(false);
    navigate('/login');
  };

  const handleSeguirComprando = () => {
    setShowMiniCart(false);
  };

  return (
    <div className="minicart-overlay" onClick={handleSeguirComprando}>
      <div className="minicart-panel" onClick={e => e.stopPropagation()}>
        <div className="minicart-header">
          <div className="minicart-title">
            <FaShoppingCart size={16} />
            <span>Mi carrito ({totalItems})</span>
          </div>
          <button className="minicart-close" onClick={handleSeguirComprando}>
            <FiX size={18} />
          </button>
        </div>

        <div className="minicart-items">
          {cartItems.length === 0 ? (
            <div className="minicart-empty">
              <FaShoppingCart size={30} />
              <p>Tu carrito está vacío</p>
            </div>
          ) : cartItems.map(item => (
            <div key={item.id} className="minicart-item">
              <div className="minicart-item-img">
                {item.imagen ? (
                  <img src={item.imagen} alt={item.nombre} />
                ) : (
                  <FaShoppingCart size={16} />
                )}
              </div>
              <div className="minicart-item-info">
                <span className="minicart-item-name">{item.nombre}</span>
                <span className="minicart-item-qty">x{item.cantidad}</span>
              </div>
              <div className="minicart-item-right">
                <span className="minicart-item-price">${formatNumber(item.precio * item.cantidad)}</span>
                <button
                  className="minicart-item-remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Eliminar"
                >
                  <FaTrash size={11} />
                </button>
              </div>
            </div>
          ))}
          )}
        </div>

        <div className="minicart-footer">
          <div className="minicart-total">
            <span>Total</span>
            <span className="minicart-total-amount">${formatNumber(totalAmount)}</span>
          </div>
          <div className="minicart-actions">
            <button className="minicart-btn minicart-btn-continue" onClick={handleSeguirComprando}>
              Seguir comprando
            </button>
            <button className="minicart-btn minicart-btn-checkout" onClick={handleFinalizar}>
              Finalizar compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiniCart;
