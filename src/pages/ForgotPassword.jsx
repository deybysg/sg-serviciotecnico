import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/pages/ForgotPassword.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ===== VALIDACIONES FRONTEND =====
    
    // Validar que el email no esté vacío
    if (!email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Email requerido',
        text: 'Por favor ingresa tu email',
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Email inválido',
        text: 'Por favor ingresa un email válido (ejemplo: usuario@dominio.com)',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Email enviado!',
          text: 'Revisa tu correo para restablecer tu contraseña',
          confirmButtonText: 'Ok',
        }).then(() => {
          navigate('/login');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'No se pudo enviar el email',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al procesar tu solicitud',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Recuperar Contraseña</h2>
        <p className="forgot-password-description">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu_email@ejemplo.com"
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>

          <button 
            type="button" 
            className="btn-back"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Volver al login
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
