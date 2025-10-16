import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Páginas públicas
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Servicios from "./pages/Servicios";
import Login from "./pages/Login";
// 🗑️ ELIMINAMOS EL COMPONENTE PÁGINA: import Carrito from "./pages/Carrito"; 
import NotFound from "./pages/NotFound";
import ConsultaServicio from "./pages/ConsultaServicio"; 

// Panel Admin
import ClientesAdmin from "./admin/ClientesAdmin";
import ProductosAdmin from "./admin/ProductosAdmin";
import ServiciosAdmin from "./admin/ServiciosAdmin";
import EstadisticasAdmin from "./admin/EstadisticasAdmin";
import HistorialAdmin from "./admin/HistorialAdmin";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // ⬅️ NUEVO IMPORT
import PrivateRoute from "./components/PrivateRoute";
import Paneltrabajos from "./admin/Paneltrabajos";

function App() {
  return (
    <AuthProvider>
      <CartProvider> {/* ⬅️ ENVUELVE EL ROUTER AQUÍ */}
        <Router>
          <Navbar />
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
          {/*           <Route
            path="/carrito"
            element={
              <PrivateRoute role="user">
                <Carrito />
              </PrivateRoute>
            }
          /> 
            */}

          {/* Rutas privadas para ADMIN (MANTENIDAS) */}
            <Route
            path="/admin/paneltrabajos"
            element={
              <PrivateRoute role="admin">
                <Paneltrabajos />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <PrivateRoute role="admin">
                <ClientesAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/productosAdmin"
            element={
              <PrivateRoute role="admin">
                <ProductosAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/servicios"
            element={
              <PrivateRoute role="admin">
                <ServiciosAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/estadisticas"
            element={
              <PrivateRoute role="admin">
                <EstadisticasAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/historial"
            element={
              <PrivateRoute role="admin">
                <HistorialAdmin />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;