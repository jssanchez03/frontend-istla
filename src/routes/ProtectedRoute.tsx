import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { JSX, memo } from "react";

interface Props {
  children: JSX.Element;
  rolesPermitidos: number[];
}

const ProtectedRoute = memo(({ children, rolesPermitidos }: Props) => {
  const { usuario, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se inicializa la autenticación
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Verificando autenticación...</span>
        </div>
      </div>
    );
  }

  // Redirigir a login si no hay usuario autenticado
  if (!usuario) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Verificar permisos de rol
  if (!rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;