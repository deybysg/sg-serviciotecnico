import React from 'react';
import { useCart } from '../context/CartContext';
// 💡 Se añade la importación de useAuth
import { useAuth } from '../context/AuthContext'; 
import { FaPlus, FaMinus, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../pages/Carrito.css'; 

/**
 * Componente Modal del Carrito
 */
function Carrito({ isOpen, onClose }) {
    // 💡 CAMBIO 1: Obtener el usuario del AuthContext
    const { user } = useAuth(); 
    const { 
        cartItems, 
        totalAmount, 
        totalItems, 
        addToCart, 
        removeFromCart, 
        removeItemTotally, 
        clearCart,
        updateStockOnPurchase 
    } = useCart();

    // 💡 Obtiene el username o 'Invitado' si no hay usuario logueado
    const displayUsername = user?.username || 'Invitado'; 

    if (!isOpen) {
        return null;
    }

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
             Swal.fire('Carrito Vacío', 'No puedes comprar sin productos.', 'warning');
             return;
        }

        Swal.fire({
             title: 'Confirmar Compra',
             text: `El total a pagar es $${totalAmount.toFixed(2)}. ¿Deseas continuar?`,
             icon: 'question',
             showCancelButton: true,
             confirmButtonColor: '#28a745',
             cancelButtonColor: '#dc3545',
             confirmButtonText: 'Sí, Comprar',
             cancelButtonText: 'Cancelar'
        }).then(async (result) => {
             if (result.isConfirmed) {
                 try {
                     await updateStockOnPurchase(); 
                     
                     Swal.fire(
                         '¡Compra Exitosa!',
                         'Hemos procesado tu pedido y el stock ha sido actualizado.',
                         'success'
                     );
                     onClose(); 
                 } catch (error) {
                     Swal.fire(
                         'Error',
                         error.message || 'Hubo un error al procesar tu compra. Inténtalo de nuevo.',
                         'error'
                     );
                 }
             }
        });
    };

    return (
        // 💡 CAMBIO 2: Se añade el ID único al overlay para control de estilos
        <div id="shopping-cart-modal-unique" className="carrito-modal-overlay" onClick={onClose}>
            <div 
                className="carrito-modal-content" 
                onClick={e => e.stopPropagation()} 
                role="dialog"
                aria-modal="true"
                aria-labelledby="carrito-title"
            >
                <button className="carrito-close-btn" onClick={onClose} aria-label="Cerrar carrito">&times;</button>
                
                {/* 💡 CAMBIO 3: Mostrar el nombre de usuario en el título */}
                <h2 id="carrito-title" className="carrito-title">
                    🛒 Carrito de {displayUsername} ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'})
                </h2>
                
                {cartItems.length === 0 ? (
                    <p className="carrito-empty-message">Tu carrito está vacío. ¡Añade algunos productos!</p>
                ) : (
                    <>
                        <div className="carrito-items-list">
                            {cartItems.map(item => (
                                <div key={item.id} className="carrito-item">
                                    <div className="item-info">
                                        <h4 className="item-name">{item.nombre}</h4>
                                        <p className="item-price">${item.precio.toFixed(2)} c/u</p>
                                    </div>
                                    
                                    <div className="item-controls">
                                        <div className="item-quantity-control">
                                            <button 
                                                onClick={() => removeFromCart(item.id)} 
                                                className="qty-btn minus"
                                                aria-label={`Quitar una unidad de ${item.nombre}`}
                                            >
                                                <FaMinus />
                                            </button>
                                            
                                            <span className="item-quantity">{item.cantidad}</span>
                                            
                                            <button 
                                                onClick={() => addToCart(item)} 
                                                className="qty-btn plus"
                                                disabled={item.cantidad >= item.stock}
                                                aria-label={`Agregar una unidad de ${item.nombre}`}
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                        
                                        <p className="item-subtotal">${(item.precio * item.cantidad).toFixed(2)}</p>
                                        
                                        <button 
                                            onClick={() => removeItemTotally(item.id)} 
                                            className="delete-item-btn"
                                            aria-label={`Eliminar ${item.nombre} del carrito`}
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="carrito-summary">
                            <div className="summary-total">
                                <strong>TOTAL:</strong> <span>${totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="summary-actions">
                                <button onClick={clearCart} className="btn-secondary" disabled={totalItems === 0}>
                                    Vaciar Carrito
                                </button>
                                <button onClick={handleCheckout} className="btn-primary" disabled={totalItems === 0}>
                                    Finalizar Compra
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Carrito;