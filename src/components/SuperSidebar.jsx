import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsersCog, FaTools, FaUserFriends, FaBoxOpen, FaWrench, FaChartBar, FaHistory, FaFileInvoiceDollar, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logoTech from '../assets/logo3.png';
import './SuperSidebar.css';

// Barra lateral colapsada por defecto (64px) y expandible al hover (240px)
// Visible solo para usuarios con rol 'superadmin' (control en AppBody)
export default function SuperSidebar() {
  const [isResetting, setIsResetting] = useState(false);
  const { user } = useAuth();

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
      // Notificar globalmente (Navbar u otros listeners)
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

  return (
    <aside className="super-sidebar" aria-label="Menú SuperAdmin">
      <div className="super-sidebar__brand">
        <img src={logoTech} alt="TECHFIX" />
        <div>
          <strong>TECHFIX</strong>
          <span>Servicio técnico</span>
        </div>
      </div>
      <nav className="super-sidebar__nav">
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
        <NavLink to="/admin/historialventas" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaFileInvoiceDollar /></span>
          <span className="super-sidebar__label">H. Ventas</span>
        </NavLink>
        <div className="super-sidebar__divider" />
        <NavLink to="/admin/usuarios" className="super-sidebar__item">
          <span className="super-sidebar__icon"><FaUsersCog /></span>
          <span className="super-sidebar__label">Usuarios</span>
        </NavLink>

        {/* Acción de mantenimiento: limpiar carritos */}
        <button 
          type="button"
          className="super-sidebar__item"
          onClick={handleResetCarts}
          disabled={isResetting}
          title="Vaciar carritos de todos los usuarios"
          style={{ cursor: isResetting ? 'not-allowed' : 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
        >
          {/* <span className="super-sidebar__icon"><FaTrashAlt /></span>
          <span className="super-sidebar__label">Limpiar carritos (todos)</span> */}
        </button>
      </nav>
      <div className="super-sidebar__profile">
        <span>{(user?.username || 'AD').slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>{user?.username || 'Admin'}</strong>
          <small>{user?.role === 'superadmin' ? 'Super Admin' : 'Administrador'}</small>
        </div>
      </div>
    </aside>
  );
}
