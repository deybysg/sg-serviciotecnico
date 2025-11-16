import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import './Login.css';
import { FaEye, FaEyeSlash, FaLock, FaUser, FaEnvelope } from 'react-icons/fa'; 

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  useEffect(() => {
    if (user) { 
        if (user.role === "admin") {
            navigate("/admin/clientes", { replace: true });
        } else if (user.role === "superadmin") {
            navigate("/admin/clientes", { replace: true });
        }
        else {
            navigate("/productos", { replace: true });
        }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ===== VALIDACIONES FRONTEND =====
    
    // Validar username
    if (!username || username.trim().length < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'El nombre de usuario debe tener al menos 3 caracteres',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    // Validar password
    if (!password || password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'La contraseña debe tener al menos 6 caracteres',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    // Registro
    if (isRegister) {
      // Validar email en registro
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'Por favor ingresa un email válido',
          timer: 2500,
          showConfirmButton: false
        });
        return;
      }

      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Las contraseñas no coinciden',
          timer: 2000,
          showConfirmButton: false
        });
        return;
      }

      const result = await register(username,  password, email);

      if (!result.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message,
          timer: 2000,
          showConfirmButton: false
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: `Bienvenido ${username}!`,
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
      });

      setTimeout(() => {
        navigate(result.user?.role === "admin" || result.user?.role === "superadmin" ? "/admin/clientes" : "/productos");
      }, 2000);

    // Login
    } else {
      const result = await login(username, password);

      if (!result.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message,
          timer: 2000,
          showConfirmButton: false
        });
        return;
      }

      const redirectPath = result.user.role === "admin" || result.user.role === "superadmin" ? "/admin/clientes" : "/productos";
      
      let title;
      if (result.user.role === "superadmin") {
        title = "Bienvenido SuperAdmin";
      } else if (result.user.role === "admin") {
        title = "Bienvenido Admin";
      } else {
        title = `Bienvenido ${result.user.username}`;
      }

      Swal.fire({
        icon: 'success',
        title: title,
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
      });

      setTimeout(() => navigate(redirectPath), 2000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? "Registrarse" : "Iniciar Sesión"}</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <FaUser className="input-icon"/>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <FaEnvelope className="input-icon"/>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <FaLock className="input-icon"/>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="eye-icon" onClick={togglePasswordVisibility}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {isRegister && (
            <div className="input-group">
              <FaLock className="input-icon"/>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span className="eye-icon" onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          )}

          <button type="submit" className="auth-btn">
            {isRegister ? "Crear cuenta" : "Entrar"}
          </button>
        </form>

          {!isRegister && (
            <div className="forgot-password-link">
              <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>
          )}

        <p className="toggle-text">
          {isRegister ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
