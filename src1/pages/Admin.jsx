import { Outlet, NavLink } from "react-router-dom";
import "./Admin.css"; 

function Admin() {
  return (
    <div className="admin-layout">
      {/* Menú lateral */}
      <aside className="admin-sidebar">
        <h2>Panel Admin</h2>
        <ul>
          <li><NavLink to="clientes">Clientes</NavLink></li>
          <li><NavLink to="productos">Productos</NavLink></li>
          <li><NavLink to="servicios">Servicios</NavLink></li>
          <li><NavLink to="estadisticas">Estadísticas</NavLink></li>
          <li><NavLink to="historial">Historial</NavLink></li>
        </ul>
      </aside>

      {/* Contenido de cada módulo */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Admin;
