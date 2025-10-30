import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SuperSidebar from "./components/SuperSidebar";

// Páginas públicas
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Servicios from "./pages/Servicios";
import Login from "./pages/Login";

import NotFound from "./pages/NotFound";
import ConsultaServicio from "./pages/ConsultaServicio"; 

// Panel Admin
import ClientesAdmin from "./admin/ClientesAdmin";
import ProductosAdmin from "./admin/ProductosAdmin";
import ServiciosAdmin from "./admin/ServiciosAdmin";
import EstadisticasAdmin from "./admin/EstadisticasAdmin";
import HistorialAdmin from "./admin/HistorialAdmin";
import Paneltrabajos from "./admin/Paneltrabajos";
import HistorialDeVentas from "./admin/HistorialDeVentas";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartProvider"; 
import PrivateRoute from "./components/PrivateRoute";
import MisComprasModal from "./pages/MisComprasModal";
import ComprobanteVenta from "./pages/ComprobanteVenta";
import UsuariosAdmin from "./admin/UsuariosAdmin";
import { useAuth } from "./context/AuthContext";


function AppBody() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'superadmin';

    return (
        <>
            {isSuperAdmin && <SuperSidebar />}
            <div style={{ marginLeft: isSuperAdmin ? 64 : 0 }}>
                <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/servicios" element={<Servicios />} />
              
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
          <Navbar />
                    <AppBody />
                </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;