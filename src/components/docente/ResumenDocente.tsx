import { useEffect, useState } from "react";
import { ArrowLeft, CircleHelp, ChevronDown, CheckCircle2, AlertCircle, Eye, X, Info } from 'lucide-react';
import AOS from "aos";
import { obtenerPeriodos, obtenerResumenEvaluaciones } from "../../services/evaluacionesService";
import { capitalizarNombreCompleto } from '../../lib/utils';

interface Periodo {
    id_periodo: number;
    descripcion: string;
}

interface EvaluacionDocente {
    id: number;
    evaluado: string;
    asignatura: string;
    tipoEvaluacion: string;
    estado: "Pendiente" | "Completado";
    fecha: string;
    calificacion?: number;
}

const ResumenDocente = () => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [periodo, setPeriodo] = useState<number | null>(null);
    const [evaluaciones, setEvaluaciones] = useState<EvaluacionDocente[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [evaluacionDetalle, setEvaluacionDetalle] = useState<EvaluacionDocente | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [mostrarInfo, setMostrarInfo] = useState(false);

    useEffect(() => {
        AOS.init({
            duration: 600,
            once: true,
            easing: 'ease-out'
        });

        const cargarPeriodos = async () => {
            try {
                const data = await obtenerPeriodos();
                setPeriodos(data);
                if (data.length > 0) setPeriodo(data[0].id_periodo);
            } catch (error) {
                console.error("Error al obtener los periodos", error);
            }
        };

        cargarPeriodos();
    }, []);

    useEffect(() => {
        const cargarEvaluaciones = async () => {
            if (periodo === null) return;
            try {
                const data = await obtenerResumenEvaluaciones(periodo);
                const mapeadas: EvaluacionDocente[] = data.map((ev: any) => ({
                    id: ev.id_evaluacion,
                    evaluado: ev.nombres_docente,
                    asignatura: ev.nombre_asignatura,
                    tipoEvaluacion: ev.tipo_evaluacion || 'Evaluación',
                    estado: ev.calificacion ? "Completado" : "Pendiente",
                    fecha: new Date(ev.fecha_inicio).toLocaleDateString("es-EC", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    }),
                    calificacion: ev.calificacion ? Number(ev.calificacion) : undefined,
                }));

                setEvaluaciones(mapeadas);
            } catch (error) {
                console.error("Error al obtener evaluaciones del docente", error);
            }
        };

        cargarEvaluaciones();
    }, [periodo]);

    const completadas = evaluaciones.filter(ev => ev.estado === "Completado").length;
    const pendientes = evaluaciones.filter(ev => ev.estado === "Pendiente").length;
    const progreso = evaluaciones.length > 0 ? Math.round((completadas / evaluaciones.length) * 100) : 0;

    const promedio = completadas > 0
        ? Math.round(
            evaluaciones
                .filter(ev => ev.calificacion !== undefined)
                .reduce((acc, ev) => acc + (ev.calificacion ?? 0), 0) / completadas
        )
        : 0;

    const evaluacionesFiltradas = evaluaciones.filter(ev =>
        ev.evaluado?.toLowerCase().includes(busqueda.toLowerCase()) ||
        ev.asignatura?.toLowerCase().includes(busqueda.toLowerCase()) ||
        ev.tipoEvaluacion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleBack = () => window.history.back();

    const handleVerDetalle = (evaluacion: EvaluacionDocente) => {
        setEvaluacionDetalle(evaluacion);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEvaluacionDetalle(null);
    };

    return (
        <div className="max-w-8xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-6" data-aos="fade-right">
                <div className="flex items-center">
                    <button onClick={handleBack} className="mr-4 text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl text-gray-800 font-medium">Mis Evaluaciones Pendientes</h1>
                </div>
                <button
                    onClick={() => setMostrarInfo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                    title="Información sobre evaluaciones docentes"
                >
                    <Info className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">Información</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden" data-aos="fade-up">
                <div className="bg-[#189cbf] text-white p-4 rounded-t-lg" data-aos="fade-down" data-aos-delay="100">
                    <div className="flex items-center">
                        <h2 className="text-xl font-medium">Resumen de Evaluaciones</h2>
                    </div>
                    <p className="text-sm mt-1">Evaluaciones que debes completar: autoevaluaciones y coevaluaciones</p>
                </div>

                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
                    {/* Selector de período */}
                    <div className="bg-white rounded-md shadow-sm p-4 mb-4 overflow-visible">
                        <label className="block text-sm text-gray-700 font-medium mb-1">Seleccione el periodo</label>
                        <div className="relative">
                            <div
                                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:border-transparent"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">
                                        {periodos.find(p => p.id_periodo === periodo)?.descripcion || 'Buscar periodo...'}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            {isDropdownOpen && (
                                <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg" style={{ position: 'absolute' }}>
                                    {periodos.map(p => (
                                        <div
                                            key={p.id_periodo}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() => {
                                                setPeriodo(p.id_periodo);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {p.descripcion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tarjetas de estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Tarjeta 1: Progreso */}
                        <div className="bg-white rounded-md shadow-sm p-4" data-aos="fade-up" data-aos-delay="300">
                            <h3 className="text-sm font-medium text-gray-800">Progreso de Evaluaciones</h3>
                            <p className="text-xs text-gray-500">Periodo: {periodos.find(p => p.id_periodo === periodo)?.descripcion || ''}</p>
                            <div className="mt-2">
                                <p className="text-xl font-bold">{completadas} de {evaluaciones.length}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-[#189cbf] h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Has completado el {progreso}% de tus evaluaciones</p>
                            </div>
                        </div>

                        {/* Tarjeta 2: Promedio */}
                        <div className="bg-white rounded-md shadow-sm p-4" data-aos="fade-up" data-aos-delay="400">
                            <h3 className="text-sm font-medium text-gray-800">Promedio de Calificaciones</h3>
                            <p className="text-xs text-gray-500">De {completadas} evaluaciones</p>
                            <div className="mt-2">
                                <p className="text-xl font-bold">{promedio}/100</p>
                                <p className="text-xs text-gray-500 mt-1">Promedio de las evaluaciones que has realizado</p>
                            </div>
                        </div>

                        {/* Tarjeta 3: Pendientes */}
                        <div className="bg-white rounded-md shadow-sm p-4" data-aos="fade-up" data-aos-delay="500">
                            <h3 className="text-sm font-medium text-gray-800">Evaluaciones Pendientes</h3>
                            <p className="text-xs text-gray-500">Requieren tu atención</p>
                            <div className="mt-2">
                                <p className="text-xl font-bold">{pendientes}</p>
                                <p className="text-xs text-gray-500 mt-1">Completa tus evaluaciones pendientes antes de la fecha límite</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de evaluaciones */}
                    <div className="bg-white rounded-md shadow-sm p-3 sm:p-4 mb-4" data-aos="fade-up" data-aos-delay="600">
                        {/* Encabezado y buscador: en móvil, texto arriba y buscador debajo; en escritorio, igual que antes */}
                        <div className="mb-4">
                            <div className="block sm:flex sm:justify-between sm:items-center">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-medium text-gray-800">Listado de Evaluaciones</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Evaluaciones que debes completar del periodo {periodos.find(p => p.id_periodo === periodo)?.descripcion || ''}</p>
                                </div>
                                <div className="relative w-full sm:w-64 mt-2 sm:mt-0" data-aos="fade-left" data-aos-delay="700">
                                    <input
                                        type="text"
                                        placeholder="Buscar evaluación"
                                        className="border border-gray-300 rounded-md px-3 py-1 text-xs sm:text-sm w-full"
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cards en móvil, tabla en desktop */}
                        <div className="block sm:hidden space-y-3">
                            {evaluacionesFiltradas.map((ev, index) => (
                                <div key={`${ev.id}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-xs text-gray-700">{capitalizarNombreCompleto(ev.evaluado)}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ev.tipoEvaluacion === 'Autoevaluación' ? 'bg-blue-100 text-blue-800' :
                                            ev.tipoEvaluacion === 'Coevaluación' ? 'bg-purple-100 text-purple-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {ev.tipoEvaluacion}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">{ev.asignatura}</div>
                                    <div className="flex flex-wrap gap-2 text-xs mb-1">
                                        <span className="flex items-center gap-1">
                                            {ev.estado === "Completado" ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span className="text-green-500 font-medium">Completado</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                                    <span className="text-orange-500 font-medium">Pendiente</span>
                                                </>
                                            )}
                                        </span>
                                        <span className="text-gray-500">{ev.fecha}</span>
                                        <span className="text-gray-500">{ev.calificacion ? `${ev.calificacion}/100` : "-"}</span>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleVerDetalle(ev)}
                                            className="inline-flex items-center justify-center w-8 h-8 bg-[#189cbf] text-white rounded-full hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                                            title="Ver detalles"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-2">
                                <p className="text-xs text-gray-500">Mostrando {evaluacionesFiltradas.length} evaluaciones</p>
                                <p className="text-xs text-gray-500">Última actualización: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="hidden sm:block mt-4 overflow-hidden rounded-lg border border-gray-200">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className="text-left px-4 py-2 font-medium">Evaluado</th>
                                        <th className="text-left px-4 py-2 font-medium">Asignatura</th>
                                        <th className="text-left px-4 py-2 font-medium">Tipo</th>
                                        <th className="text-left px-4 py-2 font-medium">Estado</th>
                                        <th className="text-left px-4 py-2 font-medium">Fecha</th>
                                        <th className="text-left px-4 py-2 font-medium">Calificación</th>
                                        <th className="text-center px-4 py-2 font-medium">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evaluacionesFiltradas.map((ev, index) => (
                                        <tr key={`${ev.id}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">{capitalizarNombreCompleto(ev.evaluado)}</td>
                                            <td className="px-4 py-3">{ev.asignatura}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ev.tipoEvaluacion === 'Autoevaluación' ? 'bg-blue-100 text-blue-800' :
                                                    ev.tipoEvaluacion === 'Coevaluación' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {ev.tipoEvaluacion}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {ev.estado === "Completado" ? (
                                                    <div className="flex items-center">
                                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                                        <span className="text-green-500 text-xs font-medium">Completado</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                                                        <span className="text-orange-500 text-xs font-medium">Pendiente</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{ev.fecha}</td>
                                            <td className="px-4 py-3">{ev.calificacion ?? "-"}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleVerDetalle(ev)}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-[#189cbf] text-white rounded-full hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 hidden sm:block">
                            Mostrando {evaluacionesFiltradas.length} evaluaciones
                            <span className="float-right">Última actualización: {new Date().toLocaleDateString()}</span>
                        </p>
                    </div>

                    {/* Alerta de pendientes */}
                    {pendientes > 0 && (
                        <div
                            className="bg-amber-50 border border-amber-200 text-amber-800 p-4 text-sm rounded-md flex items-start mt-3"
                            data-aos="fade-up"
                            data-aos-delay="500"
                        >
                            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <span>
                                Tienes {pendientes} evaluaciones pendientes por completar. Por favor, completa todas tus autoevaluaciones y coevaluaciones antes del final del periodo para contribuir al proceso de mejora continua institucional.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalles */}
            {showModal && evaluacionDetalle && (
                <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-xl"
                        data-aos="zoom-in"
                        data-aos-duration="300"
                        data-aos-easing="ease-out-cubic"
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-4" data-aos="fade-up" data-aos-delay="0">
                                <Eye className="w-6 h-6 text-[#189cbf]" />
                                <h3 className="text-lg font-semibold text-gray-800">Detalles de la Evaluación</h3>
                            </div>
                            <div className="space-y-3">
                                <div data-aos="fade-up" data-aos-delay="50">
                                    <label className="block text-sm font-medium text-gray-600">Evaluado:</label>
                                    <p className="text-sm text-gray-800">{capitalizarNombreCompleto(evaluacionDetalle.evaluado)}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="100">
                                    <label className="block text-sm font-medium text-gray-600">Asignatura:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.asignatura}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="150">
                                    <label className="block text-sm font-medium text-gray-600">Tipo de Evaluación:</label>
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${evaluacionDetalle.tipoEvaluacion === 'Autoevaluación' ? 'bg-blue-100 text-blue-800' :
                                        evaluacionDetalle.tipoEvaluacion === 'Coevaluación' ? 'bg-purple-100 text-purple-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {evaluacionDetalle.tipoEvaluacion}
                                    </span>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="200">
                                    <label className="block text-sm font-medium text-gray-600">Estado:</label>
                                    <div className="flex items-center mt-1">
                                        {evaluacionDetalle.estado === "Completado" ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />Completado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />Pendiente
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="250">
                                    <label className="block text-sm font-medium text-gray-600">Fecha:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.fecha}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="300">
                                    <label className="block text-sm font-medium text-gray-600">Calificación:</label>
                                    <p className="text-sm text-gray-800">
                                        {evaluacionDetalle.calificacion ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                {evaluacionDetalle.calificacion}/100
                                            </span>
                                        ) : "No calificado"}
                                    </p>
                                </div>
                                {/* Observaciones y recordatorio igual que antes */}
                                {evaluacionDetalle.estado === "Completado" && evaluacionDetalle.calificacion && (
                                    <div data-aos="fade-up" data-aos-delay="350">
                                        <label className="block text-sm font-medium text-gray-600">Observaciones:</label>
                                        <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md mt-1">
                                            {evaluacionDetalle.calificacion >= 80
                                                ? "Evaluación completada satisfactoriamente. Has otorgado una calificación alta a este docente."
                                                : evaluacionDetalle.calificacion >= 70
                                                    ? "Evaluación completada. Has asignado una calificación satisfactoria a este docente."
                                                    : "Evaluación completada. Has asignado una calificación que sugiere áreas de mejora para este docente."
                                            }
                                        </p>
                                    </div>
                                )}
                                {evaluacionDetalle.estado === "Pendiente" && (
                                    <div data-aos="fade-up" data-aos-delay="350">
                                        <label className="block text-sm font-medium text-gray-600">Recordatorio:</label>
                                        <p className="text-sm text-gray-800 bg-orange-50 p-3 rounded-md mt-1">
                                            Esta evaluación está pendiente de completar. Por favor, realiza la evaluación de este docente antes de la fecha límite del periodo.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end" data-aos="fade-up" data-aos-delay="400">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm bg-[#189cbf] text-white rounded-md hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                        <CircleHelp className="w-6 h-6 text-[#189cbf]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Información sobre Evaluaciones Docentes
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setMostrarInfo(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">Tipos de Evaluaciones</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-blue-600 text-xs font-bold">A</span>
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-blue-900 mb-1">Autoevaluación</h5>
                                                <p className="text-blue-800 text-sm">
                                                    Evaluación que realizas sobre tu propio desempeño docente. Es fundamental para el proceso de mejora continua y reflexión sobre tu práctica pedagógica.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-purple-600 text-xs font-bold">C</span>
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-purple-900 mb-1">Coevaluación</h5>
                                                <p className="text-purple-800 text-sm">
                                                    Evaluación que realizas sobre el desempeño de otros docentes. Contribuye al desarrollo profesional de tus colegas y fortalece la comunidad académica.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">Estados de Evaluación</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                            <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h5 className="font-medium text-orange-900 mb-1">Pendiente</h5>
                                                <p className="text-orange-800 text-sm">
                                                    Evaluación que aún no has completado. Es importante completarla antes de la fecha límite del periodo.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h5 className="font-medium text-green-900 mb-1">Completado</h5>
                                                <p className="text-green-800 text-sm">
                                                    Evaluación que ya has finalizado. Tu calificación contribuye al proceso de evaluación institucional.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Notas importantes:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Completa todas tus evaluaciones antes de la fecha límite del periodo</li>
                                        <li>• Las coevaluaciones se asignan según la disponibilidad y criterios institucionales</li>
                                        <li>• Puedes ver el detalle de cada evaluación haciendo clic en el botón de información</li>
                                    </ul>
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
        </div>
    );
};

export default ResumenDocente;