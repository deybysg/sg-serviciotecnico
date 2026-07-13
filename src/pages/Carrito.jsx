// src/components/Carrito.jsx

import React, { useState } from 'react';
import useCartStore from '../store/cartStore';
import { useAuth } from '../context/AuthContext'; 
import { api } from '../services/api';
import { clearCartExpiration } from '../utils/cartExpiration';
import { FaPlus, FaMinus, FaTrashAlt, FaShoppingCart, FaCopy, FaLock } from 'react-icons/fa';
import { FiTrash2, FiCreditCard } from 'react-icons/fi';
import { BsQrCode, BsCreditCard } from 'react-icons/bs';
import Swal from 'sweetalert2';
import '../styles/pages/Carrito.css'; 

// Función de compra simulada eliminada - solo se usa transferencia y MercadoPago

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

    // Estado para modal de medios de pago
    const [showPaymentMethods, setShowPaymentMethods] = useState(false);

    // 💡 Obtiene el username o 'Invitado' si no hay usuario logueado
    const displayUsername = user?.username || 'Invitado';

    // Función para formatear números con puntos de miles
    const formatNumber = (num) => {
        return new Intl.NumberFormat('es-AR').format(num);
    }; 

    if (!isOpen) {
        return null;
    }

    // 🏦 FUNCIÓN TRANSFERENCIA
    const handleTransferencia = async () => {
        // Verificar expiración del carrito
        if (useCartStore.getState().checkExpiration()) {
            return;
        }

        if (!user || user.role === 'Invitado') {
            Swal.fire({
                icon: 'info',
                title: 'Inicia Sesión',
                text: 'Debes iniciar sesión para realizar una compra.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1200
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

        // Paso 1: Mostrar datos de transferencia
        const result = await Swal.fire({
            title: 'Datos de transferencia',
            html: `
                <div style="text-align: left; padding: 10px;">
                    <p style="margin: 8px 0; color: #0c4a6e;"><strong>Banco:</strong> Nación</p>
                    <p style="margin: 8px 0; color: #0c4a6e;"><strong>Titular:</strong> Zenteno Deyby Brayan</p>
                    <p style="margin: 8px 0; color: #0c4a6e;"><strong>CBU:</strong> 0000003100055094459294</p>
                    <p style="margin: 8px 0; color: #0c4a6e;"><strong>Alias:</strong> sg.tecnico</p>
                    <p style="margin: 12px 0 0; color: #0284c7; font-size: 0.85rem;">
                        <strong>Total a transferir: $${formatNumber(totalAmount)}</strong>
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Ya transferí, enviar comprobante',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        // Paso 2: Seleccionar comprobante
        const { value: file } = await Swal.fire({
            title: 'Enviar comprobante',
            html: `
                <p style="margin: 0 0 12px; color: #64748b; font-size: 0.85rem;">
                    Subí una foto o captura del comprobante de transferencia
                </p>
                <input type="file" id="swal-comprobante" accept="image/*" 
                    style="width: 100%; padding: 10px; border: 1px solid #bae6fd; border-radius: 8px; background: white;">
            `,
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Enviar comprobante',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const input = document.getElementById('swal-comprobante');
                if (!input.files || !input.files[0]) {
                    Swal.showValidationMessage('Seleccioná un comprobante');
                    return false;
                }
                const file = input.files[0];
                // Validar tipo de archivo
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    Swal.showValidationMessage('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)');
                    return false;
                }
                // Validar tamaño (máx 5MB)
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    Swal.showValidationMessage('La imagen no debe superar los 5MB');
                    return false;
                }
                return file;
            }
        });

        if (!file) return;

        // Paso 3: Subir comprobante y registrar pago
        try {
            Swal.fire({
                title: 'Enviando comprobante...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            // Convertir archivo a base64 comprimido
            const compressImage = (file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxSize = 800;
                            let width = img.width;
                            let height = img.height;
                            if (width > maxSize || height > maxSize) {
                                if (width > height) {
                                    height = (height / width) * maxSize;
                                    width = maxSize;
                                } else {
                                    width = (width / height) * maxSize;
                                    height = maxSize;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                            resolve(canvas.toDataURL('image/jpeg', 0.6));
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            };
            const base64 = await compressImage(file);

            // Enviar al backend
            await api.post('/pagos-pendientes', {
                username: user.username,
                fechaCompra: new Date().toISOString(),
                totalVenta: totalAmount,
                comprobante: base64,
                productosComprados: cartItems.map(item => ({
                    productId: item._id || item.id,
                    nombre: item.nombre,
                    categoria: item.categoria,
                    precioUnitario: item.precio,
                    cantidad: item.cantidad,
                    subtotal: item.precio * item.cantidad
                }))
            });

            // Vaciar carrito y persistir en servidor (el stock se actualiza cuando el admin acepta)
            useCartStore.setState({ cartItems: [], showMiniCart: false });
            useCartStore.getState().persistCart();
            clearCartExpiration();

            window.dispatchEvent(new Event('purchaseCompleted'));

            Swal.fire({
                icon: 'info',
                title: '⏳ Esperando confirmación',
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <p style="margin: 8px 0; color: #0c4a6e;"><strong>Estado:</strong> <span style="color: #ffc400;">Pendiente de aprobación</span></p>
                        <p style="margin: 8px 0; color: #0c4a6e;"><strong>Total:</strong> $${formatNumber(totalAmount)}</p>
                        <p style="margin: 8px 0; color: #0284c7; font-size: 0.85rem;">Un administrador revisará tu comprobante y confirmará la compra.</p>
                        <p style="margin: 8px 0; color: #64748b; font-size: 0.8rem;">Recibirás una notificación cuando sea aprobado.</p>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#00b7ff'
            });
            onClose();

        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al enviar comprobante',
                showConfirmButton: false,
                timer: 4000
            });
        }
    };

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
                timer: 1200
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
            Swal.fire({ icon: 'info', title: 'Inicia Sesión', text: 'Debes iniciar sesión para realizar una compra.', toast: true, position: 'top-end', showConfirmButton: false, timer: 1200 });
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

    return (
        <>
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
                        <FaShoppingCart size={14} />
                        <span className="item-count">{totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}</span>
                    </div>
                </div>
                
                {cartItems.length === 0 ? (
                    <div className="carrito-empty">
                        <div className="empty-icon"><FaShoppingCart size={60} /></div>
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
                                    <FiTrash2 size={12} /> Vaciar carrito
                                </button>
                            </div>
                            <div className="carrito-items-list">
                                {cartItems.map(item => (
                                    <div key={item.id} className="carrito-item">
                                        <div className="item-image">
                                            {item.imagen ? (
                                                <img src={item.imagen} alt={item.nombre} className="product-image" />
                                            ) : (
                                                <div className="placeholder-image"><FaShoppingCart size={20} /></div>
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
                                    <FaCopy size={12} /> Ingresar código promocional
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
                            </div>
                            
                            {/* ========== BLOQUE DE PAGO ========== */}
                            <div className="payment-actions">
                                {/* Botón Medios de Pago */}
                                <button 
                                    onClick={() => setShowPaymentMethods(true)} 
                                    className="btn-checkout btn-primary" 
                                    disabled={totalItems === 0}
                                >
                                    <FiCreditCard size={16} /> Medios de pago
                                </button>
                                
                                <div className="payment-info">
                                    <p className="secure-payment"><FaLock size={12} /> Pago seguro</p>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Modal Medios de Pago */}
        {showPaymentMethods && (
            <div className="payment-modal-overlay" onClick={() => setShowPaymentMethods(false)}>
                <div className="payment-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="payment-modal-header">
                        <h3><FiCreditCard size={20} /> Medios de pago</h3>
                        <button className="payment-modal-close" onClick={() => setShowPaymentMethods(false)}>&times;</button>
                    </div>
                    <div className="payment-modal-body">
                        <button className="payment-option" onClick={() => { setShowPaymentMethods(false); handleMercadoPago(); }}>
                            <BsCreditCard size={20} />
                            <div className="payment-option-info">
                                <strong>Mercado Pago</strong>
                                <small>Tarjeta de crédito o débito</small>
                            </div>
                        </button>
                        <button className="payment-option" onClick={() => { setShowPaymentMethods(false); handleQR(); }}>
                            <BsQrCode size={20} />
                            <div className="payment-option-info">
                                <strong>QR Mercado Pago</strong>
                                <small>Escanear con la app</small>
                            </div>
                        </button>
                        <button className="payment-option" onClick={() => { setShowPaymentMethods(false); handleTransferencia(); }}>
                            <FaCopy size={20} />
                            <div className="payment-option-info">
                                <strong>Transferencia bancaria</strong>
                                <small>CBU o Alias</small>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default Carrito;