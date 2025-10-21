import { NavLink } from 'react-router-dom';
import NavHamburguesa from './NavHamburguesa';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaTools, FaShoppingCart } from 'react-icons/fa';
import { useState } from 'react'; 
import { useCart } from '../context/CartContext'; 
import Carrito from '../pages/Carrito'; 
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { totalItems } = useCart(); 
  const [isCartOpen, setIsCartOpen] = useState(false); 

  const handleLogout = () => {
    Swal.fire({
      title: '¿Seguro que quieres cerrar sesión?',
      text: "Tendrás que iniciar sesión nuevamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente.',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });
        setTimeout(() => navigate("/login"), 2000);
      }
    });
  };

  const navbarClass = user?.role === 'admin' ? 'navbar-sg navbar-admin-mode' : 'navbar-sg';

  return (
    <>
      <nav className={navbarClass}>
        {/* 1. IZQUIERDA: Hamburguesa + Logo */}
        <div className="navbar-section-left">
          <div className="navbar-hamburguesa-container">
            <NavHamburguesa />
          </div>
          <h1 className="navbar-title-logo">
            <img src="/img/logo2.png" alt="Logo SG" className="navbar-logo-image" />
            <span 
              className="navbar-title-text" 
              style={{ color: user?.role === "admin" ? "#FFD700" : "#ffffff" }}
            >
              {user?.role === "admin" ? "Panel Admin" : "Servicio Técnico"}
            </span>
          </h1>
        </div>

        {/* 2. CENTRO: Seguimiento */}
        {(!user || user.role === 'user') && (
          <div className="navbar-section-center-tracking">
            <NavLink to="/seguimiento" className="tracking-oval-link">
              Seguimiento de Servicio
            </NavLink>
          </div>
        )}

        {/* 3. DERECHA: Links (PC) */}
        <ul className="navbar-links-right">
          {!user && (
            <>
              <li><NavLink to="/" end>Inicio</NavLink></li>
              <li><NavLink to="/productos">Productos</NavLink></li>
              <li><NavLink to="/login">Login</NavLink></li>
              <li><NavLink to="/servicios">Ayuda</NavLink></li>
            </>
          )}

          {user?.role === 'user' && (
            <>
              <li><NavLink to="/" end>Inicio</NavLink></li>
              <li><NavLink to="/productos">Productos</NavLink></li>
              <li><NavLink to="/miscomprasmodal">Mis compras</NavLink></li>

              {/* === CARRITO EN PC === */}
              <li>
                <button 
                  className="cart-btn" 
                  onClick={() => setIsCartOpen(true)}
                >
                  <FaShoppingCart size={22} />
                  {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                </button>
              </li>

              <li>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </li>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <li><NavLink to="/admin/paneltrabajos"><FaTools style={{ marginRight: '8px' }} />Panel de Trabajo</NavLink></li>
              <li><NavLink to="/admin/clientes">Clientes</NavLink></li>
              <li><NavLink to="/admin/productosAdmin">Productos</NavLink></li>
              <li><NavLink to="/admin/servicios">Servicios</NavLink></li>
              <li><NavLink to="/admin/estadisticas">Estadísticas</NavLink></li>
              <li><NavLink to="/admin/historial">Historial</NavLink></li>
              <li>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </li>
            </>
          )}
        </ul>

        {/* === BOTÓN CARRITO SOLO EN MÓVIL === */}
        {user?.role === 'user' && (
          <button 
            className="mobile-cart-btn"
            onClick={() => setIsCartOpen(true)}
          >
            <FaShoppingCart size={22} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        )}
      </nav>

      {/* MODAL DEL CARRITO */}
      {isCartOpen && <Carrito isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
}

export default Navbar;
