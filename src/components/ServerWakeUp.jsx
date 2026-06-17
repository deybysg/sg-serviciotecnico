import React, { useEffect, useState, useRef } from 'react';
import './ServerWakeUp.css';

const TIPS = [
  {
    title: '🌙 Despertando el servidor...',
    text: 'El sistema estaba en reposo para ahorrar energía. Esto puede tardar hasta 60 segundos.'
  },
  {
    title: '☕ Preparando el café virtual...',
    text: '¿Sabías que podés consultar el estado de tu servicio en la sección Seguimiento?'
  },
  {
    title: '⚡ Cargando baterías...',
    text: 'Tip: Usá el buscador de productos para encontrar rápido lo que necesitás.'
  },
  {
    title: '🚀 Encendiendo motores...',
    text: '¿Sabías que podés descargar comprobantes de venta en PDF?'
  },
  {
    title: '🔧 Ajustando engranajes...',
    text: 'Tip: Desde el panel de Admin podés gestionar clientes, servicios y productos.'
  },
  {
    title: '📡 Estableciendo conexión...',
    text: '¿Sabías que el sistema está protegido con autenticación JWT? Tu info está segura.'
  },
  {
    title: '💻 Compilando magia...',
    text: 'Tip: Podés filtrar productos por categoría para encontrar exactamente lo que buscás.'
  },
  {
    title: '🌐 Sincronizando con la nube...',
    text: '¿Sabías que el sistema integra pagos con MercadoPago? Comprá con confianza.'
  },
  {
    title: '✨ Puliedo los pixeles...',
    text: 'Tip: El historial de ventas te permite ver todas tus compras en un solo lugar.'
  },
  {
    title: '🎯 Calibrando puntería...',
    text: '¿Sabías que los admins pueden ver estadísticas detalladas de ventas y servicios?'
  }
];

const ServerWakeUp = () => {
  const [visible, setVisible] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  const progressRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const handleShow = () => {
      setVisible(true);
      progressRef.current = 0;
      setProgress(0);
    };
    const handleHide = () => {
      setVisible(false);
      progressRef.current = 0;
      setProgress(0);
    };

    window.addEventListener('server-waking-up', handleShow);
    window.addEventListener('server-awake', handleHide);

    return () => {
      window.removeEventListener('server-waking-up', handleShow);
      window.removeEventListener('server-awake', handleHide);
    };
  }, []);

  // Animación de puntos suspensivos
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [visible]);

  // Rotación de tips
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [visible]);

  // Barra de progreso simulada (avanza lentamente hasta ~90%)
  useEffect(() => {
    if (!visible) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const startTime = Date.now();
    const maxDuration = 60000; // 60 segundos

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // Función logarítmica para que avance rápido al principio y se detenga cerca del 90%
      const raw = Math.min(elapsed / maxDuration, 1);
      const eased = 1 - Math.pow(1 - raw, 3); // ease-out cubic
      const value = Math.min(eased * 92, 92); // nunca llega al 100% hasta que responda
      
      progressRef.current = value;
      setProgress(value);
      
      if (visible) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  const currentTip = TIPS[tipIndex];

  return (
    <div className="server-wakeup-overlay" role="dialog" aria-modal="true" aria-label="Despertando servidor">
      <div className="server-wakeup-backdrop">
        {/* Partículas flotantes */}
        <div className="wakeup-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="wakeup-particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }} />
          ))}
        </div>

        <div className="server-wakeup-card">
          {/* Logo / Servidor animado */}
          <div className="wakeup-server-container">
            <div className="wakeup-server">
              {/* Cuerpo del servidor */}
              <div className="server-body">
                {/* Luces indicadoras */}
                <div className="server-lights">
                  <span className="server-light light-1" />
                  <span className="server-light light-2" />
                  <span className="server-light light-3" />
                </div>
                {/* Ventiladores */}
                <div className="server-fans">
                  <span className="server-fan" />
                  <span className="server-fan" />
                </div>
              </div>
              {/* Antena */}
              <div className="server-antenna">
                <span className="antenna-signal signal-1" />
                <span className="antenna-signal signal-2" />
                <span className="antenna-signal signal-3" />
              </div>
              {/* Zzz cuando duerme - solo si progress es bajo */}
              {progress < 30 && (
                <div className="server-sleeping">
                  <span className="zzz">Z</span>
                  <span className="zzz zzz-delay">z</span>
                  <span className="zzz zzz-delay-2">z</span>
                </div>
              )}
              {/* Ojos del robot cuando despierta */}
              {progress >= 30 && (
                <div className="server-eyes">
                  <span className={`server-eye ${progress >= 50 ? 'eye-awake' : ''}`} />
                  <span className={`server-eye ${progress >= 50 ? 'eye-awake' : ''}`} />
                </div>
              )}
            </div>
          </div>

          {/* Título principal */}
          <h2 className="wakeup-title">
            {currentTip.title}
            <span className="wakeup-dots">{dots}</span>
          </h2>

          {/* Barra de progreso */}
          <div className="wakeup-progress-wrapper">
            <div className="wakeup-progress-track">
              <div 
                className="wakeup-progress-bar"
                style={{ width: `${progress}%` }}
              >
                <span className="progress-glow" />
              </div>
            </div>
            <span className="wakeup-progress-text">{Math.round(progress)}%</span>
          </div>

          {/* Tip / mensaje */}
          <p className="wakeup-tip">{currentTip.text}</p>

          {/* Badge de branding */}
          <div className="wakeup-branding">
            <span className="wakeup-brand-dot" />
            <span className="wakeup-brand-text">Sistema SG</span>
            <span className="wakeup-brand-dot" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerWakeUp;
