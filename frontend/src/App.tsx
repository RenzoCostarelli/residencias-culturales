import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { HomeRedirect, RequireAuth } from "./routes/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { CambiarPasswordPage } from "./pages/CambiarPasswordPage";
import { UsuariosPage } from "./pages/superadmin/UsuariosPage";
import { RubricaPage } from "./pages/superadmin/RubricaPage";
import { ImportacionesPage } from "./pages/superadmin/ImportacionesPage";
import { ZonasPage } from "./pages/grupo/ZonasPage";
import { GrupoDetailPage } from "./pages/grupo/GrupoDetailPage";
import { AsignadosPage } from "./pages/evaluador/AsignadosPage";
import { PreseleccionAsignadosPage } from "./pages/evaluador/PreseleccionAsignadosPage";
import { PreseleccionPage } from "./pages/evaluador/PreseleccionPage";
import { EvaluacionFormPage } from "./pages/evaluador/EvaluacionFormPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<HomeRedirect />} />
            <Route path="cambiar-password" element={<CambiarPasswordPage />} />

            {/* Cualquier rol puede integrar un par de evaluadores. */}
            <Route path="preseleccion" element={<PreseleccionAsignadosPage />} />
            <Route path="evaluador" element={<AsignadosPage />} />
            <Route path="evaluador/inscriptos/:inscriptoId/preseleccion" element={<PreseleccionPage />} />
            <Route path="evaluador/inscriptos/:inscriptoId" element={<EvaluacionFormPage />} />

            <Route element={<RequireAuth roles={["SUPERADMIN"]} />}>
              <Route path="superadmin/usuarios" element={<UsuariosPage />} />
              <Route path="superadmin/rubrica" element={<RubricaPage />} />
              <Route path="superadmin/importaciones" element={<ImportacionesPage />} />
            </Route>

            <Route element={<RequireAuth roles={["SUPERADMIN", "ADMIN_GRUPO"]} />}>
              <Route path="grupos" element={<ZonasPage />} />
              <Route path="grupos/:grupoId" element={<GrupoDetailPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
