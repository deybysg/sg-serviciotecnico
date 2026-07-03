import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import SuperSidebar from "./components/SuperSidebar";
import "./App.css";

// Páginas públicas
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Servicios from "./pages/Servicios";
import NuestrosServicios from "./pages/NuestrosServicios";
import ServicioDetalle from "./pages/ServicioDetalle";
import Login from "./pages/Login";

import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ConsultaServicio from "./pages/ConsultaServicio"; 
import PagoExitoso from "./pages/PagoExitoso";
import PagoFallido from "./pages/PagoFallido";
import PagoPendiente from "./pages/PagoPendiente";

// Panel Admin
import ClientesAdmin from "./admin/ClientesAdmin";
import ProductosAdmin from "./admin/ProductosAdmin";
import ServiciosAdmin from "./admin/ServiciosAdmin";
import EstadisticasAdmin from "./admin/EstadisticasAdmin";
import HistorialAdmin from "./admin/HistorialAdmin";
import Paneltrabajos from "./admin/Paneltrabajos";
import HistorialDeVentas from "./admin/HistorialDeVentas";
import PuntoDeVenta from "./admin/PuntoDeVenta";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartProvider";
import PrivateRoute from "./components/PrivateRoute";
import MisComprasModal from "./pages/MisComprasModal";
import ComprobanteVenta from "./pages/ComprobanteVenta";
import UsuariosAdmin from "./admin/UsuariosAdmin";
import { useAuth } from "./context/AuthContext";
import ServerWakeUp from "./components/ServerWakeUp";


function AppBody() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'superadmin';
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    return (
        <>
            {isSuperAdmin && <SuperSidebar onExpandChange={setSidebarExpanded} />}
            <div className={isSuperAdmin ? `app-content with-super-sidebar${sidebarExpanded ? ' sidebar-expanded' : ''}` : "app-content"}>
                <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/nuestros-servicios" element={<NuestrosServicios />} />
            <Route path="/nuestros-servicios/:id" element={<ServicioDetalle />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Resultados de pago (Mercado Pago) */}
            <Route path="/pago-exitoso" element={<PagoExitoso />} />
            <Route path="/pago-fallido" element={<PagoFallido />} />
            <Route path="/pago-pendiente" element={<PagoPendiente />} />
              
            {/* ✅ RUTAS PÚBLICAS PARA SEGUIMIENTO DE SERVICIO */}
            <Route path="/seguimiento" element={<ConsultaServicio />} />
            <Route path="/seguimiento/:id" element={<ConsultaServicio />} />

          {/* Rutas privadas para usuarios normales: SE ELIMINÓ LA RUTA /carrito */}
                     <Route
            path="/miscomprasmodal"
            element={
              <PrivateRoute roles={["user","admin","superadmin"]}>
                <MisComprasModal />
              </PrivateRoute>
            }
          /> 
            

          {/* Rutas privadas para ADMIN (MANTENIDAS) */}
            <Route
            path="/admin/paneltrabajos"
            element={
              <PrivateRoute roles={["admin","superadmin"]}>
                <Paneltrabajos />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <PrivateRoute roles={["admin","superadmin"]}>
                <ClientesAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/productosAdmin"
            element={
              <PrivateRoute roles={["admin","superadmin"]}>
                <ProductosAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/servicios"
            element={
              <PrivateRoute roles={["admin","superadmin"]}>
                <ServiciosAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/estadisticas"
            element={
              <PrivateRoute roles={["admin","superadmin"]}>
                <EstadisticasAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/historial"
            element={
              <PrivateRoute roles={["admin","superadmin"]}>
                <HistorialAdmin />
              </PrivateRoute>
            }
          />
         <Route
            path="/admin/historialventas"
            element={
              <PrivateRoute roles={["admin","superadmin"]}>
                <HistorialDeVentas />
              </PrivateRoute>
            }
          />

          {/* Ruta Punto de Venta - Solo SuperAdmin */}
          <Route
            path="/admin/punto-de-venta"
            element={
              <PrivateRoute roles={["superadmin"]}>
                <PuntoDeVenta />
              </PrivateRoute>
            }
          />

                    {/* Solo SUPERADMIN */}
                    <Route
                        path="/admin/usuarios"
                        element={
                            <PrivateRoute roles={["superadmin"]}>
                                <UsuariosAdmin />
                            </PrivateRoute>
                        }
                    />

        {/* Ruta para ver comprobante de venta (abre en nueva pestaña desde MisCompras) */}
                    <Route
                        path="/comprobante/:id"
                        element={
                            <PrivateRoute>
                                <ComprobanteVenta />
                            </PrivateRoute>
                        }
                    />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
        </>
    );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider> {/* ⬅️ ENVUELVE EL ROUTER AQUÍ */}
        <Router>
          <ServerWakeUp />
          <Navbar />
                    <AppBody />
                </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
