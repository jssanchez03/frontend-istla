import { type ReactNode, useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  FileText,
  SquarePen,
  User,
  ChevronDown,
  ClipboardList,
  HouseIcon,
  MessageCircleQuestion,
  CircleUser,
  SquareCheckIcon,
  LucideFileDown,
  AlignJustify
} from "lucide-react";

interface Props {
  children: ReactNode;
}
const AdminLayout = ({ children }: Props) => {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    return sessionStorage.getItem("aos-initial-loaded") !== "true";
  });

  const handleLogout = () => {
    sessionStorage.removeItem("aos-initial-loaded");
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        sessionStorage.setItem("aos-initial-loaded", "true");
        setIsInitialLoad(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Manejar cambio de tamaño de ventana para sidebar
  useEffect(() => {
    const handleResize = () => {
      // En pantallas pequeñas, ocultar automáticamente el sidebar
      if (window.innerWidth < 1024) {
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Verificación inicial
    if (window.innerWidth < 1024) {
      setSidebarVisible(false);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para alternar el sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const isMobile = window.innerWidth < 1024;

  return (
    <div className="flex min-h-screen bg-[#f4f5f9] max-w-full overflow-x-hidden">
      {/* Overlay para cerrar sidebar en móvil (solo detrás del sidebar) */}
      {isMobile && sidebarVisible && (
        <div
          className="fixed inset-0 z-30 bg-gray-500/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarVisible(false)}
          style={{ left: 0, top: 0 }}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        className={`fixed left-0 top-0 w-64 h-screen bg-white shadow-sm flex flex-col z-40 transform transition-transform duration-500 ease-out ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-1 flex items-center justify-center" {...(isInitialLoad ? { 'data-aos': 'fade-down' } : {})}>
          <img
            src="https://eva.istla.edu.ec/pluginfile.php/1/core_admin/logocompact/300x300/1737821353/logo%20istla.png"
            alt="ISTLA Logo"
            className="h-16 w-auto"
          />
        </div>
        <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto">
          <SidebarLink to="/admin" exact icon={<HouseIcon className="w-5 h-5" />} label="Panel Principal" delay={100} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
          <SidebarLink to="/admin/respuestas" icon={<MessageCircleQuestion className="w-5 h-5" />} label="Respuestas" delay={150} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
          <SidebarLink to="/admin/coordinador" icon={<CircleUser className="w-5 h-5" />} label="Coordinador" delay={200} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
          <SidebarLink to="/admin/autoridades" icon={<SquareCheckIcon className="w-5 h-5" />} label="Evaluación" delay={250} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
          <SidebarLink to="/admin/reportes" icon={<LucideFileDown className="w-5 h-5" />} label="Reportes" delay={300} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
          <SidebarLink to="/admin/formularios" startsWith icon={<FileText className="w-5 h-5" />} label="Gestión de Formularios" delay={350} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
          <SidebarLink to="/admin/preguntas" startsWith icon={<SquarePen className="w-5 h-5" />} label="Gestión de Preguntas" delay={400} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
          <SidebarLink to="/admin/evaluaciones" startsWith icon={<ClipboardList className="w-5 h-5" />} label="Crear Evaluaciones" delay={450} isInitialLoad={isInitialLoad} currentPath={location.pathname} />
        </nav>
        {/* Usuario y cerrar sesión solo en móvil, abajo del sidebar */}
        <div className="block md:hidden mt-auto px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-500 flex items-center justify-center text-white">
              {!imgError ? (
                <img
                  src="https://www.pngarts.com/files/5/User-Avatar-Download-PNG-Image.png"
                  alt="Perfil"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-medium leading-none text-sm">{usuario?.nombre || "Administrador"}</p>
              <p className="text-gray-500 text-xs">{usuario?.rolTexto || "Administrador"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200 ease-out transform hover:scale-105"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-out ${sidebarVisible ? 'md:ml-64' : 'ml-0'}`}>
        <header
          className={`fixed top-0 right-0 bg-white shadow-sm px-4 md:px-6 py-3 flex justify-between items-center z-30 transition-all duration-500 ease-out ${sidebarVisible ? 'md:left-64' : 'left-0'}`}
          style={{ left: sidebarVisible && window.innerWidth >= 1024 ? '256px' : '0' }}
          {...(isInitialLoad ? { 'data-aos': 'fade-down' } : {})}
        >
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition duration-300 ease-out transform hover:scale-105"
              aria-label="Alternar menú lateral"
            >
              <AlignJustify className="h-6 w-6 text-gray-700" />
            </button>
            {/* Título corto en móvil, completo en md+ */}
            <h1 className="text-base font-semibold text-gray-800 truncate block md:hidden">Panel Administrador</h1>
            <h1 className="hidden md:block text-lg md:text-xl font-semibold text-gray-800 truncate">Panel del Administrador</h1>
          </div>
          {/* Menú usuario solo en md+ */}
          <div className="hidden md:flex items-center gap-2 md:gap-4 relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-all duration-300 ease-out transform hover:scale-105"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-500 flex items-center justify-center text-white transition-transform duration-300 hover:scale-110">
                {!imgError ? (
                  <img
                    src="https://www.pngarts.com/files/5/User-Avatar-Download-PNG-Image.png"
                    alt="Perfil"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="hidden md:block text-sm text-left">
                <p className="font-medium leading-none">{usuario?.nombre || "Administrador"}</p>
                <p className="text-gray-500 text-xs">{usuario?.rolTexto || "Administrador"}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ease-out ${menuOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 animate-in fade-in-0 zoom-in-95 duration-300">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200 ease-out transform hover:scale-105"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="pt-20 md:pt-24 px-3 md:px-6 lg:px-11 py-4 md:py-11 flex-1 w-full overflow-x-hidden" {...(isInitialLoad ? { 'data-aos': 'fade-up' } : {})}>
          {children}
        </main>

        <footer className="mt-auto py-4 px-3 md:px-6 text-center text-xs md:text-sm text-gray-500" {...(isInitialLoad ? { 'data-aos': 'fade-up' } : {})}>
          Instituto Superior Tecnológico "Los Andes" ISTLA - Sistema de Evaluación Integral Docente
          <br />© 2025 Todos los derechos reservados
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;

interface SidebarLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
  delay: number;
  isInitialLoad: boolean;
  currentPath: string;
  exact?: boolean;
  startsWith?: boolean;
}

const SidebarLink = ({ to, icon, label, delay, isInitialLoad, currentPath, exact = false, startsWith = false }: SidebarLinkProps) => {
  let isActive = false;

  if (exact) {
    isActive = currentPath === to;
  } else if (startsWith) {
    isActive = currentPath.startsWith(to);
  } else {
    isActive = currentPath === to;
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-md ${isActive
        ? "bg-[#189cbf] text-white font-medium scale-105"
        : "hover:bg-sky-100 text-gray-700"
        }`}
      {...(isInitialLoad ? { 'data-aos': 'fade-right', 'data-aos-delay': `${delay}` } : {})}
    >
      {icon}
      <span className="text-sm whitespace-nowrap">{label}</span>
    </Link>
  );
};
