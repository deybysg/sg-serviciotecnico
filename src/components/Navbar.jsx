import { NavLink } from 'react-router-dom';
import NavHamburguesa from './NavHamburguesa';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaTools, FaShoppingCart } from 'react-icons/fa';
import { BsInfoCircleFill } from "react-icons/bs";
import { FiHome, FiBox, FiLogIn, FiLogOut, FiShoppingBag, FiSearch, FiMapPin, FiShield, FiUser, FiBriefcase } from "react-icons/fi";
import { useState, useEffect } from 'react'; 
import useCartStore from '../store/cartStore'; 
import Carrito from '../pages/Carrito'; 
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const totalItems = useCartStore(state => state.getTotalItems()); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.body.dataset.role = user?.role || 'guest';
    return () => { delete document.body.dataset.role; };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escuchar evento global de reseteo de carritos (solo útil para superadmin)
  useEffect(() => {
    const handler = () => {
      if (user?.role === 'superadmin') {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Todos los carritos fueron limpiados',
          timer: 1800,
          showConfirmButton: false
        });
      }
    };
    window.addEventListener('CARTS_RESET_OK', handler);
    return () => window.removeEventListener('CARTS_RESET_OK', handler);
  }, [user?.role]);

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

  const isAdminish = user?.role === 'admin' || user?.role === 'superadmin';
  const navbarClass = [
    'navbar-sg',
    isAdminish ? 'navbar-admin-mode' : '',
    isScrolled ? 'navbar-scrolled' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      <nav className={navbarClass}>
        {/* Scanline effect */}
        <div className="scanline" />
        
        {/* 1. IZQUIERDA: Hamburguesa + Logo */}
        <div className="navbar-section-left">
          <div className="navbar-hamburguesa-container">
            <NavHamburguesa />
          </div>
          <h1 className="navbar-title-logo">
            <img src="/img/logo2.png" alt="Logo SG" className="navbar-logo-image" />
            <span 
              className="navbar-title-text" 
              style={{ color: isAdminish ? "#FFD700" : "#ffffff" }}
            >
              {user?.role === "superadmin" ? "SuperAdmin" : (user?.role === "admin" ? "Panel Admin" : "Servicio Técnico")}
            </span>
          </h1>
        </div>

        {/* 2. CENTRO: Seguimiento */}
        {(!user || user.role === 'user') && (
          <div className="navbar-section-center-tracking">
            <NavLink to="/seguimiento" className="tracking-oval-link">
              <FiSearch size={14} /> Seguimiento de Servicio
            </NavLink>
          </div>
        )}

        {/* 3. DERECHA: Links (PC) */}
        <ul className="navbar-links-right">
          {!user && (
            <>
              <li><NavLink to="/" end><FiHome size={14} /> Inicio</NavLink></li>
              <li><NavLink to="/productos"><FiBox size={14} /> Productos</NavLink></li>
              <li><NavLink to="/nuestros-servicios"><FiBriefcase size={14} /> Servicios</NavLink></li>
              <li><NavLink to="/login"><FiLogIn size={14} /> Login</NavLink></li>
              <li><NavLink to="/servicios"><BsInfoCircleFill size={14} /> Info</NavLink></li>
            </>
          )}

          {user?.role === 'user' && (
            <>
              <li><NavLink to="/" end><FiHome size={14} /> Inicio</NavLink></li>
              <li><NavLink to="/productos"><FiBox size={14} /> Productos</NavLink></li>
              <li><NavLink to="/nuestros-servicios"><FiBriefcase size={14} /> Servicios</NavLink></li>
              <li><NavLink to="/miscomprasmodal"><FiShoppingBag size={14} /> Mis compras</NavLink></li>

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
                <button onClick={handleLogout} className="logout-btn">
                  <FiLogOut size={14} /> Salir
                </button>
              </li>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <li><NavLink to="/admin/paneltrabajos"><FaTools style={{ marginRight: '8px' }} />Panel</NavLink></li>
              <li><NavLink to="/admin/clientes"><FiUser size={14} /> Clientes</NavLink></li>
              <li><NavLink to="/admin/productosAdmin"><FiBox size={14} /> Productos</NavLink></li>
              <li><NavLink to="/admin/servicios"><FiSearch size={14} /> Servicios</NavLink></li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  <FiLogOut size={14} /> Salir
                </button>
              </li>
            </>
          )}

          {user?.role === 'superadmin' && (
            <>
              {/* Para superadmin usamos la barra lateral; aquí solo dejamos Logout */}
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  <FiLogOut size={14} /> Salir
                </button>
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
