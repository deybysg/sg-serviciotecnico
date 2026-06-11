// src/pages/PagoPendiente.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PagoResultado.css';

function PagoPendiente() {
    const navigate = useNavigate();

    return (
        <div className="pago-resultado-container">
            <div className="pago-resultado-card pending">
                <div className="resultado-icon">⏳</div>
                <h1>Pago Pendiente</h1>
                <p className="resultado-mensaje">
                    Tu pago está siendo procesado. Te notificaremos cuando se confirme.
                </p>
                
                <div className="resultado-info">
                    <div className="info-item">
                        <span className="info-icon">📧</span>
                        <p>Recibirás un email cuando se confirme el pago</p>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🕐</span>
                        <p>Esto puede tardar unos minutos</p>
                    </div>
                </div>

                <div className="resultado-acciones">
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/historial-compras')}
                    >
                        Ver estado del pedido
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={() => navigate('/')}
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PagoPendiente;
