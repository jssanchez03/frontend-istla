import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardDocente from "./pages/docente/DashboardDocente";
import DashboardEstudiante from "./pages/estudiante/DashboardEstudiante";
import AsignacionCoevaluaciones from "./pages/coordinador/AsignacionCoevaluaciones";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import EvaluacionFormulario from "./pages/estudiante/EvaluacionFormulario";
import ResumenEstudiante from "./pages/estudiante/ResumenEstudiante";
import ResumenDocente from "./pages/docente/ResumenDocente";
import EvaluacionesPendientes from "./pages/estudiante/EvaluacionesPendientes";
import Formularios from "./pages/admin/Formularios";
import Preguntas from "./pages/admin/Preguntas";
import Evaluaciones from "./pages/admin/Evaluaciones";
import AutoevaluacionesDocente from "./pages/docente/AutoevaluacionesDocente";
import CoevaluacionesDocente from "./pages/docente/CoevaluacionesDocente";
import AutoevaluacionFormulario from "./pages/docente/AutoevaluacionFormulario";
import CoevaluacionFormulario from "./pages/docente/CoevaluacionFormulario";
import ReporteCoevaluacion from "./pages/coordinador/ReporteCoevaluacion";
import Respuestas from "./pages/admin/Respuestas";
import Coordinador from "./pages/admin/Coordinador";
import EvaluacionAutoridades from "./pages/admin/EvaluacionAutoridades";
import Reportes from "./pages/admin/Reportes";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

// Componente para página de acceso denegado
const AccessDenied = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    // Inicializar AOS una sola vez
    AOS.init({
      duration: 500,
      easing: "ease-in-out",
      once: true,
      offset: 50,
    });
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* RUTAS ADMIN */}
          <Route
            path="/admin/formularios"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <Formularios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/preguntas"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <Preguntas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/evaluaciones"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <Evaluaciones />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/respuestas"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <Respuestas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/coordinador"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <Coordinador />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/autoridades"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <EvaluacionAutoridades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reportes"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <Reportes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute rolesPermitidos={[12, 18]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          {/* RUTAS DOCENTE */}
          <Route
            path="/docente/autoevaluacion"
            element={
              <ProtectedRoute rolesPermitidos={[13, 15]}>
                <AutoevaluacionesDocente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docente/coevaluacion"
            element={
              <ProtectedRoute rolesPermitidos={[13, 15]}>
                <CoevaluacionesDocente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docente/resumen"
            element={
              <ProtectedRoute rolesPermitidos={[13, 15]}>
                <ResumenDocente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docente"
            element={
              <ProtectedRoute rolesPermitidos={[13, 15]}>
                <DashboardDocente />
              </ProtectedRoute>
            }
          />

          {/* RUTAS ESTUDIANTE */}
          <Route
            path="/estudiante/resumen"
            element={
              <ProtectedRoute rolesPermitidos={[14]}>
                <ResumenEstudiante />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudiante/heteroevaluacion"
            element={
              <ProtectedRoute rolesPermitidos={[14]}>
                <EvaluacionesPendientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudiante"
            element={
              <ProtectedRoute rolesPermitidos={[14]}>
                <DashboardEstudiante />
              </ProtectedRoute>
            }
          />

          {/* RUTAS COORDINADOR */}
          <Route
            path="/coordinador"
            element={
              <ProtectedRoute rolesPermitidos={[1, 17]}>
                <AsignacionCoevaluaciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinador/reporte-coevaluaciones"
            element={
              <ProtectedRoute rolesPermitidos={[1, 17]}>
                <ReporteCoevaluacion />
              </ProtectedRoute>
            }
          />

          {/* RUTAS DE EVALUACIONES */}
          <Route
            path="/evaluaciones/auto/:id"
            element={
              <ProtectedRoute rolesPermitidos={[13, 15]}>
                <AutoevaluacionFormulario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluaciones/co/:id"
            element={
              <ProtectedRoute rolesPermitidos={[13, 15]}>
                <CoevaluacionFormulario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluaciones/hetero/:id"
            element={
              <ProtectedRoute rolesPermitidos={[14]}>
                <EvaluacionFormulario />
              </ProtectedRoute>
            }
          />

          {/* RUTA DE ERROR */}
          <Route path="/no-autorizado" element={<AccessDenied />} />

          {/* Ruta catch-all para páginas no encontradas */}
          <Route path="*" element={<AccessDenied />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;