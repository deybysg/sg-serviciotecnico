// src/components/Carrito.jsx

import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; 
import { FaPlus, FaMinus, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../pages/Carrito.css'; 

// 💡 NECESITAS ESTO: Importa una función de tu Contexto de Compras/Ventas 
//    para registrar la compra y la actualización de stock.
//    (Asegúrate de que esta función exista en tu CartContext o crea un SalesContext)
const simulatePurchaseAndSave = async (userId, username, items, total, updateStock) => {
    // 🚨 Esta es la función clave a implementar en tu CartContext o SalesContext.
    // Simula:
    // 1. await updateStock(); 
    // 2. Registra la compra en tu DB (por ejemplo, en un endpoint POST /ventas).
    // 3. Vacía el carrito local.
    
    // Por ahora, solo usaremos la función updateStockOnPurchase que ya tenías
    // y la combinaremos con un registro simple en el backend/json-server.
    
    // 1. Simular registro de la compra en el historial (backend/json-server)
    const nuevaVenta = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2), // ID simple
        usuarioId: userId,
        username: username,
        fechaCompra: new Date().toISOString(),
        totalVenta: total,
        metodoPago: 'Simulado (Offline)',
        estado: 'Completado',
        productosComprados: items.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precioUnitario: item.precio,
            categoria: item.categoria,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad,
        }))
    };
    
    // 🚨 Llama a tu endpoint de backend para registrar la venta (Mis Compras / Historial de Ventas)
    // Asumiendo que tienes un endpoint para registrar ventas:
    const salesResponse = await fetch('http://localhost:3001/ventas', { // 🚨 Ajusta esta URL si usas otro puerto/ruta
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaVenta)
    });
    
    if (!salesResponse.ok) {
        throw new Error('Error al guardar la venta en el historial.');
    }

    // 2. Actualizar el stock
    await updateStock();

    return salesResponse.json();
};

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
        // 👇 Usamos clearCart y updateStockOnPurchase, que son necesarios para la simulación
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
                        user.id, 
                        user.username, 
                        cartItems, 
                        totalAmount, 
                        updateStockOnPurchase
                    );
                    
                    // 4. Vaciar el carrito después de la simulación y registro exitoso
                    clearCart();
                    
                    Swal.fire(
                        '¡Compra Exitosa (Simulada)!',
                        'Tu pedido fue registrado en "Mis Compras" y el stock fue actualizado.',
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