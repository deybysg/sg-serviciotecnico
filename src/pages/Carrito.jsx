// src/components/Carrito.jsx

import React from 'react';
import useCartStore from '../store/cartStore';
import { useAuth } from '../context/AuthContext'; 
import { api } from '../services/api';
import { FaPlus, FaMinus, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../pages/Carrito.css'; 

/**
 * Función para registrar la compra en el backend y actualizar stock
 */
const simulatePurchaseAndSave = async (userId, username, items, total, updateStock) => {
    // 1. Preparar datos de la venta
    const nuevaVenta = {
        usuario: userId,
        username: username,
        fechaCompra: new Date().toISOString(),
        totalVenta: total,
        metodoPago: 'Efectivo',
        estado: 'Completado',
        productosComprados: items.map(item => ({
            producto: item._id || item.id,
            nombre: item.nombre,
            precioUnitario: item.precio,
            categoria: item.categoria,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad,
        }))
    };
    
    // 2. Registrar la venta en el backend
    const ventaCreada = await api.post('/ventas', nuevaVenta);

    // 3. Actualizar el stock de productos
    await updateStock();

    return ventaCreada;
};

/**
 * Componente Modal del Carrito
 */
function Carrito({ isOpen, onClose }) {
    // 💡 CAMBIO 1: Obtener el usuario del AuthContext
    const { user } = useAuth(); 
    
    // Obtener estado y acciones del store de Zustand
    const cartItems = useCartStore(state => state.cartItems);
    const totalAmount = useCartStore(state => state.getTotalAmount());
    const totalItems = useCartStore(state => state.getTotalItems());
    const addToCart = useCartStore(state => state.addToCart);
    const removeFromCart = useCartStore(state => state.removeFromCart);
    const removeItemTotally = useCartStore(state => state.removeItemTotally);
    const clearCart = useCartStore(state => state.clearCart);
    const updateStockOnPurchase = useCartStore(state => state.updateStockOnPurchase);

    // 💡 Obtiene el username o 'Invitado' si no hay usuario logueado
    const displayUsername = user?.username || 'Invitado'; 

    if (!isOpen) {
        return null;
    }

    // 🚨 FUNCIÓN handleCheckout MODIFICADA PARA SIMULAR COMPRA 🚨
    const handleCheckout = async () => {
        // 1. Verificación de sesión
        if (!user || user.role === 'Invitado') {
             Swal.fire('Atención', 'Debes iniciar sesión para realizar una compra.', 'info');
             return;
        }

        if (cartItems.length === 0) {
            Swal.fire('Carrito Vacío', 'No puedes comprar sin productos.', 'warning');
            return;
        }

        // 2. Confirmación de compra (Simulación)
        Swal.fire({
            title: 'Confirmar Compra (Simulada)',
            text: `El total a pagar es $${totalAmount.toFixed(2)}. ¿Deseas SIMULAR la compra?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745', // Verde para confirmar
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Sí, Comprar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({
                        title: 'Simulando Pago...',
                        text: 'Procesando tu pedido y actualizando el historial...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // 3. 🚨 LLAMADA A LA FUNCIÓN DE SIMULACIÓN Y REGISTRO 🚨
                    await simulatePurchaseAndSave(
                        user._id || user.id, 
                        user.username, 
                        cartItems, 
                        totalAmount, 
                        updateStockOnPurchase
                    );
                    
                    // 4. Vaciar el carrito después de la simulación y registro exitoso
                    // (updateStockOnPurchase ya lo vacía)
                    
                    Swal.fire(
                        '¡Compra Exitosa!',
                        'Tu pedido fue registrado en "Mis Compras" y el stock actualizado.',
                        'success'
                    );
                    onClose(); 
                    
                } catch (error) {
                    Swal.fire(
                        'Error de Simulación',
                        error.message || 'Hubo un error al simular la compra/guardar historial.',
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