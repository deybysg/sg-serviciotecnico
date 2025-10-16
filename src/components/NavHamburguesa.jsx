import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    FaBars, FaTimes, FaHome, FaServicestack, FaSignInAlt, 
    FaShoppingCart, FaUsers, FaChartBar, FaHistory, FaTools
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './NavHamburguesa.css';

function NavHamburguesa() {
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();

    let menuItems = [];

    if (!user) {
        menuItems = [
            { nombre: 'Inicio', to: '/', icon: <FaHome /> },
            { nombre: 'Productos', to: '/productos', icon: <FaShoppingCart /> },
            { nombre: 'Ayuda', to: '/servicios', icon: <FaServicestack /> },
            { nombre: 'Login', to: '/login', icon: <FaSignInAlt /> },
        ];
    } else if (user.role === 'user') {
        menuItems = [
            { nombre: 'Inicio', to: '/', icon: <FaHome /> },
            { nombre: 'Productos', to: '/productos', icon: <FaShoppingCart /> },
            // { nombre: 'Carrito', to: '/carrito', icon: <FaShoppingCart /> },
            { nombre: 'Ayuda', to: '/servicios', icon: <FaServicestack /> },
        ];
    } else if (user.role === 'admin') {
        menuItems = [
            { nombre: 'Panel de Trabajo', to: '/admin/paneltrabajos', icon: <FaTools /> },
            { nombre: 'Clientes', to: '/admin/clientes', icon: <FaUsers /> },
            { nombre: 'Productos', to: '/admin/productosAdmin', icon: <FaShoppingCart /> },
            { nombre: 'Servicios', to: '/admin/servicios', icon: <FaServicestack /> },
            { nombre: 'Estadísticas', to: '/admin/estadisticas', icon: <FaChartBar /> },
            { nombre: 'Historial', to: '/admin/historial', icon: <FaHistory /> },
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
                    timer: 2000,
                    showConfirmButton: false,
                    timerProgressBar: true
                });
            }
        });
    };

    return (
        <>
            <button 
                className={`nav-hamburguesa-btn${open ? ' active' : ''}`} 
                onClick={() => setOpen(true)}
            >
                <FaBars size={28} />
            </button>

            <div className={`nav-hamburguesa-menu${open ? ' open' : ''}`}>
                <div className="nav-hamburguesa-header">
                    <span>Menú</span>
                    <button className="nav-hamburguesa-close" onClick={() => setOpen(false)}>
                        <FaTimes size={24} />
                    </button>
                </div>

                <ul className="nav-hamburguesa-list">
                    {menuItems.map(item => (
                        <li key={item.to}>
                            <Link 
                                to={item.to} 
                                className="nav-hamburguesa-link" 
                                onClick={() => setOpen(false)}
                            >
                                <span className="nav-hamburguesa-icon">{item.icon}</span>
                                {item.nombre}
                            </Link>
                        </li>
                    ))}
                    {user && (
                        <li>
                            <button className="nav-hamburguesa-link" onClick={handleLogout}>
                                <FaSignInAlt /> Logout
                            </button>
                        </li>
                    )}
                </ul>
            </div>

            {open && <div className="nav-hamburguesa-overlay" onClick={() => setOpen(false)}></div>}
        </>
    );
}

export default NavHamburguesa;
