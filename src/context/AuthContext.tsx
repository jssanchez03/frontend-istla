import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

interface Usuario {
  id: number;
  correo: string;
  cedula: string;
  rol: number;
  nombre?: string;
  rolTexto?: string;
}

interface JWTPayload extends Usuario {
  iat: number;
  exp?: number;
}

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { },
  logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const convertirRol = useCallback((rol: number): string => {
    const roles: { [key: number]: string } = {
      14: "Estudiante",
      13: "Docente",
      12: "Administrador",
      18: "Vicerrector",
      15: "Docente",
      1: "Coordinador",
      17: "Coordinador Académico"
    };
    return roles[rol] || "Desconocido";
  }, []);

  const obtenerPerfil = useCallback(async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token");

      const res = await fetch(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/perfil/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al obtener perfil");

      const data = await res.json();
      const rolTexto = convertirRol(data.perfil_id);

      return { nombre: data.nombre, rolTexto };
    } catch (error) {
      return null;
    }
  }, [convertirRol]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUsuario(null);
    setIsInitialized(true);
  }, []);

  const login = useCallback(async (token: string): Promise<void> => {
    try {
      setIsLoading(true);
      localStorage.setItem("token", token);
      const decoded = jwtDecode<JWTPayload>(token);

      // Verificar si el token no ha expirado
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        logout();
        return;
      }

      const perfil = await obtenerPerfil(decoded.id);
      const usuarioCompleto = {
        id: decoded.id,
        correo: decoded.correo,
        cedula: decoded.cedula,
        rol: decoded.rol,
        nombre: perfil?.nombre,
        rolTexto: perfil?.rolTexto
      };

      setUsuario(usuarioCompleto);
      setIsInitialized(true);
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [obtenerPerfil, logout]);

  useEffect(() => {
    // Prevenir múltiples inicializaciones
    if (isInitialized) return;

    const initializeAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        const decoded = jwtDecode<JWTPayload>(token);

        // Verificar si el token no ha expirado
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          logout();
          return;
        }

        const perfil = await obtenerPerfil(decoded.id);
        const usuarioCompleto = {
          id: decoded.id,
          correo: decoded.correo,
          cedula: decoded.cedula,
          rol: decoded.rol,
          nombre: perfil?.nombre,
          rolTexto: perfil?.rolTexto,
        };

        setUsuario(usuarioCompleto);
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isInitialized, obtenerPerfil, logout]);

  const contextValue = {
    usuario,
    isAuthenticated: !!usuario,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};