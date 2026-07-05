// src/pages/PagoExitoso.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import '../styles/pages/PagoResultado.css';

function PagoExitoso() {
    const navigate = useNavigate();
    const clearCart = useCartStore(state => state.clearCart);

    useEffect(() => {
        // Limpiar carrito al confirmar pago exitoso
        clearCart();
    }, [clearCart]);

    return (
        <div className="pago-resultado-container">
            <div className="pago-resultado-card success">
                <div className="resultado-icon">✅</div>
                <h1>¡Pago Exitoso!</h1>
                <p className="resultado-mensaje">
                    Tu compra ha sido procesada correctamente.
                </p>
                
                <div className="resultado-info">
                    <div className="info-item">
                        <span className="info-icon">📧</span>
                        <p>Recibirás un email con el comprobante de compra</p>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🏪</span>
                        <p>Tu pedido estará listo para retirar en 24-48 horas</p>
                    </div>
                </div>

                <div className="resultado-acciones">
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/historial-compras')}
                    >
                        Ver mis compras
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={() => navigate('/productos')}
                    >
                        Seguir comprando
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PagoExitoso;
