import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import './ResetPassword.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ===== VALIDACIONES FRONTEND =====
    
    // Validar que existe el token
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Token inválido',
        text: 'El enlace de recuperación no es válido',
      });
      return;
    }

    // Validar que la contraseña no esté vacía
    if (!password || password.trim().length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña requerida',
        text: 'Por favor ingresa una contraseña',
      });
      return;
    }

    // Validar longitud mínima
    if (password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Las contraseñas no coinciden',
        text: 'Por favor verifica que ambas contraseñas sean iguales',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Contraseña actualizada!',
          text: 'Tu contraseña ha sido restablecida exitosamente',
          confirmButtonText: 'Ir al login',
        }).then(() => {
          navigate('/login');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'No se pudo restablecer la contraseña',
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

  if (!token) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <h2>Token Inválido</h2>
          <p>El enlace de recuperación no es válido o ha expirado.</p>
          <button 
            className="btn-back"
            onClick={() => navigate('/login')}
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Restablecer Contraseña</h2>
        <p className="reset-password-description">
          Ingresa tu nueva contraseña
        </p>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Restablecer contraseña'}
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

export default ResetPassword;
