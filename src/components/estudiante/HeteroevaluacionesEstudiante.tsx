import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import { FileText, CheckCircle, Clock, CheckCheck, Loader2, BookOpen, Calendar, PlayCircle, ArrowLeft, Info, X } from "lucide-react";

interface Evaluacion {
    id_evaluacion: number;
    id_formulario: number;
    evaluador_id: number;
    evaluado_id: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    estado: "pendiente" | "completada" | "activa" | "inactiva";
    nombre_formulario: string;
    nombres_docente: string | null;
    nombre_asignatura: string | null;
    periodo: string;
    estado_estudiante: "pendiente" | "completada";
    id_distributivo: number | null;
}

const EvaluacionesEstudiante = () => {
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarInfo, setMostrarInfo] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        AOS.init({
            duration: 600,
            once: true,
        });
        cargarEvaluaciones();
    }, []);

    const cargarEvaluaciones = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                "https://evaluacion.istla-sigala.edu.ec/api/api/v1/evaluaciones/estudiante/mis-evaluaciones",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setEvaluaciones(response.data);
            setError(null);
        } catch (err) {
            console.error("Error al cargar evaluaciones:", err);
            setError("Error al cargar las evaluaciones");
        } finally {
            setLoading(false);
        }
    };

    // Usar estado_estudiante en lugar de estado para el filtrado
    const completadas = evaluaciones.filter(e => e.estado_estudiante === "completada").length;
    const pendientes = evaluaciones.filter(e => e.estado_estudiante === "pendiente").length;
    const progreso = evaluaciones.length > 0 ? Math.round((completadas / evaluaciones.length) * 100) : 0;

    if (loading) {
        return (
            <div className="max-w-8xl mx-auto p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#930f4b]"></div>
                    <span className="ml-3 text-gray-600">Cargando evaluaciones...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error al cargar</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                                    onClick={cargarEvaluaciones}
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-8xl mx-auto p-6">

            <div className="flex items-center justify-between mb-6" data-aos="fade-right">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-4 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl text-gray-800 font-medium">Mis Heteroevaluaciones</h1>
                </div>
                <button
                    onClick={() => setMostrarInfo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                    title="Información sobre heteroevaluaciones"
                >
                    <Info className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">Información</span>
                </button>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Total de evaluaciones */}
                <div className="bg-white rounded-lg shadow-sm p-6" data-aos="fade-up" data-aos-delay="100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-[#930f4b]">
                            <FileText className="h-10 w-10" />
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{evaluaciones.length}</p>
                            <p className="text-sm text-gray-600">Total de Evaluaciones</p>
                        </div>
                    </div>
                </div>

                {/* Completadas */}
                <div className="bg-white rounded-lg shadow-sm p-6" data-aos="fade-up" data-aos-delay="200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-[#930f4b]">
                            <CheckCircle className="h-10 w-10" />
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{completadas}</p>
                            <p className="text-sm text-gray-600">Completadas</p>
                        </div>
                    </div>
                </div>

                {/* Pendientes */}
                <div className="bg-white rounded-lg shadow-sm p-6" data-aos="fade-up" data-aos-delay="300">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-[#930f4b]">
                            <Clock className="h-10 w-10" />
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{pendientes}</p>
                            <p className="text-sm text-gray-600">Pendientes</p>
                        </div>
                    </div>
                </div>

                {/* Progreso */}
                <div className="bg-white rounded-lg shadow-sm p-6" data-aos="fade-up" data-aos-delay="400">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-[#930f4b]">
                            {progreso < 100 ? (
                                <Loader2 className="h-10 w-10 animate-spin" />
                            ) : (
                                <CheckCheck className="h-10 w-10 text-[#930f4b]" />
                            )}
                        </div>
                        <div className="ml-4 w-full">
                            <p className="text-2xl font-bold text-gray-800">{progreso}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-[#930f4b] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progreso}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {completadas} completadas, {pendientes} pendientes
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {evaluaciones.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No hay evaluaciones</h3>
                    <p className="mt-2 text-gray-500">No tienes evaluaciones asignadas en este momento.</p>
                </div>
            ) : (
                /* Lista de evaluaciones mejorada */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {evaluaciones.map((evalItem, index) => (
                        <div
                            key={`${evalItem.id_evaluacion}-${evalItem.id_distributivo}-${index}`}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                            data-aos="fade-up"
                            data-aos-delay={100 + index * 50}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <div className="w-2 h-2 bg-[#930f4b] rounded-full mr-2"></div>
                                            <span className="text-sm font-medium text-[#930f4b]">
                                                {evalItem.nombre_formulario}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                                            {evalItem.nombres_docente || `Heteroevaluación Docente`}
                                        </h4>

                                        {evalItem.nombre_asignatura && (
                                            <p className="text-gray-600 mb-2 flex items-center">
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                {evalItem.nombre_asignatura}
                                            </p>
                                        )}

                                        <p className="text-sm text-gray-500 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Período: {evalItem.periodo}
                                        </p>

                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Inicio: {new Date(evalItem.fecha_inicio).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${evalItem.estado_estudiante === "completada"
                                            ? "bg-green-100 text-green-800 border border-green-200"
                                            : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                            }`}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full mr-2 ${evalItem.estado_estudiante === "completada" ? "bg-green-500" : "bg-yellow-500"
                                                }`}
                                        ></div>
                                        {evalItem.estado_estudiante === "completada" ? "Completada" : "Pendiente"}
                                    </span>
                                </div>

                                {evalItem.estado_estudiante === "pendiente" && (
                                    <button
                                        className="w-full bg-[#930f4b] text-white px-6 py-3 rounded-lg hover:from-[#147a98] hover:to-[#105d73] transition-all duration-200 font-semibold flex items-center justify-center"
                                        onClick={() => navigate(`/evaluaciones/hetero/${evalItem.id_evaluacion}?distributivo=${evalItem.id_distributivo}`)}
                                    >
                                        <PlayCircle className="w-5 h-5 mr-2" />
                                        Iniciar Evaluación
                                    </button>
                                )}

                                {evalItem.estado_estudiante === "completada" && evalItem.fecha_fin && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Completada el{" "}
                                            {new Date(evalItem.fecha_fin).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
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
                                        <Info className="w-6 h-6 text-[#189cbf]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Información sobre Heteroevaluaciones
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
                                    <h4 className="font-semibold text-gray-800 mb-3">¿Qué verás en esta página?</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <FileText className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h5 className="font-medium text-blue-900 mb-1">Tarjetas de Resumen</h5>
                                                <p className="text-blue-800 text-sm">
                                                    Estadísticas de tus evaluaciones: total, completadas, pendientes y progreso.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                            <BookOpen className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h5 className="font-medium text-green-900 mb-1">Lista de Evaluaciones</h5>
                                                <p className="text-green-800 text-sm">
                                                    Todas tus heteroevaluaciones pendientes y completadas con detalles de cada docente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">¿Por qué es importante evaluar?</h4>
                                    <p className="text-sm text-gray-600">
                                        Tu opinión como estudiante ayuda a los docentes a mejorar su práctica pedagógica y contribuye a la calidad educativa de la institución.
                                    </p>
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

export default EvaluacionesEstudiante;