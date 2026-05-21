import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthLayout from "./layouts/AuthLayout";
import RutaProtegida from "./layouts/RutaProtegida";

import Login from "./page/Login";
import Registrar from "./page/Registrar";
import OlvidePassword from "./page/OlvidePassword";
import NuevoPassword from "./page/NuevoPassword";
import ConfirmarCuenta from "./page/ConfirmarCuenta";
import Proyectos from "./page/Proyectos";
import NuevoProyecto from "./page/NuevoProyecto";
import Proyecto from "./page/Proyecto";
import EditarProyecto from "./page/EditarProyecto";
import MisTareas from "./page/MisTareas";
import AdminUsuarios from "./page/AdminUsuarios";
import Reportes from "./page/Reportes";
import ReportesProyecto from "./page/ReportesProyecto";
import ReportesUsuario from "./page/ReportesUsuario";
import ReportesGuardados from "./page/ReportesGuardados";
import ReportBuilder from "./page/ReportBuilder";
import ReportesProgramados from "./page/ReportesProgramados";

import { AuthProvider } from "./context/AuthProvider";
import { ProyectosProvider } from "./context/ProyectosProvider";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProyectosProvider>
          <Routes>
            <Route path="/" element={<AuthLayout />}>
              <Route index element={<Login />} />
              <Route path="registrar" element={<Registrar />} />
              <Route path="olvide-password" element={<OlvidePassword />} />
              <Route
                path="olvide-password/:token"
                element={<NuevoPassword />}
              />
              <Route path="confirmar/:id" element={<ConfirmarCuenta />} />
            </Route>

            <Route path="/proyectos" element={<RutaProtegida />}>
              <Route index element={<Proyectos />} />
              <Route path="mis-tareas" element={<MisTareas />} />
              <Route path="crear-proyecto" element={<NuevoProyecto />} />
              <Route path=":id" element={<Proyecto />} />
              <Route path="editar/:id" element={<EditarProyecto />} />
              <Route path="admin-usuarios" element={<AdminUsuarios />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="reportes/proyecto/:id" element={<ReportesProyecto />} />
              <Route path="reportes/usuario/:id" element={<ReportesUsuario />} />
              <Route path="reportes/guardados" element={<ReportesGuardados />} />
              <Route path="reportes/builder" element={<ReportBuilder />} />
              <Route path="reportes/builder/:id" element={<ReportBuilder />} />
              <Route path="reportes/programados" element={<ReportesProgramados />} />
            </Route>
          </Routes>
        </ProyectosProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
