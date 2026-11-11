import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PantallaCarga } from "../components/ui/Feedback";
import type { Rol } from "../types";

export function RequireAuth({ roles }: { roles?: Rol[] }) {
  const { usuario, token, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <PantallaCarga />;
  }
  if (!token || !usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function HomeRedirect() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  switch (usuario.rol) {
    case "SUPERADMIN":
      return <Navigate to="/superadmin/usuarios" replace />;
    case "ADMIN_GRUPO":
      return <Navigate to="/admin-grupo" replace />;
    case "EVALUADOR":
      return <Navigate to="/evaluador" replace />;
  }
}
