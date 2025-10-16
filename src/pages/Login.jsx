import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
        } else {
            navigate("/productos", { replace: true });
        }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Registro
    if (isRegister) {
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
        navigate(result.user?.role === "admin" ? "/admin/clientes" : "/productos");
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

      const redirectPath = result.user.role === "admin" ? "/admin/clientes" : "/productos";
      const title = result.user.role === "admin" ? "Bienvenido Admin" : `Bienvenido ${result.user.username}`;

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
