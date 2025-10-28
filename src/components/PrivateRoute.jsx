import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// PrivateRoute ahora soporta 'role' (string) o 'roles' (array de strings)
function PrivateRoute({ children, role, roles }) {
  const { user } = useAuth();

  // Si no hay usuario → redirige a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normaliza roles permitidos
  const allowedRoles = roles || (role ? [role] : null);

  // Si hay restricción de rol y el usuario no cumple → redirige a inicio
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Si todo bien → renderiza la ruta
  return children;
}

export default PrivateRoute;
