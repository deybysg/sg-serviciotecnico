import { NavLink } from 'react-router-dom';
import NavHamburguesa from './NavHamburguesa';
import MiniCart from './MiniCart';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaTools, FaShoppingCart, FaUserCog } from 'react-icons/fa';
import { BsInfoCircleFill } from "react-icons/bs";
import { FiHome, FiBox, FiLogIn, FiLogOut, FiShoppingBag, FiSearch, FiMapPin, FiShield, FiUser, FiBriefcase } from "react-icons/fi";
import { RiAdminFill } from "react-icons/ri";
import { useState, useEffect } from 'react'; 
import useCartStore from '../store/cartStore'; 
import Carrito from '../pages/Carrito'; 
import { FiChevronDown, FiSettings } from 'react-icons/fi';
import '../styles/components/Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const totalItems = useCartStore(state => state.getTotalItems()); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
          timer: 1200,
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
            
            {/* Guest: título normal */}
            {!user && (
              <span className="navbar-title-text">
                Servicio Técnico Deyby
              </span>
            )}
          </h1>
        </div>

        {/* 2. CENTRO: Seguimiento (solo para visitantes no logueados) */}
        {!user && (
          <div className="navbar-section-center-tracking">
            <NavLink to="/seguimiento" className="tracking-oval-link">
              <FiSearch size={14} /> Estado de tu Equipo
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
              <li><NavLink to="/login"><FiLogIn size={14} /> Mi Cuenta</NavLink></li>
            </>
          )}

          {user?.role === 'user' && (
            <>
              <li><NavLink to="/" end><FiHome size={14} /> Inicio</NavLink></li>
              <li><NavLink to="/productos"><FiBox size={14} /> Productos</NavLink></li>
              <li><NavLink to="/nuestros-servicios"><FiBriefcase size={14} /> Servicios</NavLink></li>
              <li><NavLink to="/miscomprasmodal"><FiShoppingBag size={14} /> Mis compras</NavLink></li>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <li><NavLink to="/admin/paneltrabajos"><FaTools style={{ marginRight: '8px' }} />Panel</NavLink></li>
              <li><NavLink to="/admin/punto-de-venta"><FaShoppingCart style={{ marginRight: '8px' }} />Punto de Venta</NavLink></li>
              <li><NavLink to="/admin/clientes"><FiUser size={14} /> Clientes</NavLink></li>
              <li><NavLink to="/admin/productosAdmin"><FiBox size={14} /> Productos</NavLink></li>
              <li><NavLink to="/admin/servicios"><FiSearch size={14} /> Servicios</NavLink></li>
            </>
          )}
        </ul>

        {/* === CARRITO EN PC (solo user y invitados) === */}
        {(!user || user?.role === 'user') && (
          <button 
            className="cart-btn" 
            onClick={() => user ? setIsCartOpen(true) : useCartStore.getState().setShowMiniCart(true)}
          >
            <FaShoppingCart size={14} /> Carrito
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        )}

        {/* === INFO (solo invitados, después del carrito) === */}
        {!user && (
          <NavLink to="/servicios" className="nav-info-link">
            <BsInfoCircleFill size={14} /> Info
          </NavLink>
        )}

        {/* 4. PERFIL DROPDOWN (todos los roles) */}
        {user && (
          <div className="navbar-profile-dropdown-wrapper">
            <button className="navbar-profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="navbar-user-avatar">
                {user?.role === 'admin' ? <RiAdminFill size={16} /> : user?.role === 'superadmin' ? <FaUserCog size={16} /> : <FiUser size={16} />}
              </div>
              <div className="navbar-trigger-info">
                <strong>{user?.username}</strong>
                <small>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrador' : 'Usuario'}</small>
              </div>
              <FiChevronDown className={`navbar-profile-chevron ${showProfileMenu ? 'open' : ''}`} />
            </button>
            {showProfileMenu && (
              <div className="navbar-profile-dropdown">
                <div className="navbar-dropdown-header">
                  <div className="navbar-user-avatar">
                    {user?.role === 'admin' ? <RiAdminFill size={16} /> : user?.role === 'superadmin' ? <FaUserCog size={16} /> : <FiUser size={16} />}
                  </div>
                  <div>
                    <strong>{user?.username}</strong>
                    <small>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrador' : 'Usuario'}</small>
                  </div>
                </div>
                <div className="navbar-dropdown-divider" />
                <button className="navbar-dropdown-item" onClick={() => { setShowProfileMenu(false); navigate(user?.role === 'admin' ? '/admin/usuarios' : '/'); }}>
                  <FiUser size={15} /> Mi perfil
                </button>
                <button className="navbar-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                  <FiSettings size={15} /> Configuración
                </button>
                <div className="navbar-dropdown-divider" />
                <button className="navbar-dropdown-item navbar-dropdown-item--danger" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                  <FiLogOut size={15} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}

        {/* === BOTÓN CARRITO SOLO EN MÓVIL (solo user y invitados) === */}
        {(!user || user?.role === 'user') && (
          <button 
            className="mobile-cart-btn"
            onClick={() => user ? setIsCartOpen(true) : useCartStore.getState().setShowMiniCart(true)}
          >
            <FaShoppingCart size={14} /> Carrito
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        )}
      </nav>

      {/* MODAL DEL CARRITO */}
      {isCartOpen && <Carrito isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}

      {/* MINI CARRITO PARA INVITADOS */}
      <MiniCart />
    </>
  );
}

export default Navbar;
