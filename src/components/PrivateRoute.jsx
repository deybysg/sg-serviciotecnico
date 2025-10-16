import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children, role }) {
  const { user } = useAuth();

  // Si no hay usuario → redirige a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay restricción de rol y el usuario no cumple → redirige a inicio
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // Si todo bien → renderiza la ruta
  return children;
}

export default PrivateRoute;
