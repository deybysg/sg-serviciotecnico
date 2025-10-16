// import { useState } from 'react';
// import { FaHome, FaSignInAlt, FaServicestack, FaInfoCircle, FaBars, FaTimes } from 'react-icons/fa';
// import { Link } from 'react-router-dom';
// import './SidebarMenu.css';

// const menuItems = [
//   { nombre: 'Inicio', to: '/', icon: <FaHome /> },
//   { nombre: 'Login', to: '/login', icon: <FaSignInAlt /> },
//   { nombre: 'Servicios', to: '/servicios', icon: <FaServicestack /> },
//   { nombre: 'Acerca de Nosotros', to: '/acerca', icon: <FaInfoCircle /> },
// ];

// function SidebarMenu() {
//   const [open, setOpen] = useState(false);

//   return (
//     <>
//       <button className="sidebar-toggle" onClick={() => setOpen(true)} aria-label="Abrir menú">
//         <FaBars size={28} />
//       </button>
//       <div className={`sidebar-menu-sg${open ? ' open' : ''}`}>
//         <div className="sidebar-header">
//           <span>Menu</span>
//           <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Cerrar menú">
//             <FaTimes size={24} />
//           </button>
//         </div>
//         <ul className="sidebar-list">
//           {menuItems.map(item => (
//             <li key={item.to}>
//               <Link to={item.to} className="sidebar-link" onClick={() => setOpen(false)}>
//                 <span className="sidebar-icon">{item.icon}</span>
//                 {item.nombre}
//               </Link>
//             </li>
//           ))}
//         </ul>
//       </div>
//       {open && <div className="sidebar-overlay" onClick={() => setOpen(false)}></div>}
//     </>
//   );
// }

// export default SidebarMenu;
