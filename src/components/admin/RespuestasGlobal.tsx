import { useEffect, useState } from "react";
import { obtenerRespuestasPorTipoYDocente, obtenerEstadisticasPorTipoPregunta } from "../../services/dashboardService";
import { obtenerPeriodos } from "../../services/evaluacionesService";
import { MessageSquare, ChevronDown, User, BookOpen, Brain, Target, Eye, EyeOff, Search, Info, X, Filter } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { capitalizarNombreCompleto } from '../../lib/utils';

interface Periodo {
    id_periodo: number;
    descripcion: string;
}

interface EstadisticaTipoPregunta {
    tipo_pregunta: string;
    total_respuestas: number;
    docentes_evaluados: number;
    evaluadores_participantes: number;
    total_preguntas: number;
}

interface Respuesta {
    id_respuesta: number;
    pregunta: string;
    respuesta: string;
    evaluador: string;
    formulario: string;
    tipo_evaluacion: string;
}

interface DocenteRespuestas {
    docente: string;
    asignatura: string | null;
    respuestas: Respuesta[];
}

interface RespuestasPorTipo {
    actitudinal: DocenteRespuestas[];
    conceptual: DocenteRespuestas[];
    procedimental: DocenteRespuestas[];
}

type TipoSeccion = 'actitudinal' | 'conceptual' | 'procedimental';

const RespuestasGlobal = () => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | "">("");
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [estadisticas, setEstadisticas] = useState<EstadisticaTipoPregunta[]>([]);
    const [respuestas, setRespuestas] = useState<RespuestasPorTipo | null>(null);
    const [seccionActiva, setSeccionActiva] = useState<TipoSeccion>('actitudinal');
    const [cargando, setCargando] = useState(false);
    const [docentesExpandidos, setDocentesExpandidos] = useState<Set<string>>(new Set());
    const [busqueda, setBusqueda] = useState("");
    const [mostrarInfo, setMostrarInfo] = useState(false);
    // Estado para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const elementosPorPagina = 10;

    useEffect(() => {
        AOS.init({ duration: 700, once: true });
        cargarPeriodos();
    }, []);

    useEffect(() => {
        if (periodoSeleccionado !== "") {
            cargarDatos(periodoSeleccionado);
        }
    }, [periodoSeleccionado]);

    // Al cambiar búsqueda o sección, resetear página
    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, seccionActiva]);

    const cargarPeriodos = async () => {
        try {
            const data = await obtenerPeriodos();
            setPeriodos(data);
            if (data.length > 0 && periodoSeleccionado === "") {
                setPeriodoSeleccionado(data[0].id_periodo);
            }
        } catch (error) {
            console.error("Error al cargar períodos:", error);
        }
    };

    const cargarDatos = async (periodo: number) => {
        try {
            setCargando(true);
            const [estadisticasData, respuestasData] = await Promise.all([
                obtenerEstadisticasPorTipoPregunta(periodo),
                obtenerRespuestasPorTipoYDocente(periodo)
            ]);

            setEstadisticas(estadisticasData);
            setRespuestas(respuestasData);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setCargando(false);
        }
    };

    const handlePeriodoChange = (periodo: Periodo) => {
        setPeriodoSeleccionado(periodo.id_periodo);
        setIsSelectOpen(false);
    };

    const toggleDocenteExpandido = (nombreDocente: string) => {
        const nuevosExpandidos = new Set(docentesExpandidos);
        if (nuevosExpandidos.has(nombreDocente)) {
            nuevosExpandidos.delete(nombreDocente);
        } else {
            nuevosExpandidos.add(nombreDocente);
        }
        setDocentesExpandidos(nuevosExpandidos);
    };

    const getTipoInfo = (tipo: TipoSeccion) => {
        const configs = {
            actitudinal: {
                titulo: 'Evaluación Actitudinal',
                descripcion: 'Aspectos relacionados con valores, actitudes y disposiciones',
                icono: <Brain className="w-4 h-4" />,
                color: 'bg-[#189cbf]',
                bgLight: 'bg-[#189cbf]/5',
                textColor: 'text-[#189cbf]',
                shadowColor: 'shadow-[#189cbf]/20'
            },
            conceptual: {
                titulo: 'Evaluación Conceptual',
                descripcion: 'Conocimientos teóricos y comprensión de conceptos',
                icono: <BookOpen className="w-4 h-4" />,
                color: 'bg-[#81bf20]',
                bgLight: 'bg-[#81bf20]/5',
                textColor: 'text-[#81bf20]',
                shadowColor: 'shadow-[#81bf20]/20'
            },
            procedimental: {
                titulo: 'Evaluación Procedimental',
                descripcion: 'Habilidades prácticas y aplicación de procedimientos',
                icono: <Target className="w-4 h-4" />,
                color: 'bg-[#930f4b]',
                bgLight: 'bg-[#930f4b]/5',
                textColor: 'text-[#930f4b]',
                shadowColor: 'shadow-[#930f4b]/20'
            }
        };
        return configs[tipo];
    };

    const filtrarRespuestas = (docentesData: DocenteRespuestas[]) => {
        if (!busqueda.trim()) return docentesData;

        return docentesData.filter(docente =>
            docente.docente.toLowerCase().includes(busqueda.toLowerCase()) ||
            (docente.asignatura && docente.asignatura.toLowerCase().includes(busqueda.toLowerCase())) ||
            docente.respuestas.some(respuesta =>
                respuesta.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
                respuesta.respuesta.toLowerCase().includes(busqueda.toLowerCase()) ||
                respuesta.evaluador.toLowerCase().includes(busqueda.toLowerCase())
            )
        );
    };

    const renderEstadisticas = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-4 md:px-0">
            {estadisticas.map((estadistica, index) => {
                const tipoInfo = getTipoInfo(estadistica.tipo_pregunta as TipoSeccion);
                return (
                    <div
                        key={estadistica.tipo_pregunta}
                        className={`p-3 md:p-4 rounded-xl ${tipoInfo.bgLight} hover:shadow-md transition-all duration-500 ease-out transform hover:-translate-y-0.5 ${tipoInfo.shadowColor} shadow-sm`}
                        data-aos="fade-up"
                        data-aos-delay={index * 100}
                    >
                        {/* Header mobile compacto */}
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className={`p-1.5 md:p-2 rounded-lg ${tipoInfo.color} text-white shadow-sm`}>
                                {tipoInfo.icono}
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${tipoInfo.bgLight} ${tipoInfo.textColor} border border-current/20`}>
                                {estadistica.tipo_pregunta}
                            </span>
                        </div>

                        {/* Título */}
                        <h3 className={`font-medium text-xs md:text-sm ${tipoInfo.textColor} mb-2 md:mb-3`}>
                            {tipoInfo.titulo}
                        </h3>

                        {/* Estadísticas - Layout diferente para móvil */}
                        <div className="space-y-1 md:space-y-2">
                            {/* Para móvil: layout más compacto */}
                            <div className="block md:hidden">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-gray-600">Respuestas:</span>
                                        <span className="font-semibold text-gray-800">{estadistica.total_respuestas}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-600">Docentes:</span>
                                        <span className="font-semibold text-gray-800">{estadistica.docentes_evaluados}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-600">Evaluadores:</span>
                                        <span className="font-semibold text-gray-800">{estadistica.evaluadores_participantes}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-600">Preguntas:</span>
                                        <span className="font-semibold text-gray-800">{estadistica.total_preguntas}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Para desktop: layout original */}
                            <div className="hidden md:block space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Total Respuestas:</span>
                                    <span className="font-medium text-sm text-gray-800">{estadistica.total_respuestas}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Docentes:</span>
                                    <span className="font-medium text-sm text-gray-800">{estadistica.docentes_evaluados}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Evaluadores:</span>
                                    <span className="font-medium text-sm text-gray-800">{estadistica.evaluadores_participantes}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Preguntas:</span>
                                    <span className="font-medium text-sm text-gray-800">{estadistica.total_preguntas}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderRespuestas = () => {
        if (!respuestas || cargando) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#189cbf]"></div>
                    <span className="ml-3 text-gray-600">Cargando respuestas...</span>
                </div>
            );
        }

        const docentesData = respuestas[seccionActiva] || [];
        const docentesFiltrados = filtrarRespuestas(docentesData);
        const tipoInfoActivo = getTipoInfo(seccionActiva);

        // Paginación
        const totalPaginas = Math.ceil(docentesFiltrados.length / elementosPorPagina);
        const indiceInicio = (paginaActual - 1) * elementosPorPagina;
        const indiceFin = indiceInicio + elementosPorPagina;
        const docentesPaginados = docentesFiltrados.slice(indiceInicio, indiceFin);

        if (docentesFiltrados.length === 0) {
            return (
                <div className="text-center py-12 px-4">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">
                        {busqueda ? "No se encontraron resultados para tu búsqueda" : "No hay respuestas disponibles para este tipo"}
                    </p>
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda("")}
                            className="mt-2 text-[#189cbf] hover:text-[#189cbf] text-sm"
                        >
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            );
        }

        return (
            <>
                <div className="space-y-4 px-4 md:px-0">
                    {docentesPaginados.map((docente, index) => {
                        const isExpanded = docentesExpandidos.has(docente.docente);
                        return (
                            <div
                                key={`${docente.docente}-${index}`}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-500 ease-out transform hover:-translate-y-0.5 overflow-hidden"
                                data-aos="fade-up"
                                data-aos-delay={index * 50}
                            >
                                <div
                                    className="p-3 md:p-4 cursor-pointer"
                                    onClick={() => toggleDocenteExpandido(docente.docente)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
                                        <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                                            <div className={`p-1.5 md:p-2 ${tipoInfoActivo.color} rounded-lg shadow-sm flex-shrink-0`}>
                                                <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1 flex flex-col">
                                                <h3 className="font-medium text-xs md:text-sm text-gray-800 truncate text-left">{capitalizarNombreCompleto(docente.docente)}</h3>
                                                {docente.asignatura && (
                                                    <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 truncate text-left">{docente.asignatura}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-row items-center gap-2 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full w-fit md:w-auto text-left md:text-right block md:inline">
                                                {docente.respuestas.length} respuestas
                                            </span>
                                            <div className="p-1.5 bg-gray-100 rounded-md">
                                                {isExpanded ? (
                                                    <EyeOff className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                                                ) : (
                                                    <Eye className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-50/50">
                                        <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                                            {docente.respuestas.map((respuesta) => (
                                                <div
                                                    key={respuesta.id_respuesta}
                                                    className="bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-500 ease-out transform hover:-translate-y-0.5"
                                                >
                                                    <div className="flex items-start justify-between mb-2 md:mb-3">
                                                        <div className="flex-1 pr-2">
                                                            <h4 className="font-medium text-xs md:text-sm text-gray-800 mb-2">
                                                                {respuesta.pregunta}
                                                            </h4>
                                                            <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                                                                {respuesta.respuesta}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-2 md:pt-3 border-t border-gray-100 space-y-2 md:space-y-0">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500">Evaluador:</span>
                                                            <span className="text-xs font-medium text-gray-700 truncate">
                                                                {capitalizarNombreCompleto(respuesta.evaluador)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-end">
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${respuesta.tipo_evaluacion === 'Autoevaluación'
                                                                ? 'bg-[#189cbf]/10 text-[#189cbf]'
                                                                : respuesta.tipo_evaluacion === 'Heteroevaluación'
                                                                    ? 'bg-[#930f4b]/10 text-[#930f4b]'
                                                                    : 'bg-[#81bf20]/10 text-[#81bf20]'
                                                                }`}>
                                                                {respuesta.tipo_evaluacion}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* Controles de paginación */}
                {totalPaginas > 1 && (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 pt-4 border-t border-gray-200 space-y-3 md:space-y-0 px-4 md:px-0">
                        <div className="text-sm text-gray-600 text-center md:text-left">
                            Página {paginaActual} de {totalPaginas}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                disabled={paginaActual === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                                    .filter(num => {
                                        return num === 1 ||
                                            num === totalPaginas ||
                                            (num >= paginaActual - 2 && num <= paginaActual + 2);
                                    })
                                    .map((num, index, array) => (
                                        <div key={num} className="flex items-center">
                                            {index > 0 && array[index - 1] !== num - 1 && (
                                                <span className="px-2 text-gray-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setPaginaActual(num)}
                                                className={`px-3 py-1 text-sm border rounded ${paginaActual === num
                                                    ? 'bg-[#189cbf] text-white border-[#189cbf]'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>
                            <button
                                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                disabled={paginaActual === totalPaginas}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="py-5 px-4 md:px-0">
            {/* Header */}
            <div className="flex items-center mb-6" data-aos="fade-up">
                <h1 className="text-lg md:text-xl text-gray-800 font-medium">Respuestas Generales</h1>
            </div>

            {/* Container principal */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden" data-aos="fade-up" data-aos-delay="100">
                {/* Header con selector de período */}
                <div className="bg-[#189cbf] text-white p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center">
                            <MessageSquare className="h-5 w-5 md:h-6 md:w-6 mr-3 flex-shrink-0" />
                            <div>
                                <h2 className="text-lg md:text-xl font-medium">
                                    Análisis de Respuestas por Tipo de Evaluación
                                </h2>
                                <p className="text-white/90 text-xs md:text-sm mt-1">
                                    Visualización detallada de todas las respuestas organizadas por categorías
                                </p>
                            </div>
                        </div>

                        {/* Selector de período */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSelectOpen(!isSelectOpen)}
                                className="flex items-center bg-white/10 hover:bg-white/20 text-white px-3 md:px-4 py-2 rounded-lg border border-white/20 w-full md:min-w-[200px] justify-between transition-colors"
                            >
                                <span className="text-xs md:text-sm truncate">
                                    {periodoSeleccionado ?
                                        periodos.find(p => p.id_periodo === periodoSeleccionado)?.descripcion || "Seleccionar período"
                                        : "Seleccionar período"
                                    }
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ml-2 ${isSelectOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSelectOpen && (
                                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 w-full md:min-w-[200px] z-50">
                                    <div className="py-1">
                                        {periodos.map((periodo) => (
                                            <button
                                                key={periodo.id_periodo}
                                                onClick={() => handlePeriodoChange(periodo)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${periodo.id_periodo === periodoSeleccionado
                                                    ? 'bg-[#189cbf]/10 text-[#189cbf]'
                                                    : 'text-gray-700'
                                                    }`}
                                            >
                                                {periodo.descripcion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-3 md:p-6">
                    {/* Estadísticas */}
                    {renderEstadisticas()}

                    {/* Navegación por tipos */}
                    <div className="flex justify-center mb-6 px-4 md:px-0">
                        <div className="bg-gray-100 rounded-2xl p-1 md:p-2 w-full md:w-auto overflow-x-auto">
                            <nav className="flex space-x-1">
                                {(['actitudinal', 'conceptual', 'procedimental'] as TipoSeccion[]).map((tipo) => {
                                    const tipoInfo = getTipoInfo(tipo);
                                    return (
                                        <button
                                            key={tipo}
                                            onClick={() => setSeccionActiva(tipo)}
                                            className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${seccionActiva === tipo
                                                ? `${tipoInfo.color} text-white shadow-sm`
                                                : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                                                }`}
                                        >
                                            {tipoInfo.icono}
                                            <span className="hidden sm:inline">{tipoInfo.titulo}</span>
                                            <span className="sm:hidden">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Barra de búsqueda con botón de información */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4 px-4 md:px-0">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por docente, asignatura, pregunta o respuesta..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#189cbf] focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setMostrarInfo(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                            title="Información sobre respuestas"
                        >
                            <Info className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-sm font-medium">Información</span>
                        </button>
                    </div>

                    {/* Respuestas */}
                    <div className="animate-fade-in">
                        {renderRespuestas()}
                    </div>
                </div>
            </div>

            {/* Modal de información */}
            {mostrarInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm"
                        aria-hidden="true"
                        data-aos="fade"
                        data-aos-duration="200"
                        onClick={() => setMostrarInfo(false)}
                    />
                    <div
                        className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        data-aos="zoom-in"
                        data-aos-duration="300"
                    >
                        <div className="p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MessageSquare className="w-6 h-6 text-[#189cbf]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Información sobre Respuestas Globales
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setMostrarInfo(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Esta sección te permite visualizar y analizar todas las respuestas de las evaluaciones realizadas.
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <Brain className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">Evaluación Actitudinal</h4>
                                            <p className="text-blue-800 text-sm">
                                                Respuestas relacionadas con valores, actitudes y disposiciones del docente hacia la enseñanza, los estudiantes y la institución.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <BookOpen className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 mb-1">Evaluación Conceptual</h4>
                                            <p className="text-green-800 text-sm">
                                                Respuestas sobre el dominio de conocimientos teóricos, comprensión de conceptos y manejo de la materia por parte del docente.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <Target className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900 mb-1">Evaluación Procedimental</h4>
                                            <p className="text-purple-800 text-sm">
                                                Respuestas sobre las habilidades prácticas, metodologías de enseñanza y aplicación de procedimientos didácticos.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                    <div className="flex items-start gap-3">
                                        <Filter className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900 mb-2">Funcionalidades disponibles:</h4>
                                            <ul className="text-sm text-amber-800 space-y-1">
                                                <li>• <strong>Filtrado por periodo:</strong> Selecciona el periodo académico específico</li>
                                                <li>• <strong>Navegación por tipos:</strong> Cambia entre evaluaciones actitudinales, conceptuales y procedimentales</li>
                                                <li>• <strong>Búsqueda avanzada:</strong> Busca por nombre del docente, asignatura, pregunta o contenido de respuesta</li>
                                                <li>• <strong>Vista expandible:</strong> Haz clic en cualquier docente para ver todas sus respuestas detalladas</li>
                                                <li>• <strong>Identificación de evaluadores:</strong> Cada respuesta muestra quién la proporcionó</li>
                                                <li>• <strong>Tipos de evaluación:</strong> Distingue entre autoevaluación, heteroevaluación y coevaluación</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Eye className="w-6 h-6 text-gray-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Cómo interpretar los datos:</h4>
                                            <ul className="text-sm text-gray-600 space-y-1">
                                                <li>• Las estadísticas muestran el total de respuestas, docentes evaluados y evaluadores participantes</li>
                                                <li>• Cada tarjeta de docente indica el número de respuestas recibidas</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setMostrarInfo(false)}
                                    className="px-4 py-2 bg-[#189cbf] text-white rounded-lg hover:bg-[#0f7c9c] transition-colors font-medium"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estilos CSS */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out; }
            `}</style>
        </div>
    );
};

export default RespuestasGlobal;