// src/components/Carrito.jsx

import React, { useState } from 'react';
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

    // Estado para acordeón de Mercado Pago
    const [showMPInfo, setShowMPInfo] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrImage, setQrImage] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);

    // 💡 Obtiene el username o 'Invitado' si no hay usuario logueado
    const displayUsername = user?.username || 'Invitado';

    // Función para formatear números con puntos de miles
    const formatNumber = (num) => {
        return new Intl.NumberFormat('es-AR').format(num);
    }; 

    if (!isOpen) {
        return null;
    }

    // 💳 FUNCIÓN MERCADO PAGO - API de pago real
    const handleMercadoPago = async () => {
        // Verificar expiración del carrito
        if (useCartStore.getState().checkExpiration()) {
            return;
        }

        // 1. Verificación de sesión
        if (!user || user.role === 'Invitado') {
            Swal.fire({
                icon: 'info',
                title: 'Inicia Sesión',
                text: 'Debes iniciar sesión para realizar una compra.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        if (cartItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Carrito Vacío',
                text: 'No puedes comprar sin productos.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2500
            });
            return;
        }

        // 2. Solicitar email de confirmación
        const { value: email } = await Swal.fire({
            title: 'Confirmar email',
            input: 'email',
            inputLabel: 'Ingresa tu email para recibir el comprobante',
            inputPlaceholder: 'tu-email@ejemplo.com',
            inputValue: user.email || '',
            showCancelButton: true,
            confirmButtonText: 'Continuar al pago',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes ingresar un email';
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return 'Email inválido';
                }
            }
        });

        if (!email) return;

        try {
            // 3. Mostrar loading
            Swal.fire({
                title: 'Preparando pago...',
                text: 'Redirigiendo a Mercado Pago',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // 4. Crear preferencia de pago
            const response = await api.post('/mercadopago/create-preference', {
                items: cartItems,
                email: email,
                userId: user._id || user.id,
                username: user.username
            });

            // 5. Redirigir a Mercado Pago
            window.location.href = response.initPoint;

        } catch (error) {
            console.error('Error creando preferencia:', error);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Error',
                text: 'No se pudo iniciar el pago. Intenta nuevamente.',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        }
    };

    const handleQR = async () => {
        if (useCartStore.getState().checkExpiration()) return;

        if (!user || user.role === 'Invitado') {
            Swal.fire({ icon: 'info', title: 'Inicia Sesión', text: 'Debes iniciar sesión para realizar una compra.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            return;
        }

        if (cartItems.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Carrito Vacío', text: 'No puedes comprar sin productos.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
            return;
        }

        const { value: email } = await Swal.fire({
            title: 'Confirmar email',
            input: 'email',
            inputLabel: 'Ingresa tu email para recibir el comprobante',
            inputPlaceholder: 'tu-email@ejemplo.com',
            inputValue: user.email || '',
            showCancelButton: true,
            confirmButtonText: 'Generar QR',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) return 'Debes ingresar un email';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
            }
        });

        if (!email) return;

        try {
            setQrLoading(true);
            setShowQR(true);

            const response = await api.post('/mercadopago/create-qr', {
                items: cartItems,
                email,
                userId: user._id || user.id,
                username: user.username
            });

            setQrImage(response.qrCode);
        } catch (error) {
            console.error('Error creando QR:', error);
            setShowQR(false);
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error', text: 'No se pudo generar el código QR.', showConfirmButton: false, timer: 4000 });
        } finally {
            setQrLoading(false);
        }
    };

    // 🚨 FUNCIÓN handleCheckout MODIFICADA PARA SIMULAR COMPRA 🚨
    const handleCheckout = async () => {
        // 1. Verificación de sesión
        if (!user || user.role === 'Invitado') {
             Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Inicia Sesión',
                text: 'Debes iniciar sesión para comprar',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
             });
             return;
        }

        if (cartItems.length === 0) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Carrito Vacío',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
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
                    
                    // Disparar evento para que Productos recargue
                    window.dispatchEvent(new Event('purchaseCompleted'));
                    
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: '¡Compra Exitosa!',
                        text: 'Pedido registrado correctamente',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });
                    onClose(); 
                    
                } catch (error) {
                    console.error('Error en simulación:', error);
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: 'Error de Simulación',
                        text: error.message || 'Error al procesar la compra',
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true
                    });
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
                {/* Header del carrito */}
                <div className="carrito-header">
                    <div className="header-top">
                        <h2 className="carrito-greeting">Hola, {displayUsername}</h2>
                        <button className="carrito-close-btn" onClick={onClose} aria-label="Cerrar carrito">&times;</button>
                    </div>
                    <div className="header-subtitle">
                        <span className="cart-icon">🛒</span>
                        <span className="item-count">{totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}</span>
                    </div>
                </div>
                
                {cartItems.length === 0 ? (
                    <div className="carrito-empty">
                        <div className="empty-icon">🛍️</div>
                        <p className="empty-message">Tu carrito está vacío</p>
                        <p className="empty-subtitle">¡Añade productos para comenzar!</p>
                    </div>
                ) : (
                    <div className="carrito-body">
                        {/* Columna izquierda: Lista de items */}
                        <div className="carrito-left">
                            <div className="left-header">
                                <h3 className="section-title">Mi carrito</h3>
                                <button 
                                    onClick={clearCart} 
                                    className="btn-clear-top" 
                                    disabled={totalItems === 0}
                                >
                                    🗑️ Vaciar carrito
                                </button>
                            </div>
                            <div className="carrito-items-list">
                                {cartItems.map(item => (
                                    <div key={item.id} className="carrito-item">
                                        <div className="item-image">
                                            {item.imagen ? (
                                                <img src={item.imagen} alt={item.nombre} className="product-image" />
                                            ) : (
                                                <div className="placeholder-image">📦</div>
                                            )}
                                        </div>
                                        <div className="item-details">
                                            <h4 className="item-name">{item.nombre}</h4>
                                            <p className="item-price">${formatNumber(item.precio)}</p>
                                        </div>
                                        <div className="item-controls">
                                            <div className="item-quantity-control">
                                                <button 
                                                    onClick={() => removeFromCart(item.id)} 
                                                    className="qty-btn"
                                                    aria-label="Disminuir cantidad"
                                                >
                                                    -
                                                </button>
                                                <span className="item-quantity">{item.cantidad}</span>
                                                <button 
                                                    onClick={() => addToCart(item)} 
                                                    className="qty-btn"
                                                    disabled={item.cantidad >= item.stock}
                                                    aria-label="Aumentar cantidad"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="item-total">
                                            <p className="item-subtotal">${formatNumber(item.precio * item.cantidad)}</p>
                                            <button 
                                                onClick={() => removeItemTotally(item.id)} 
                                                className="item-remove-btn"
                                                aria-label="Eliminar producto"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Opciones adicionales */}
                            <div className="cart-options">
                                <button className="btn-add-note">
                                    📝 Ingresar código promocional
                                </button>
                            </div>
                        </div>

                        {/* Columna derecha: Resumen del pedido */}
                        <div className="carrito-right">
                            <h3 className="section-title">Resumen del pedido</h3>
                            
                            <div className="summary-details">
                                <div className="summary-row">
                                    <span className="summary-label">Subtotal</span>
                                    <span className="summary-value">${formatNumber(totalAmount)}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Envío</span>
                                    <span className="summary-value">🏪 Retiro en local</span>
                                </div>
                                <div className="summary-divider"></div>
                                <div className="summary-row summary-total">
                                    <span className="summary-label">Total</span>
                                    <span className="summary-value">${formatNumber(totalAmount)}</span>
                                </div>

                                {/* Acordeón de Mercado Pago */}
                                <div className="mp-accordion">
                                    <button 
                                        className="mp-toggle"
                                        onClick={() => setShowMPInfo(!showMPInfo)}
                                    >
                                        <span>💳 Datos de Mercado Pago</span>
                                        <span className="mp-arrow">{showMPInfo ? '▲' : '▼'}</span>
                                    </button>
                                    {showMPInfo && (
                                        <div className="mp-content">
                                            <div className="mp-row">
                                                <span className="mp-label">CVU:</span>
                                                <span className="mp-value">0000003100012345678901</span>
                                                <button 
                                                    className="mp-copy"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('0000003100012345678901');
                                                        Swal.fire({
                                                            toast: true,
                                                            position: 'top-end',
                                                            icon: 'success',
                                                            title: 'CVU copiado',
                                                            showConfirmButton: false,
                                                            timer: 1500,
                                                            timerProgressBar: true
                                                        });
                                                    }}
                                                >
                                                    📋
                                                </button>
                                            </div>
                                            <div className="mp-row">
                                                <span className="mp-label">Alias:</span>
                                                <span className="mp-value">TU.ALIAS.MP</span>
                                                <button 
                                                    className="mp-copy"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('TU.ALIAS.MP');
                                                        Swal.fire({
                                                            toast: true,
                                                            position: 'top-end',
                                                            icon: 'success',
                                                            title: 'Alias copiado',
                                                            showConfirmButton: false,
                                                            timer: 1500,
                                                            timerProgressBar: true
                                                        });
                                                    }}
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* ========== BLOQUE DE PAGO: INICIO ========== */}
                            <div className="payment-actions">
                                {/* Botón de Mercado Pago - Principal */}
                                <button 
                                    onClick={handleMercadoPago} 
                                    className="btn-checkout btn-primary" 
                                    disabled={totalItems === 0}
                                >
                                    💳 Pagar con Mercado Pago
                                </button>
                                
                                <div className="payment-divider">
                                    <span>o</span>
                                </div>

                                {/* Botón QR */}
                                <button 
                                    onClick={handleQR} 
                                    className="btn-checkout btn-qr" 
                                    disabled={totalItems === 0 || qrLoading}
                                >
                                    📱 Pagar con QR
                                </button>
                                
                                <div className="payment-divider">
                                    <span>o</span>
                                </div>
                                
                                {/* Botón de Simulación */}
                                <button 
                                    onClick={handleCheckout} 
                                    className="btn-checkout btn-simulate" 
                                    disabled={totalItems === 0}
                                >
                                    🧪 Simular Compra (Test)
                                </button>
                                
                                <div className="payment-info">
                                    <p className="secure-payment">🔒 Pago seguro</p>
                                </div>

                            </div>
                            {/* ========== BLOQUE DE PAGO: FINAL ========== */}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal QR */}
            {showQR && (
                <div className="qr-modal-overlay" onClick={() => { setShowQR(false); setQrImage(null); }}>
                    <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Escaneá el código QR</h3>
                        <p>Abre la app de Mercado Pago y escaneá para pagar</p>
                        {qrLoading ? (
                            <div className="qr-loading">Generando QR...</div>
                        ) : qrImage ? (
                            <img src={qrImage} alt="QR MercadoPago" className="qr-image" />
                        ) : null}
                        <button className="qr-modal-close" onClick={() => { setShowQR(false); setQrImage(null); }}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Carrito;