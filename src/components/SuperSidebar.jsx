import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaUsersCog, FaTools, FaUserFriends, FaBoxOpen, FaWrench, FaChartBar, FaHistory, FaFileInvoiceDollar, FaTrashAlt, FaCashRegister } from 'react-icons/fa';
import { FiLogOut, FiUser, FiSettings, FiChevronUp } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logoTech from '../assets/logo3.png';
import '../styles/components/SuperSidebar.css';

export default function SuperSidebar({ onExpandChange }) {
  const [isResetting, setIsResetting] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (onExpandChange) onExpandChange(true);
  };

  const handleMouseLeave = () => {
    if (onExpandChange) onExpandChange(false);
  };

  const handleResetCarts = async () => {
    if (isResetting) return;
    const result = await Swal.fire({
      title: '¿Limpiar TODOS los carritos?',
      text: 'Esta acción vaciará los carritos de todos los usuarios. Solo para mantenimiento.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      setIsResetting(true);
      await api.patch('/carts/reset-all', {});
      try { window.dispatchEvent(new CustomEvent('CARTS_RESET_OK')); } catch {}
      Swal.fire({
        icon: 'success',
        title: 'Carritos limpiados',
        text: 'Se vaciaron todos los carritos correctamente.',
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.message || 'No se pudo limpiar los carritos',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Volverás a la pantalla de inicio.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    logout();
    navigate('/', { replace: true });
  };

  return (
    <aside 
      className="super-sidebar" 
      aria-label="Menú SuperAdmin"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="super-sidebar__brand">
        <img src={logoTech} alt="TECHFIX" />
        <div>
          <strong>DEYBY</strong>
          <span>Servicio técnico</span>
        </div> 
      </div>
      <nav className="super-sidebar__nav">
        <NavLink to="/admin/punto-de-venta" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaCashRegister /></span>
          <span className="super-sidebar__label">Punto de Venta</span>
        </NavLink>
        <NavLink to="/admin/paneltrabajos" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaTools /></span>
          <span className="super-sidebar__label">Panel de Trabajo</span>
        </NavLink>
        <NavLink to="/admin/clientes" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaUserFriends /></span>
          <span className="super-sidebar__label">Clientes</span>
        </NavLink>
        <NavLink to="/admin/productosAdmin" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaBoxOpen /></span>
          <span className="super-sidebar__label">Productos</span>
        </NavLink>
        <NavLink to="/admin/servicios" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaWrench /></span>
          <span className="super-sidebar__label">Servicios</span>
        </NavLink>
        <NavLink to="/admin/estadisticas" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaChartBar /></span>
          <span className="super-sidebar__label">Estadísticas</span>
        </NavLink>
        <NavLink to="/admin/historial" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaHistory /></span>
          <span className="super-sidebar__label">H. Servicios</span>
        </NavLink>
        <NavLink to="/admin/historialmovimientos" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaFileInvoiceDollar /></span>
          <span className="super-sidebar__label">H. Movimientos</span>
        </NavLink>
        <div className="super-sidebar__divider" />
        <NavLink to="/admin/usuarios" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaUsersCog /></span>
          <span className="super-sidebar__label">Usuarios</span>
        </NavLink>
      </nav>
      <div className="super-sidebar__profile-wrapper">
        <button
          className="super-sidebar__profile"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          aria-label="Menú de perfil"
        >
          <span className="super-sidebar__avatar">{(user?.username || 'AD').slice(0, 2).toUpperCase()}</span>
          <div className="super-sidebar__profile-info">
            <strong>{user?.username || 'Admin'}</strong>
            <small className={`super-sidebar__role-badge role-${user?.role}`}>
              {user?.role === 'superadmin' ? 'Super Admin' : 'Administrador'}
            </small>
          </div>
          <FiChevronUp className={`super-sidebar__chevron ${showProfileMenu ? 'open' : ''}`} />
        </button>

        {showProfileMenu && (
          <div className="super-sidebar__dropdown">
            <button className="super-sidebar__dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/admin/usuarios'); }}>
              <FiUser size={16} /> Mi perfil
            </button>
            <button className="super-sidebar__dropdown-item" onClick={() => { setShowProfileMenu(false); }}>
              <FiSettings size={16} /> Configuración
            </button>
            <div className="super-sidebar__dropdown-divider" />
            <button className="super-sidebar__dropdown-item super-sidebar__dropdown-item--danger" onClick={handleLogout}>
              <FiLogOut size={16} /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
