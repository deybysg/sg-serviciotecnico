import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  FaHome, FaShoppingCart, FaClipboardList, FaUser, FaTools, 
  FaCashRegister, FaUsers, FaSignInAlt 
} from 'react-icons/fa';
import { FiBox, FiLogOut, FiBriefcase } from 'react-icons/fi';
import useCartStore from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import '../styles/components/BottomTabBar.css';

function BottomTabBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const totalItems = useCartStore(state => state.getTotalItems());
  const setIsCartOpen = useCartStore(state => state.setShowCartModal);
  const setShowMiniCart = useCartStore(state => state.setShowMiniCart);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    setShowProfile(false);
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
          timer: 1200,
          showConfirmButton: false,
          timerProgressBar: true
        });
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  /* ======== INVITADO ======== */
  if (!user) {
    return (
      <nav className="bottom-tab-bar">
        <NavLink to="/" end className={`bottom-tab-item${isActive('/') ? ' active' : ''}`}>
          <FaHome size={20} />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/productos" className={`bottom-tab-item${isActive('/productos') ? ' active' : ''}`}>
          <FiBox size={20} />
          <span>Productos</span>
        </NavLink>

        <NavLink to="/nuestros-servicios" className={`bottom-tab-item${isActive('/nuestros-servicios') ? ' active' : ''}`}>
          <FiBriefcase size={20} />
          <span>Servicios</span>
        </NavLink>

        <button 
          type="button"
          className="bottom-tab-item bottom-tab-cart"
          onClick={() => setShowMiniCart(true)}
        >
          <FaShoppingCart size={20} />
          {totalItems > 0 && <span className="bottom-tab-badge">{totalItems}</span>}
          <span>Carrito</span>
        </button>

        <NavLink to="/login" className={`bottom-tab-item${isActive('/login') ? ' active' : ''}`}>
          <FaSignInAlt size={20} />
          <span>Login</span>
        </NavLink>
      </nav>
    );
  }

  /* ======== USUARIO ======== */
  if (user.role === 'user') {
    return (
      <nav className="bottom-tab-bar">
        <NavLink to="/" end className={`bottom-tab-item${isActive('/') ? ' active' : ''}`}>
          <FaHome size={20} />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/productos" className={`bottom-tab-item${isActive('/productos') ? ' active' : ''}`}>
          <FiBox size={20} />
          <span>Productos</span>
        </NavLink>

        <button 
          type="button"
          className="bottom-tab-item bottom-tab-cart"
          onClick={() => setIsCartOpen(true)}
        >
          <FaShoppingCart size={20} />
          {totalItems > 0 && <span className="bottom-tab-badge">{totalItems}</span>}
          <span>Carrito</span>
        </button>

        <NavLink to="/miscomprasmodal" className={`bottom-tab-item${isActive('/miscomprasmodal') ? ' active' : ''}`}>
          <FaClipboardList size={20} />
          <span>Compras</span>
        </NavLink>

        <div className="bottom-tab-profile-wrapper">
          <button 
            type="button"
            className="bottom-tab-item"
            onClick={() => setShowProfile(!showProfile)}
          >
            <FaUser size={20} />
            <span>Cuenta</span>
          </button>
          {showProfile && (
            <div className="bottom-tab-profile-popup">
              <div className="bottom-tab-profile-header">
                <span>{(user?.username || 'US').slice(0, 2).toUpperCase()}</span>
                <strong>{user?.username}</strong>
              </div>
              <div className="bottom-tab-profile-divider" />
              <button type="button" className="bottom-tab-profile-item" onClick={handleLogout}>
                <FiLogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {showProfile && (
          <div className="bottom-tab-profile-overlay" onClick={() => setShowProfile(false)} />
        )}
      </nav>
    );
  }

  /* ======== ADMIN ======== */
  if (user.role === 'admin') {
    return (
      <nav className="bottom-tab-bar">
        <NavLink to="/admin/paneltrabajos" className={`bottom-tab-item${isActive('/admin/paneltrabajos') ? ' active' : ''}`}>
          <FaTools size={20} />
          <span>Panel</span>
        </NavLink>

        <NavLink to="/admin/punto-de-venta" className={`bottom-tab-item${isActive('/admin/punto-de-venta') ? ' active' : ''}`}>
          <FaCashRegister size={20} />
          <span>Venta</span>
        </NavLink>

        <NavLink to="/admin/clientes" className={`bottom-tab-item${isActive('/admin/clientes') ? ' active' : ''}`}>
          <FaUsers size={20} />
          <span>Clientes</span>
        </NavLink>

        <NavLink to="/admin/productosAdmin" className={`bottom-tab-item${isActive('/admin/productosAdmin') ? ' active' : ''}`}>
          <FiBox size={20} />
          <span>Productos</span>
        </NavLink>

        <div className="bottom-tab-profile-wrapper">
          <button 
            type="button"
            className="bottom-tab-item"
            onClick={() => setShowProfile(!showProfile)}
          >
            <FaUser size={20} />
            <span>Cuenta</span>
          </button>
          {showProfile && (
            <div className="bottom-tab-profile-popup">
              <div className="bottom-tab-profile-header">
                <span>{(user?.username || 'AD').slice(0, 2).toUpperCase()}</span>
                <strong>{user?.username}</strong>
              </div>
              <div className="bottom-tab-profile-divider" />
              <button type="button" className="bottom-tab-profile-item" onClick={handleLogout}>
                <FiLogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {showProfile && (
          <div className="bottom-tab-profile-overlay" onClick={() => setShowProfile(false)} />
        )}
      </nav>
    );
  }

  /* ======== SUPERADMIN ======== */
  return (
    <nav className="bottom-tab-bar">
      <NavLink to="/admin/paneltrabajos" className={`bottom-tab-item${isActive('/admin/paneltrabajos') ? ' active' : ''}`}>
        <FaTools size={20} />
        <span>Panel</span>
      </NavLink>

      <NavLink to="/admin/punto-de-venta" className={`bottom-tab-item${isActive('/admin/punto-de-venta') ? ' active' : ''}`}>
        <FaCashRegister size={20} />
        <span>Venta</span>
      </NavLink>

      <NavLink to="/admin/clientes" className={`bottom-tab-item${isActive('/admin/clientes') ? ' active' : ''}`}>
        <FaUsers size={20} />
        <span>Clientes</span>
      </NavLink>

      <NavLink to="/admin/productosAdmin" className={`bottom-tab-item${isActive('/admin/productosAdmin') ? ' active' : ''}`}>
        <FiBox size={20} />
        <span>Productos</span>
      </NavLink>

      <div className="bottom-tab-profile-wrapper">
        <button 
          type="button"
          className="bottom-tab-item"
          onClick={() => setShowProfile(!showProfile)}
        >
          <FaUser size={20} />
          <span>Cuenta</span>
        </button>
        {showProfile && (
          <div className="bottom-tab-profile-popup">
            <div className="bottom-tab-profile-header">
              <span>{(user?.username || 'SA').slice(0, 2).toUpperCase()}</span>
              <strong>{user?.username}</strong>
            </div>
            <div className="bottom-tab-profile-divider" />
            <button type="button" className="bottom-tab-profile-item" onClick={handleLogout}>
              <FiLogOut size={16} /> Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {showProfile && (
        <div className="bottom-tab-profile-overlay" onClick={() => setShowProfile(false)} />
      )}
    </nav>
  );
}

export default BottomTabBar;
