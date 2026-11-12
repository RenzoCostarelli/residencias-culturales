import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ETIQUETA_ROL } from "../../lib/etiquetas";
import type { Rol } from "../../types";

const MIS_EVALUACIONES = { to: "/evaluador", label: "Mis evaluaciones" };

// Cualquier rol puede ser evaluador, así que "Mis evaluaciones" aparece para todos.
const NAV_POR_ROL: Record<Rol, { to: string; label: string }[]> = {
  SUPERADMIN: [
    { to: "/superadmin/usuarios", label: "Usuarios" },
    { to: "/superadmin/grupos", label: "Grupos" },
    { to: "/superadmin/rubrica", label: "Rúbrica" },
    { to: "/superadmin/importaciones", label: "Importar Excel" },
    MIS_EVALUACIONES,
  ],
  ADMIN_GRUPO: [{ to: "/admin-grupo", label: "Mi grupo" }, MIS_EVALUACIONES],
  EVALUADOR: [MIS_EVALUACIONES],
};

export function AppShell() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  if (!usuario) return null;
  const items = NAV_POR_ROL[usuario.rol];
  const mostrarAvisoPassword = usuario.debeCambiarPassword && location.pathname !== "/cambiar-password";

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 flex-none flex-col border-r border-border bg-surface px-4 py-6">
        <div className="mb-8 px-2">
          <p className="text-sm font-semibold text-text">Residencias</p>
          <p className="text-xs text-text-muted">Selección y evaluación</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-4">
          <p className="px-2 text-sm font-medium text-text">
            {usuario.nombre} {usuario.apellido}
          </p>
          <p className="px-2 text-xs text-text-muted">{ETIQUETA_ROL[usuario.rol]}</p>
          <Link
            to="/cambiar-password"
            className="mt-2 block w-full rounded-md px-3 py-2 text-left text-sm text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
          >
            Cambiar contraseña
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-bg px-8 py-8">
        {mostrarAvisoPassword && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-text"
          >
            <span>
              Tu contraseña es temporal (la generó el sistema). Te recomendamos cambiarla ahora por una propia.
            </span>
            <Link
              to="/cambiar-password"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-hover"
            >
              Cambiar contraseña
            </Link>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
