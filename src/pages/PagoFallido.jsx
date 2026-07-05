// src/pages/PagoFallido.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/PagoResultado.css';

function PagoFallido() {
    const navigate = useNavigate();

    return (
        <div className="pago-resultado-container">
            <div className="pago-resultado-card error">
                <div className="resultado-icon">❌</div>
                <h1>Pago Rechazado</h1>
                <p className="resultado-mensaje">
                    No se pudo procesar tu pago. Por favor, intenta nuevamente.
                </p>
                
                <div className="resultado-info">
                    <div className="info-item">
                        <span className="info-icon">ℹ️</span>
                        <p>Verifica que tu tarjeta tenga fondos suficientes</p>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🔒</span>
                        <p>Asegúrate de ingresar correctamente los datos</p>
                    </div>
                </div>

                <div className="resultado-acciones">
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/productos')}
                    >
                        Intentar nuevamente
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

export default PagoFallido;
