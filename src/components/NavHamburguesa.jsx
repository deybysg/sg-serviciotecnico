import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FaBars, FaTimes, FaHome, FaServicestack, FaSignInAlt, 
    FaShoppingCart, FaUsers, FaChartBar, FaHistory, FaTools, FaShoppingBag
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import logoTech from '../assets/logo3.png';
import './NavHamburguesa.css';

function NavHamburguesa() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const { user, logout } = useAuth();

    useEffect(() => {
        if (menuRef.current) {
            if (!open) {
                menuRef.current.setAttribute('inert', '');
            } else {
                menuRef.current.removeAttribute('inert');
            }
        }
    }, [open]);

    let menuItems = [];

    if (!user) {
        menuItems = [
            { nombre: 'Seguimiento de tu servicio', to: '/seguimiento', icon: <FaTools />, isCta: true },
            { nombre: 'Inicio', to: '/', icon: <FaHome /> },
            { nombre: 'Productos', to: '/productos', icon: <FaShoppingCart /> },
            { nombre: 'Servicios', to: '/nuestros-servicios', icon: <FaServicestack /> },
            { nombre: 'Ayuda', to: '/servicios', icon: <FaServicestack /> },
            { nombre: 'Login', to: '/login', icon: <FaSignInAlt /> },
        ];
    } else if (user.role === 'user') {
        menuItems = [
            { nombre: 'Seguimiento de tu servicio', to: '/seguimiento', icon: <FaTools />, isCta: true },
            { nombre: 'Inicio', to: '/', icon: <FaHome /> },
            { nombre: 'Productos', to: '/productos', icon: <FaShoppingCart /> },
            { nombre: 'Servicios', to: '/nuestros-servicios', icon: <FaServicestack /> },
            { nombre: 'Mis compras', to: '/miscomprasmodal', icon: <FaShoppingBag /> },
        ];
    } else if (user.role === 'admin') {
        menuItems = [
            { nombre: 'Panel de Trabajo', to: '/admin/paneltrabajos', icon: <FaTools /> },
            { nombre: 'Clientes', to: '/admin/clientes', icon: <FaUsers /> },
            { nombre: 'Productos', to: '/admin/productosAdmin', icon: <FaShoppingCart /> },
            { nombre: 'Servicios', to: '/admin/servicios', icon: <FaServicestack /> },
            // { nombre: 'Estadísticas', to: '/admin/estadisticas', icon: <FaChartBar /> },
            // { nombre: 'H. Servicios', to: '/admin/historial', icon: <FaHistory /> },
            // { nombre: 'H. Ventas', to: '/admin/historialventas', icon: <FaHistory /> },
        ];
    }else if (user.role === 'superadmin') {
        menuItems = [
            { nombre: 'Panel de Trabajo', to: '/admin/paneltrabajos', icon: <FaTools /> },
            { nombre: 'Clientes', to: '/admin/clientes', icon: <FaUsers /> },
            { nombre: 'Productos', to: '/admin/productosAdmin', icon: <FaShoppingCart /> },
            { nombre: 'Servicios', to: '/admin/servicios', icon: <FaServicestack /> },
            { nombre: 'Estadísticas', to: '/admin/estadisticas', icon: <FaChartBar /> },
            { nombre: 'H. Servicios', to: '/admin/historial', icon: <FaHistory /> },
            { nombre: 'H. Ventas', to: '/admin/historialventas', icon: <FaHistory /> },
        ];
    }

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
                setOpen(false);
                Swal.fire({
                    icon: 'success',
                    title: 'Sesión cerrada',
                    text: 'Has cerrado sesión correctamente.',
                    timer: 1200,
                    showConfirmButton: false,
                    timerProgressBar: true
                });
            }
        });
    };

    const handleOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
    };

    const handleClose = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setOpen(false);
    };

    return (
        <>
            <button 
                type="button"
                aria-label="Abrir menú"
                aria-expanded={open}
                className={`nav-hamburguesa-btn${open ? ' active' : ''}`} 
                onClick={handleOpen}
            >
                <FaBars size={28} />
            </button>

            <div 
                ref={menuRef}
                className={`nav-hamburguesa-menu${open ? ' open' : ''}`}
            >
                <div className="nav-hamburguesa-header">
                    <div className="nav-hamburguesa-brand">
                        <img src={logoTech} alt="DEYBY" />
                        <div>
                            <strong>DEYBY</strong>
                            <span>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrador' : 'Servicio técnico'}</span>
                        </div>
                    </div>
                    <button 
                        type="button"
                        aria-label="Cerrar menú"
                        className="nav-hamburguesa-close" 
                        onClick={handleClose}
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <ul className="nav-hamburguesa-list">
                    {menuItems.map(item => (
                        <li 
                            key={item.to}
                            className={item.isCta ? 'nav-hamburguesa-tracking-item' : ''}
                        >
                            <NavLink 
                                to={item.to} 
                                className={({ isActive }) => `${item.isCta ? 'nav-hamburguesa-tracking-cta' : 'nav-hamburguesa-link'}${isActive ? ' active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                }}
                            >
                                {item.isCta ? (
                                    <>
                                        <span className="tracking-icon">{item.icon}</span>
                                        <div className="tracking-text-group">
                                            <span className="tracking-title">{item.nombre}</span>
                                            <span className="tracking-subtitle">¡Ver estado de tu orden!</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="nav-hamburguesa-icon">{item.icon}</span>
                                        {item.nombre}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}

                    {/* 🔹 Logout alineado igual que los demás enlaces */}
                    {user && (
                        <li>
                            <button 
                                type="button"
                                className="nav-hamburguesa-link" 
                                onClick={handleLogout}
                            >
                                <span className="menu-item logout"><FaSignInAlt /></span>
                                Logout
                            </button>
                        </li>
                    )}
                </ul>
                {user && (
                    <div className="nav-hamburguesa-profile">
                        <span>{(user?.username || 'AD').slice(0, 2).toUpperCase()}</span>
                        <div>
                            <strong>{user?.username || 'Admin'}</strong>
                            <small>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrador' : 'Usuario'}</small>
                        </div>
                    </div>
                )}
            </div>

            {open && (
                <div 
                    className="nav-hamburguesa-overlay" 
                    onClick={handleClose}
                    role="button"
                    tabIndex={0}
                    aria-label="Cerrar menú"
                />
            )}
        </>
    );
}

export default NavHamburguesa;
