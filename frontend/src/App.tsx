import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { HomeRedirect, RequireAuth } from "./routes/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { UsuariosPage } from "./pages/superadmin/UsuariosPage";
import { GruposPage } from "./pages/superadmin/GruposPage";
import { RubricaPage } from "./pages/superadmin/RubricaPage";
import { ImportacionesPage } from "./pages/superadmin/ImportacionesPage";
import { MisGruposPage } from "./pages/admin-grupo/MisGruposPage";
import { GrupoDetailPage } from "./pages/grupo/GrupoDetailPage";
import { AsignadosPage } from "./pages/evaluador/AsignadosPage";
import { EvaluacionFormPage } from "./pages/evaluador/EvaluacionFormPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<HomeRedirect />} />

            <Route element={<RequireAuth roles={["SUPERADMIN"]} />}>
              <Route path="superadmin/usuarios" element={<UsuariosPage />} />
              <Route path="superadmin/grupos" element={<GruposPage />} />
              <Route path="superadmin/rubrica" element={<RubricaPage />} />
              <Route path="superadmin/importaciones" element={<ImportacionesPage />} />
            </Route>

            <Route element={<RequireAuth roles={["ADMIN_GRUPO"]} />}>
              <Route path="admin-grupo" element={<MisGruposPage />} />
            </Route>

            <Route element={<RequireAuth roles={["SUPERADMIN", "ADMIN_GRUPO"]} />}>
              <Route path="grupos/:grupoId" element={<GrupoDetailPage />} />
            </Route>

            <Route element={<RequireAuth roles={["EVALUADOR"]} />}>
              <Route path="evaluador" element={<AsignadosPage />} />
              <Route path="evaluador/inscriptos/:inscriptoId" element={<EvaluacionFormPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
