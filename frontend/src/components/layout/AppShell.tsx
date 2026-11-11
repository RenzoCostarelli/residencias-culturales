import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Rol } from "../../types";

const NAV_POR_ROL: Record<Rol, { to: string; label: string }[]> = {
  SUPERADMIN: [
    { to: "/superadmin/usuarios", label: "Usuarios" },
    { to: "/superadmin/grupos", label: "Grupos" },
    { to: "/superadmin/rubrica", label: "Rúbrica" },
    { to: "/superadmin/importaciones", label: "Importar Excel" },
  ],
  ADMIN_GRUPO: [{ to: "/admin-grupo", label: "Mi grupo" }],
  EVALUADOR: [{ to: "/evaluador", label: "Mis evaluaciones" }],
};

const NOMBRE_ROL: Record<Rol, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN_GRUPO: "Admin de grupo",
  EVALUADOR: "Evaluador",
};

export function AppShell() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;
  const items = NAV_POR_ROL[usuario.rol];

  return (
    <div className="flex min-h-screen">
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
          <p className="px-2 text-xs text-text-muted">{NOMBRE_ROL[usuario.rol]}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-bg px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
