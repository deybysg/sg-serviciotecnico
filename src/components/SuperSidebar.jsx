import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsersCog, FaTools, FaUserFriends, FaBoxOpen, FaWrench, FaChartBar, FaHistory, FaFileInvoiceDollar } from 'react-icons/fa';
import './SuperSidebar.css';

// Barra lateral colapsada por defecto (64px) y expandible al hover (240px)
// Visible solo para usuarios con rol 'superadmin' (control en AppBody)
export default function SuperSidebar() {
  return (
    <aside className="super-sidebar" aria-label="Menú SuperAdmin">
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
      </nav>
    </aside>
  );
}
