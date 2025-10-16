import { NavLink } from 'react-router-dom';
import NavHamburguesa from './NavHamburguesa';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar-sg">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="navbar-hamburguesa-container">
          <NavHamburguesa />
        </div>
        <h1>SG Servicio Técnico</h1>
      </div>
      <ul className="navbar-links-right">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Inicio
          </NavLink>
        </li>
        <li>
          <NavLink to="/servicios" className={({ isActive }) => isActive ? 'active' : ''}>
            Servicios
          </NavLink>
        </li>
        <li>
          <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
            Login
          </NavLink>
        </li>
        <li>
          <NavLink to="/acerca" className={({ isActive }) => isActive ? 'active' : ''}>
            Acerca de Nosotros
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
