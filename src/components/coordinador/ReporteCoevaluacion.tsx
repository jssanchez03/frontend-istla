import React, { useState, useEffect } from 'react';
import { obtenerPeriodos } from "@/services/evaluacionesService";
import { FileText, Download, Eye, Loader2, Users, BookOpen, GraduationCap, Building, Calendar, Clock, User, AlertCircle, CheckCircle, Settings, FileSpreadsheet, Info, X } from 'lucide-react';
import reporteCoevaluacionService, { AsignacionCoevaluacion } from '../../services/reporteCoevaluacionService';
import ModalConfiguracionFirmas from '../ui/modales/ModalConfiguracionFirmas';
import Select from "react-select";

interface EstadisticasReporte {
    totalAsignaciones: number;
    evaluadoresUnicos: number;
    evaluadosUnicos: number;
    asignaturasUnicas: number;
    carrerasUnicas: number;
    nivelesUnicos: number;
}

interface Periodo {
    id_periodo: number;
    descripcion: string;
}

const ReporteCoevaluacion: React.FC = () => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | ''>('');
    const [cargandoPeriodos, setCargandoPeriodos] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [generandoExcel, setGenerandoExcel] = useState(false);
    const [datosPreview, setDatosPreview] = useState<AsignacionCoevaluacion[]>([]);
    const [estadisticas, setEstadisticas] = useState<EstadisticasReporte | null>(null);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [mostrarPreview, setMostrarPreview] = useState(false);
    const [modalFirmasAbierto, setModalFirmasAbierto] = useState(false);
    const [mostrarInfo, setMostrarInfo] = useState(false);

    // Cargar periodos al montar el componente
    useEffect(() => {
        cargarPeriodos();
    }, []);

    // Limpiar mensajes después de un tiempo
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const cargarPeriodos = async () => {
        setCargandoPeriodos(true);
        try {
            const data = await obtenerPeriodos();
            setPeriodos(data);
            if (data.length > 0) {
                setPeriodoSeleccionado(data[0].id_periodo);
            }
        } catch (err) {
            console.error("Error al cargar periodos:", err);
            setError("Error al cargar periodos");
        } finally {
            setCargandoPeriodos(false);
        }
    };

    const handlePrevisualizarDatos = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor seleccione un período válido');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const datos = await reporteCoevaluacionService.previsualizarDatos(Number(periodoSeleccionado));

            if (datos.length === 0) {
                setError('No se encontraron asignaciones para el período seleccionado');
                setDatosPreview([]);
                setEstadisticas(null);
                setMostrarPreview(false);
                return;
            }

            setDatosPreview(datos);
            setEstadisticas(reporteCoevaluacionService.obtenerEstadisticasReporte(datos));
            setMostrarPreview(true);
            setSuccess(`Se encontraron ${datos.length} asignaciones para previsualizar`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener datos de previsualización');
            setDatosPreview([]);
            setEstadisticas(null);
            setMostrarPreview(false);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarReporte = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor seleccione un período válido');
            return;
        }

        setGenerando(true);
        setError('');
        setSuccess('');

        try {
            await reporteCoevaluacionService.generarReportePDF(Number(periodoSeleccionado));
            setSuccess('Reporte PDF generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte PDF');
        } finally {
            setGenerando(false);
        }
    };

    const handleGenerarReporteExcel = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor seleccione un período válido');
            return;
        }

        setGenerandoExcel(true);
        setError('');
        setSuccess('');

        try {
            await reporteCoevaluacionService.generarReporteExcel(Number(periodoSeleccionado));
            setSuccess('Reporte Excel generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte Excel');
        } finally {
            setGenerandoExcel(false);
        }
    };

    const handleModalSuccess = (_mensaje: string) => {
        // No hacer nada - solo el modal maneja sus alertas
    };

    const handleModalError = (_mensaje: string) => {
        console.error('❌ Error desde modal:', _mensaje);
        // No hacer nada - solo el modal maneja sus alertas
    };

    const opcionesPeriodos = periodos.map(periodo => ({
        value: periodo.id_periodo,
        label: periodo.descripcion,
    }));

    const customStyles = {
        control: (base: any, state: any) => ({
            ...base,
            borderRadius: "0.5rem",
            borderColor: state.isFocused ? "#189cbf" : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(24, 156, 191, 0.2)" : "none",
            "&:hover": {
                borderColor: "#189cbf",
            },
            minHeight: "2.5rem",
            paddingLeft: "0.25rem",
            paddingRight: "0.25rem",
            fontSize: "0.95rem",
        }),
        menu: (base: any) => ({
            ...base,
            borderRadius: "0.5rem",
            marginTop: "0.25rem",
            zIndex: 99999,
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#189cbf"
                : state.isFocused
                    ? "#e0f5fa"
                    : "#fff",
            color: state.isSelected ? "#fff" : "#111827",
            cursor: "pointer",
            fontSize: "0.95rem",
            padding: "0.5rem 1rem",
        }),
        input: (base: any) => ({
            ...base,
            fontSize: "0.95rem",
        }),
        singleValue: (base: any) => ({
            ...base,
            fontSize: "0.95rem",
            color: "#111827",
        }),
        menuPortal: (base: any) => ({
            ...base,
            zIndex: 99999,
        }),
    };

    const renderEstadisticas = () => {
        if (!estadisticas) return null;

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-[#189cbf]/10 p-4 rounded-lg text-center border border-[#189cbf]/20 shadow-sm" data-aos="fade-up" data-aos-delay="100">
                    <FileText className="h-8 w-8 text-[#189cbf] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#189cbf]">{estadisticas.totalAsignaciones}</div>
                    <div className="text-sm text-gray-600">Asignaciones</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100 shadow-sm" data-aos="fade-up" data-aos-delay="150">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{estadisticas.evaluadoresUnicos}</div>
                    <div className="text-sm text-gray-600">Evaluadores</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100 shadow-sm" data-aos="fade-up" data-aos-delay="200">
                    <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{estadisticas.evaluadosUnicos}</div>
                    <div className="text-sm text-gray-600">Evaluados</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100 shadow-sm" data-aos="fade-up" data-aos-delay="250">
                    <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{estadisticas.asignaturasUnicas}</div>
                    <div className="text-sm text-gray-600">Asignaturas</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100 shadow-sm" data-aos="fade-up" data-aos-delay="300">
                    <Building className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{estadisticas.carrerasUnicas}</div>
                    <div className="text-sm text-gray-600">Carreras</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100 shadow-sm" data-aos="fade-up" data-aos-delay="350">
                    <GraduationCap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-indigo-600">{estadisticas.nivelesUnicos}</div>
                    <div className="text-sm text-gray-600">Niveles</div>
                </div>
            </div>
        );
    };

    const renderPreviewData = () => {
        if (!mostrarPreview || datosPreview.length === 0) return null;

        const datosAgrupados = reporteCoevaluacionService.agruparAsignacionesPorCarreraYNivel(datosPreview);

        return (
            <div className="space-y-6">
                {Object.entries(datosAgrupados).map(([carrera, niveles], carreraIndex) => (
                    <div key={carrera} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm" data-aos="fade-up" data-aos-delay={carreraIndex * 100}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Building className="h-5 w-5 mr-2 text-[#189cbf]" />
                            {carrera}
                        </h3>

                        {Object.entries(niveles).map(([nivel, asignaciones], nivelIndex) => (
                            <div key={`${carrera}-${nivel}`} className="mb-6" data-aos="fade-left" data-aos-delay={(carreraIndex * 100) + (nivelIndex * 50) + 100}>
                                <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                                    <GraduationCap className="h-4 w-4 mr-2 text-green-600" />
                                    {nivel}
                                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                                        {asignaciones.length} asignaciones
                                    </span>
                                </h4>

                                <div className="block sm:hidden space-y-3">
                                    {asignaciones.map((asignacion, index) => (
                                        <div key={`${asignacion.id_asignacion}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                            <div className="font-semibold text-xs text-gray-700 mb-1 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-[#189cbf]" />
                                                {asignacion.nombre_asignatura || '—'}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {asignacion.nombre_evaluador || '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {asignacion.nombre_evaluado || '—'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    {reporteCoevaluacionService.formatearFecha(asignacion.fecha)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    {reporteCoevaluacionService.formatearHora(asignacion.hora_inicio)} - {reporteCoevaluacionService.formatearHora(asignacion.hora_fin)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full border border-gray-300">
                                                        {asignacion.dia || '—'}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                                    Asignatura
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                                    Docente Evaluador
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                                    Docente Evaluado
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                                    Fecha
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                                    Horario
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                                    Día
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {asignaciones.map((asignacion, index) => (
                                                <tr key={`${asignacion.id_asignacion}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        {asignacion.nombre_asignatura || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        {asignacion.nombre_evaluador || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        {asignacion.nombre_evaluado || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900 flex items-center">
                                                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                                        {reporteCoevaluacionService.formatearFecha(asignacion.fecha)}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                                            {reporteCoevaluacionService.formatearHora(asignacion.hora_inicio)} -
                                                            {reporteCoevaluacionService.formatearHora(asignacion.hora_fin)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full border border-gray-300">
                                                            {asignacion.dia || '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="py-5 space-y-6">

            <div className="flex items-center justify-between mb-6" data-aos="fade-right">
                <h1 className="text-xl text-gray-800 font-medium">Reporte de la asignación de Coevaluaciones</h1>

                <button
                    onClick={() => setMostrarInfo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                    title="Información sobre reportes"
                >
                    <Info className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">Información</span>
                </button>
            </div>

            {/* Encabezado */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200" data-aos="fade-down">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="flex items-center text-xl font-semibold text-gray-900">
                        <FileText className="h-6 w-6 mr-2 text-[#189cbf]" />
                        Generación de Reporte
                    </h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        Genere reportes PDF o Excel de las asignaciones de coevaluaciones organizados por carrera y nivel académico.
                    </p>

                    {/* Formulario de entrada */}
                    <div className="space-y-4" data-aos="fade-up" data-aos-delay="100">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="periodoSelect" className="block text-sm font-medium text-gray-700 mb-1">
                                    Período Académico
                                </label>
                                <Select
                                    inputId="periodoSelect"
                                    options={opcionesPeriodos}
                                    value={opcionesPeriodos.find(opt => opt.value === periodoSeleccionado)}
                                    onChange={selected => setPeriodoSeleccionado(selected ? selected.value : '')}
                                    placeholder="Seleccionar período"
                                    isSearchable
                                    isClearable={false}
                                    styles={customStyles}
                                    menuPortalTarget={document.body}
                                    isDisabled={cargandoPeriodos}
                                    noOptionsMessage={() => "No hay períodos disponibles"}
                                />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-3" data-aos="fade-up" data-aos-delay="200">
                            <button
                                onClick={handlePrevisualizarDatos}
                                disabled={loading || !periodoSeleccionado}
                                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Eye className="h-4 w-4 mr-2" />
                                )}
                                Previsualizar Datos
                            </button>

                            <button
                                onClick={handleGenerarReporte}
                                disabled={generando || !periodoSeleccionado}
                                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#189cbf] border border-transparent rounded-md shadow-sm hover:bg-[#147a99] focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                            >
                                {generando ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Generar Reporte PDF
                            </button>

                            <button
                                onClick={handleGenerarReporteExcel}
                                disabled={generandoExcel || !periodoSeleccionado}
                                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                            >
                                {generandoExcel ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                )}
                                Generar Reporte Excel
                            </button>

                            <button
                                onClick={() => setModalFirmasAbierto(true)}
                                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:shadow-md"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Configurar Firmas
                            </button>
                        </div>
                    </div>

                    {/* Mensajes de estado */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md" data-aos="fade-in">
                            <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md" data-aos="fade-in">
                            <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                <p className="text-sm text-green-800">{success}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Estadísticas */}
            {estadisticas && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200" data-aos="fade-up">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="flex items-center text-xl font-semibold text-gray-900">
                            <Users className="h-6 w-6 mr-2 text-green-600" />
                            Resumen de Datos
                        </h2>
                    </div>
                    <div className="p-6">
                        {renderEstadisticas()}
                    </div>
                </div>
            )}

            {/* Previsualización de datos */}
            {mostrarPreview && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200" data-aos="fade-up" data-aos-delay="100">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="flex items-center text-xl font-semibold text-gray-900">
                            <Eye className="h-6 w-6 mr-2 text-[#189cbf]" />
                            Previsualización de Datos
                        </h2>
                    </div>
                    <div className="p-6">
                        {renderPreviewData()}
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
                        className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        data-aos="zoom-in"
                        data-aos-duration="300"
                    >
                        <div className="p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-[#189cbf]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Información sobre reportes
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
                                    Los reportes de coevaluaciones se generan automáticamente con la siguiente información:
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                                        <FileText className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-red-900 mb-1">Reporte PDF</h4>
                                            <p className="text-red-800 text-sm">
                                                Descarga un PDF con todas las asignaciones en una tabla clara y legible.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <FileSpreadsheet className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 mb-1">Reporte Excel</h4>
                                            <p className="text-green-800 text-sm">
                                                Descarga un archivo Excel (.xlsx) con formato profesional y colores para facilitar el análisis y la edición.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <Building className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">Organización de datos</h4>
                                            <p className="text-blue-800 text-sm">
                                                Los datos se organizan automáticamente por carrera y nivel académico. Incluye: asignatura, docente evaluador, docente evaluado, fecha, horario y día.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <Settings className="w-6 h-6 text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-indigo-900 mb-1">Configuración de firmas</h4>
                                            <p className="text-indigo-800 text-sm">
                                                Configure las autoridades que aparecerán en la sección de firmas de los reportes PDF y Excel generados.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900 mb-1">Importante</h4>
                                            <p className="text-amber-800 text-sm">
                                                Solo puedes generar reportes para la carrera a la que has sido asignado como coordinador.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Características adicionales:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Los archivos se descargan automáticamente con el nombre del período incluido</li>
                                        <li>• Previsualización de datos disponible antes de generar el reporte</li>
                                        <li>• Estadísticas resumen para análisis rápido</li>
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

            {/* Modal de configuración de firmas */}
            {modalFirmasAbierto && (
                <ModalConfiguracionFirmas
                    isOpen={modalFirmasAbierto}
                    onClose={() => setModalFirmasAbierto(false)}
                    onSuccess={handleModalSuccess}
                    onError={handleModalError}
                />
            )}
        </div>
    );
};

export default ReporteCoevaluacion;