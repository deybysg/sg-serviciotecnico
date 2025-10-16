import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      const result = await register(username, password);

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
      setTimeout(() => navigate("/"), 2000);

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

      if (result.user.role === "admin") {
        Swal.fire({
          icon: 'success',
          title: 'Bienvenido Admin',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });
        setTimeout(() => navigate("/admin/clientes"), 2000);
      } else {
        Swal.fire({
          icon: 'success',
          title: `Bienvenido ${result.user.username}`,
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });
        setTimeout(() => navigate("/carrito"), 2000);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? "Registrarse" : "Iniciar Sesión"}</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {isRegister && (
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isRegister && (
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
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

