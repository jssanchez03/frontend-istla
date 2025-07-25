import React, { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    BookOpen,
    Calendar,
    AlertCircle,
    CheckCircle,
    Info,
    Users,
    Building,
    Loader2,
    X,
    Eye,
    FileSpreadsheet,
    Clock,
    User,
    GraduationCap,
    BarChart,
    LineChart,
    Settings
} from 'lucide-react';
import {
    obtenerCarrerasActivas,
    obtenerPeriodos,
    generarReporteCarrera,
    descargarReporte,
    generarReporteCoevaluacionPDF,
    generarReporteCoevaluacionExcel,
    previsualizarCoevaluacionesPorCarrera,
    obtenerEstadisticasReporte,
    formatearFecha,
    formatearHora,
    Carrera,
    Periodo,
    AsignacionCoevaluacion,
    generarReporteCalificacionPorCarreraPDF,
    generarReporteCalificacionTodasCarrerasPDF,
    obtenerDatosReporteCalificacion,
    descargarReportePDFPromedioItems,
    DatosPromedioItems,
} from '../../services/reportesAdmin';
import { obtenerPromedioItemsPorTipo } from '../../services/dashboardService';
import Select from "react-select";
import reporteCoevaluacionService from '../../services/reporteCoevaluacionService';
import ModalConfiguracionOficio from '../ui/modales/ModalConfiguracionOficio';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ModalConfiguracionFirmas from '../ui/modales/ModalConfiguracionFirmas';
import { capitalizarNombreCompleto } from '../../lib/utils';

// Interfaces para estadísticas
interface EstadisticasReporte {
    totalAsignaciones: number;
    evaluadoresUnicos: number;
    evaluadosUnicos: number;
    asignaturasUnicas: number;
    carrerasUnicas: number;
    nivelesUnicos: number;
}

// Clase base para botones principales sin opacidad en deshabilitados
const botonClase = "flex items-center justify-center min-w-[220px] px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none";

const ReportesAdmin: React.FC = () => {
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [carreraSeleccionada, setCarreraSeleccionada] = useState<number | null>(null);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | null>(null);
    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [info, setInfo] = useState<string>('');
    const [mostrarInfo, setMostrarInfo] = useState(false);

    const [datosGenerales, setDatosGenerales] = useState<AsignacionCoevaluacion[]>([]);
    const [mostrarPreviewGeneral, setMostrarPreviewGeneral] = useState(false);
    const [cargandoGeneral, setCargandoGeneral] = useState(false);
    const [generandoPDFGeneral, setGenerandoPDFGeneral] = useState(false);
    const [generandoExcelGeneral, setGenerandoExcelGeneral] = useState(false);

    // Estados para coevaluaciones
    const [cargandoCoevaluacion, setCargandoCoevaluacion] = useState(false);
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [generandoExcel, setGenerandoExcel] = useState(false);
    const [datosCoevaluacion, setDatosCoevaluacion] = useState<AsignacionCoevaluacion[]>([]);
    const [estadisticasCoevaluacion, setEstadisticasCoevaluacion] = useState<EstadisticasReporte | null>(null);
    const [mostrarPreviewCoevaluacion, setMostrarPreviewCoevaluacion] = useState(false);
    // Actualizar el tipo de tabActiva para reflejar los nuevos nombres
    const [tabActiva, setTabActiva] = useState<'oficioResultados' | 'coevaluaciones' | 'promedios' | 'analisisDetallado'>('oficioResultados');

    // Estados para promedios
    const [generandoPDFPromedios, setGenerandoPDFPromedios] = useState(false);
    const [cargandoPromedios, setCargandoPromedios] = useState(false);
    const [datosPromedios, setDatosPromedios] = useState<any[]>([]);
    const [mostrarPreviewPromedios, setMostrarPreviewPromedios] = useState(false);

    // NUEVO: Estados para promedios generales (todas las carreras)
    const [cargandoPromediosTodas, setCargandoPromediosTodas] = useState(false);
    const [datosPromediosTodas, setDatosPromediosTodas] = useState<any[]>([]);
    const [mostrarPreviewPromediosTodas, setMostrarPreviewPromediosTodas] = useState(false);

    // Estado para exportar PDF de todas las carreras
    const [generandoPDFPromediosTodas, setGenerandoPDFPromediosTodas] = useState(false);

    // Nuevo estado para el modal de configuración de oficio
    const [mostrarModalOficio, setMostrarModalOficio] = useState(false);

    // Nuevos estados para promedios por ítems
    const [tipoEvaluacionSeleccionado, setTipoEvaluacionSeleccionado] = useState<number | null>(null);
    const [datosPromediosItems, setDatosPromediosItems] = useState<DatosPromedioItems | null>(null);
    const [mostrarPreviewPromediosItems, setMostrarPreviewPromediosItems] = useState(false);
    const [cargandoPromediosItems, setCargandoPromediosItems] = useState(false);
    const [generandoPDFPromediosItems, setGenerandoPDFPromediosItems] = useState(false);

    // Estados para controlar qué previsualización de coevaluaciones está activa
    const [previewActivo, setPreviewActivo] = useState<'carrera' | 'general' | null>(null);

    // Agregar estado para toast
    const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' | 'success' } | null>(null);

    // Agrega un estado para la carga de carreras
    const [cargandoCarreras, setCargandoCarreras] = useState(false);

    const [mostrarModalFirmas, setMostrarModalFirmas] = useState(false);

    // Estado para controlar las autoridades filtradas solo para admin
    const [autoridadesSoloVicerrectora, setAutoridadesSoloVicerrectora] = useState<any[]>([]);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    useEffect(() => {
        AOS.init({ duration: 700, once: true });
    }, []);

    useEffect(() => {
        AOS.refresh();
    }, [tabActiva]);

    // Limpiar mensajes después de un tiempo
    useEffect(() => {
        if (error || success || info) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
                setInfo('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success, info]);

    useEffect(() => {
        if (mostrarModalFirmas) {
            reporteCoevaluacionService.obtenerAutoridadesParaFirmas().then(autoridades => {
                const soloVicerrectora = autoridades.filter(a => a.cargo_autoridad && a.cargo_autoridad.toUpperCase().includes('VICERRECTOR'));
                setAutoridadesSoloVicerrectora(soloVicerrectora);
            });
        }
    }, [mostrarModalFirmas]);

    const cargarDatosIniciales = async () => {
        setCargandoDatos(true);
        try {
            // Cargar periodos primero
            const periodosData = await obtenerPeriodos();
            setPeriodos(periodosData);
            // Seleccionar automáticamente el primer período si existe
            let periodoInicial = null;
            if (periodosData.length > 0) {
                setPeriodoSeleccionado(periodosData[0].id_periodo);
                periodoInicial = periodosData[0].id_periodo;
            }
            // Cargar carreras solo si hay periodo seleccionado
            if (periodoInicial) {
                const carrerasData = await obtenerCarrerasActivas(periodoInicial);
                setCarreras(carrerasData);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            setError('Error al cargar los datos iniciales');
        } finally {
            setCargandoDatos(false);
        }
    };

    // useEffect para recargar carreras cuando cambia el periodo seleccionado
    useEffect(() => {
        if (periodoSeleccionado) {
            cargarCarrerasPorPeriodo(periodoSeleccionado);
        }
    }, [periodoSeleccionado]);

    // Nueva función para cargar carreras activas por periodo
    const cargarCarrerasPorPeriodo = async (idPeriodo: number) => {
        setCargandoCarreras(true);
        try {
            const carrerasData = await obtenerCarrerasActivas(idPeriodo);
            setCarreras(carrerasData);
            // Si la carrera seleccionada ya no está, resetear
            if (!carrerasData.some(c => c.id_carrera === carreraSeleccionada)) {
                setCarreraSeleccionada(null);
            }
        } catch (error) {
            console.error('Error cargando carreras:', error);
            setError('Error al cargar las carreras activas para el período');
        } finally {
            setCargandoCarreras(false);
        }
    };

    const handlePrevisualizarPromedios = async () => {
        if (!carreraSeleccionada || !periodoSeleccionado) {
            setError('Por favor selecciona una carrera y un período');
            return;
        }
        setCargandoPromedios(true);
        setError('');
        setSuccess('');
        // OCULTAR la previsualización de todas las carreras
        setMostrarPreviewPromediosTodas(false);
        try {
            const datos = await obtenerDatosReporteCalificacion(carreraSeleccionada, periodoSeleccionado);
            const docentes = datos && Array.isArray(datos.docentes) ? datos.docentes : [];
            setDatosPromedios(docentes);
            if (!docentes.length) {
                setError('No se encontraron datos de promedios para la carrera y período seleccionados');
                setMostrarPreviewPromedios(false);
                return;
            }
            setMostrarPreviewPromedios(true);
            setSuccess(`Se encontraron ${docentes.length} docentes para previsualizar`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener datos de promedios');
            setDatosPromedios([]);
            setMostrarPreviewPromedios(false);
        } finally {
            setCargandoPromedios(false);
        }
    };

    // Nueva función para previsualizar promedios generales (todas las carreras)
    const handlePrevisualizarPromediosTodas = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor selecciona un período');
            return;
        }
        setCargandoPromediosTodas(true);
        setError('');
        setSuccess('');
        // OCULTAR la previsualización de carrera
        setMostrarPreviewPromedios(false);
        try {
            const datos = await obtenerDatosReporteCalificacion('todas', periodoSeleccionado);
            setDatosPromediosTodas(datos);
            const totalDocentes = Object.values(datos || {}).reduce((acc, carrera: any) => acc + (Array.isArray(carrera.docentes) ? carrera.docentes.length : 0), 0);
            if (!totalDocentes) {
                setError('No se encontraron datos de promedios para el período seleccionado');
                setMostrarPreviewPromediosTodas(false);
                return;
            }
            setMostrarPreviewPromediosTodas(true);
            setSuccess(`Se encontraron ${totalDocentes} docentes para previsualizar (todas las carreras)`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener datos de promedios generales');
            setDatosPromediosTodas([]);
            setMostrarPreviewPromediosTodas(false);
        } finally {
            setCargandoPromediosTodas(false);
        }
    };

    const handleGenerarReportePromediosPDF = async () => {
        if (!carreraSeleccionada || !periodoSeleccionado) {
            setError('Por favor selecciona una carrera y un período');
            return;
        }
        setGenerandoPDFPromedios(true);
        setError('');
        setSuccess('');
        try {
            await generarReporteCalificacionPorCarreraPDF(carreraSeleccionada, periodoSeleccionado);
            setSuccess('Reporte PDF de promedios generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte PDF');
        } finally {
            setGenerandoPDFPromedios(false);
        }
    };

    // Función para generar reporte de evaluaciones (existente)
    const handleGenerarReporte = async (numeroInicioOficio?: number) => {
        if (!carreraSeleccionada || !periodoSeleccionado) {
            setError('Por favor selecciona una carrera y un período');
            return;
        }

        if (!numeroInicioOficio) {
            setMostrarModalOficio(true);
            return;
        }

        try {
            setCargando(true);
            setError('');
            setSuccess('');
            setInfo('Generando reporte... Por favor espera');
            const blob = await generarReporteCarrera({
                idCarrera: carreraSeleccionada,
                idPeriodo: periodoSeleccionado,
                numeroInicioOficio: numeroInicioOficio
            });
            const carrera = carreras.find(c => c.id_carrera === carreraSeleccionada);
            if (carrera) {
                descargarReporte(blob, carrera.nombre_carrera);
                setInfo('');
                setSuccess('Reporte generado y descargado exitosamente');
            }
        } catch (error: any) {
            console.error('Error generando reporte:', error);
            let mensajeError = 'Error al generar el reporte';
            if (error.response?.status === 404) {
                mensajeError = 'No se encontraron docentes para la carrera y período seleccionados';
            } else if (error.response?.data?.message) {
                mensajeError = error.response.data.message;
            } else if (error.message) {
                mensajeError = error.message;
            }
            setInfo('');
            setError(mensajeError);
        } finally {
            setCargando(false);
        }
    };

    // Nuevas funciones para coevaluaciones
    const handlePrevisualizarCoevaluaciones = async () => {
        if (!carreraSeleccionada || !periodoSeleccionado) {
            setError('Por favor selecciona una carrera y un período');
            return;
        }

        setCargandoCoevaluacion(true);
        setError('');
        setSuccess('');

        try {
            const datos = await previsualizarCoevaluacionesPorCarrera(carreraSeleccionada, periodoSeleccionado);

            if (datos.length === 0) {
                setError('No se encontraron asignaciones de coevaluación para la carrera y período seleccionados');
                setDatosCoevaluacion([]);
                setEstadisticasCoevaluacion(null);
                setMostrarPreviewCoevaluacion(false);
                return;
            }

            setDatosCoevaluacion(datos);
            setEstadisticasCoevaluacion(obtenerEstadisticasReporte(datos));
            setMostrarPreviewCoevaluacion(true);
            setSuccess(`Se encontraron ${datos.length} asignaciones de coevaluación para previsualizar`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener datos de previsualización');
            setDatosCoevaluacion([]);
            setEstadisticasCoevaluacion(null);
            setMostrarPreviewCoevaluacion(false);
        } finally {
            setCargandoCoevaluacion(false);
        }
    };

    const handleGenerarReporteCoevaluacionPDF = async () => {
        if (!carreraSeleccionada || !periodoSeleccionado) {
            setError('Por favor selecciona una carrera y un período');
            return;
        }

        setGenerandoPDF(true);
        setError('');
        setSuccess('');

        try {
            await generarReporteCoevaluacionPDF(carreraSeleccionada, periodoSeleccionado);
            setSuccess('Reporte PDF de coevaluaciones generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte PDF');
        } finally {
            setGenerandoPDF(false);
        }
    };

    const handleGenerarReporteCoevaluacionExcel = async () => {
        if (!carreraSeleccionada || !periodoSeleccionado) {
            setError('Por favor selecciona una carrera y un período');
            return;
        }

        setGenerandoExcel(true);
        setError('');
        setSuccess('');

        try {
            await generarReporteCoevaluacionExcel(carreraSeleccionada, periodoSeleccionado);
            setSuccess('Reporte Excel de coevaluaciones generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte Excel');
        } finally {
            setGenerandoExcel(false);
        }
    };

    // 3. Nuevas funciones para reportes generales
    const handlePrevisualizarCoevaluacionesGenerales = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor selecciona un período');
            return;
        }

        setCargandoGeneral(true);
        setError('');
        setSuccess('');

        try {
            const datos = await reporteCoevaluacionService.previsualizarDatosGenerales(periodoSeleccionado);

            if (datos.length === 0) {
                setError('No se encontraron asignaciones de coevaluación para el período seleccionado');
                setDatosGenerales([]);
                setMostrarPreviewGeneral(false);
                return;
            }

            setDatosGenerales(datos);
            setMostrarPreviewGeneral(true);
            setSuccess(`Se encontraron ${datos.length} asignaciones de coevaluación generales para previsualizar`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener datos de previsualización general');
            setDatosGenerales([]);
            setMostrarPreviewGeneral(false);
        } finally {
            setCargandoGeneral(false);
        }
    };

    const handleGenerarReporteCoevaluacionGeneralPDF = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor selecciona un período');
            return;
        }

        setGenerandoPDFGeneral(true);
        setError('');
        setSuccess('');

        try {
            await reporteCoevaluacionService.generarReporteGeneralPDF(periodoSeleccionado);
            setSuccess('Reporte PDF general de coevaluaciones generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte PDF general');
        } finally {
            setGenerandoPDFGeneral(false);
        }
    };

    const handleGenerarReporteCoevaluacionGeneralExcel = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor selecciona un período');
            return;
        }

        setGenerandoExcelGeneral(true);
        setError('');
        setSuccess('');

        try {
            await reporteCoevaluacionService.generarReporteExcelGeneral(periodoSeleccionado);
            setSuccess('Reporte Excel general de coevaluaciones generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte Excel general');
        } finally {
            setGenerandoExcelGeneral(false);
        }
    };

    const handleGenerarReportePromediosTodasPDF = async () => {
        if (!periodoSeleccionado) {
            setError('Por favor selecciona un período');
            return;
        }
        setGenerandoPDFPromediosTodas(true);
        setError('');
        setSuccess('');
        try {
            await generarReporteCalificacionTodasCarrerasPDF(periodoSeleccionado);
            setSuccess('Reporte PDF de promedios de todas las carreras generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte PDF de todas las carreras');
        } finally {
            setGenerandoPDFPromediosTodas(false);
        }
    };

    // Nueva función para previsualizar promedios por ítems
    const handlePrevisualizarPromediosItems = async () => {
        if (!periodoSeleccionado || !tipoEvaluacionSeleccionado) {
            setError('Por favor selecciona un período y tipo de evaluación');
            return;
        }

        setCargandoPromediosItems(true);
        setError('');
        setSuccess('');

        try {
            const datos = await obtenerPromedioItemsPorTipo(periodoSeleccionado, tipoEvaluacionSeleccionado);
            setDatosPromediosItems(datos);
            setMostrarPreviewPromediosItems(true);
            setSuccess('Datos de promedios por ítems cargados exitosamente');
        } catch (err) {
            console.error('Error al obtener promedios por ítems:', err);
            setError(err instanceof Error ? err.message : 'Error al obtener datos de promedios por ítems');
            setDatosPromediosItems(null);
            setMostrarPreviewPromediosItems(false);
        } finally {
            setCargandoPromediosItems(false);
        }
    };

    // Nueva función para generar reporte PDF de promedios por ítems
    const handleGenerarReportePromediosItemsPDF = async () => {
        if (!periodoSeleccionado || !tipoEvaluacionSeleccionado) {
            setError('Por favor selecciona un período y tipo de evaluación');
            return;
        }

        setGenerandoPDFPromediosItems(true);
        setError('');
        setSuccess('');

        try {
            await descargarReportePDFPromedioItems({
                idPeriodo: periodoSeleccionado,
                tipoEvaluacion: tipoEvaluacionSeleccionado
            });
            setSuccess('Reporte PDF de promedios por ítems generado y descargado exitosamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al generar el reporte PDF de promedios por ítems');
        } finally {
            setGenerandoPDFPromediosItems(false);
        }
    };

    // Opciones para el tipo de evaluación
    const opcionesTipoEvaluacion = [
        { value: 1, label: 'Autoevaluación' },
        { value: 2, label: 'Heteroevaluación' },
        { value: 3, label: 'Coevaluación' }
    ] as const;

    const opcionesCarreras = carreras.map((carrera) => ({
        value: carrera.id_carrera,
        label: carrera.nombre_carrera,
    }));

    const opcionesPeriodos = periodos.map((periodo) => ({
        value: periodo.id_periodo,
        label: periodo.descripcion,
    }));

    const renderEstadisticasCoevaluacion = () => {
        if (!estadisticasCoevaluacion) return null;

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-[#189cbf]/10 p-4 rounded-lg text-center border border-[#189cbf]/20 shadow-sm">
                    <FileText className="h-8 w-8 text-[#189cbf] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#189cbf]">{estadisticasCoevaluacion.totalAsignaciones}</div>
                    <div className="text-sm text-gray-600">Asignaciones</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100 shadow-sm">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{estadisticasCoevaluacion.evaluadoresUnicos}</div>
                    <div className="text-sm text-gray-600">Evaluadores</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100 shadow-sm">
                    <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{estadisticasCoevaluacion.evaluadosUnicos}</div>
                    <div className="text-sm text-gray-600">Evaluados</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100 shadow-sm">
                    <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{estadisticasCoevaluacion.asignaturasUnicas}</div>
                    <div className="text-sm text-gray-600">Asignaturas</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100 shadow-sm">
                    <Building className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{estadisticasCoevaluacion.carrerasUnicas}</div>
                    <div className="text-sm text-gray-600">Carreras</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100 shadow-sm">
                    <GraduationCap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-indigo-600">{estadisticasCoevaluacion.nivelesUnicos}</div>
                    <div className="text-sm text-gray-600">Niveles</div>
                </div>
            </div>
        );
    };

    // Función para mostrar toast
    const showToast = (message: string, type: 'warning' | 'error' | 'success' = 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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

    // Mueve el loading aquí, justo antes del return principal:
    if (cargandoDatos) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#189cbf]"></span>
            </div>
        );
    }

    return (
        <div className="py-5 space-y-6">
            {/* Encabezado con botón de información */}
            <div className="flex items-center justify-between mb-6" data-aos="fade-down" data-aos-duration="600">
                <h1 className="text-xl text-gray-800 font-medium">Reportes Administrativos</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMostrarInfo(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                        title="Información sobre reportes"
                    >
                        <Info className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Información</span>
                    </button>
                </div>
            </div>

            {/* Modal de información */}
            {mostrarInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm"
                        aria-hidden="true"
                        onClick={() => setMostrarInfo(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-aos="zoom-in" data-aos-duration="300">
                        <div className="p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-[#189cbf]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Información sobre los Reportes Administrativos
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
                                    Esta página permite a los administradores generar, visualizar y descargar reportes detallados sobre las evaluaciones docentes y coevaluaciones realizadas en la institución. Utiliza los filtros de carrera y período para personalizar los reportes según tus necesidades.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <FileText className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">Reporte de Resultados</h4>
                                            <p className="text-blue-800 text-sm">
                                                Genera un oficio en formato Word con los resultados ponderados de las evaluaciones docentes para la carrera y período seleccionados. Es ideal para documentación oficial y presentaciones institucionales.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <Users className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 mb-1">Reportes de Coevaluaciones</h4>
                                            <p className="text-green-800 text-sm">
                                                Permite visualizar y descargar reportes detallados de las coevaluaciones entre docentes. Puedes generar reportes por carrera o un reporte general de todas las carreras para el período seleccionado, en formatos PDF y Excel.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <BarChart className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900 mb-1">Reporte de Promedios</h4>
                                            <p className="text-purple-800 text-sm">
                                                Genera reportes de promedios ponderados de los docentes, tanto para una carrera específica como para todas las carreras, considerando los diferentes tipos de evaluación (autoevaluación, heteroevaluación, coevaluación y autoridades).
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                        <LineChart className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900 mb-1">Reporte de Análisis Detallado</h4>
                                            <p className="text-amber-800 text-sm">
                                                Permite analizar el desempeño por cada ítem evaluativo, agrupando los resultados por tipo de pregunta (actitudinal, conceptual, procedimental) y mostrando estadísticas como promedios y desviaciones estándar.
                                            </p>
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

            {/* Formulario de selección */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200" data-aos="fade-up" data-aos-duration="700">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="flex items-center text-xl font-semibold text-gray-900">
                        <Settings className="h-6 w-6 mr-2 text-[#189cbf]" />
                        Preferencias
                    </h2>
                </div>
                <div className="p-6">
                    <div className="space-y-4" data-aos="fade-up" data-aos-delay="200" data-aos-duration="600">
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full items-stretch md:items-end">
                            <div className="w-full md:flex-1">
                                {/* Selector de Período */}
                                <label htmlFor="periodoSelect" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-green-600" />
                                        Seleccionar Período
                                    </div>
                                </label>
                                <Select
                                    inputId="periodoSelect"
                                    options={opcionesPeriodos}
                                    value={opcionesPeriodos.find(opt => opt.value === periodoSeleccionado)}
                                    onChange={selected => setPeriodoSeleccionado(selected ? selected.value : null)}
                                    placeholder="Selecciona un período"
                                    isSearchable
                                    isClearable={false}
                                    styles={customStyles}
                                    isDisabled={cargando}
                                    noOptionsMessage={() => "No hay períodos disponibles"}
                                    menuPortalTarget={document.body}
                                    classNamePrefix="react-select"
                                    className="w-full text-left"
                                />
                            </div>
                            <div className="w-full md:flex-1">
                                {/* Selector de Carrera */}
                                <label htmlFor="carreraSelect" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-[#189cbf]" />
                                        Seleccionar Carrera
                                    </div>
                                </label>
                                <Select
                                    inputId="carreraSelect"
                                    options={opcionesCarreras}
                                    value={opcionesCarreras.find(opt => opt.value === carreraSeleccionada)}
                                    onChange={selected => setCarreraSeleccionada(selected ? selected.value : null)}
                                    placeholder="Selecciona una carrera"
                                    isSearchable
                                    isClearable={false}
                                    styles={customStyles}
                                    isDisabled={cargando || cargandoCarreras}
                                    noOptionsMessage={() => cargandoCarreras ? (
                                        <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#189cbf]"></span> Cargando...</span>
                                    ) : "No hay carreras disponibles"}
                                    menuPortalTarget={document.body}
                                    classNamePrefix="react-select"
                                    className="w-full text-left"
                                />
                            </div>
                            <button
                                onClick={() => setMostrarModalFirmas(true)}
                                className="w-full md:w-auto text-left md:text-center justify-start md:justify-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md shadow-sm transition-colors font-medium flex items-center gap-2"
                                title="Configurar firmas de reportes"
                                type="button"
                            >
                                <Settings className="h-5 w-5 mr-1" />
                                Configurar Firma
                            </button>
                        </div>
                        {/* Alertas aquí, después de los botones de acción */}
                        {error && (
                            <div className="mb-0 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3" data-aos="fade-in" data-aos-duration="400">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <span className="text-sm text-red-800 flex-1">{error}</span>
                                <button
                                    onClick={() => setError('')}
                                    className="text-red-600 hover:text-red-800 text-lg font-medium"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {success && (
                            <div className="mb-0 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-3" data-aos="fade-in" data-aos-duration="400">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm text-green-800 flex-1">{success}</span>
                                <button
                                    onClick={() => setSuccess('')}
                                    className="text-green-600 hover:text-green-800 text-lg font-medium"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {info && (
                            <div className="mb-0 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3" data-aos="fade-in" data-aos-duration="400">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <span className="text-sm text-blue-800 flex-1">{info}</span>
                                <button
                                    onClick={() => setInfo('')}
                                    className="text-blue-600 hover:text-blue-800 text-lg font-medium"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {/* Fin alertas */}
                    </div>
                </div>
            </div>

            {/* Tabs para alternar entre tipos de reporte */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200" data-aos="fade-up" data-aos-duration="700">
                <div className="border-b border-gray-200">
                    {/* Navegación de tabs responsiva */}
                    <nav className="flex flex-col md:flex-row gap-2 md:gap-0 w-full md:space-x-8 md:px-6 md:overflow-x-auto">
                        <button
                            onClick={() => setTabActiva('oficioResultados')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${tabActiva === 'oficioResultados'
                                ? 'border-[#189cbf] text-[#189cbf]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Resultados
                            </div>
                        </button>

                        <button
                            onClick={() => setTabActiva('coevaluaciones')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${tabActiva === 'coevaluaciones'
                                ? 'border-[#189cbf] text-[#189cbf]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Coevaluaciones
                            </div>
                        </button>

                        <button
                            onClick={() => setTabActiva('promedios')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${tabActiva === 'promedios'
                                ? 'border-[#189cbf] text-[#189cbf]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <BarChart className="h-4 w-4" />
                                Promedios
                            </div>
                        </button>

                        <button
                            onClick={() => setTabActiva('analisisDetallado')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${tabActiva === 'analisisDetallado'
                                ? 'border-[#189cbf] text-[#189cbf]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <LineChart className="h-4 w-4" />
                                Análisis Detallado
                            </div>
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {tabActiva === 'oficioResultados' ? (
                        /* Contenido para oficio de resultados */
                        <div className="space-y-4" data-aos="fade-up" data-aos-delay="100">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="h-6 w-6 text-[#189cbf]" />
                                <h3 className="text-lg font-semibold text-gray-800">Reporte de Resultados</h3>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Genera un oficio completo en formato Word (.docx) con los resultados de las evaluaciones
                                de los docentes para la carrera y período seleccionados.
                            </p>

                            <button
                                onClick={() => {
                                    if (!carreraSeleccionada || !periodoSeleccionado) {
                                        showToast('Debes seleccionar una carrera y un período antes de continuar.', 'warning');
                                        return;
                                    }
                                    handleGenerarReporte();
                                }}
                                disabled={cargando}
                                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#189cbf] border border-transparent rounded-md shadow-sm hover:bg-[#147a99] focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                                tabIndex={0}
                            >
                                {cargando ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                {cargando ? 'Generando oficio...' : 'Generar Oficio Word'}
                            </button>

                            {/* Modal de configuración de oficio */}
                            <ModalConfiguracionOficio
                                isOpen={mostrarModalOficio}
                                onClose={() => setMostrarModalOficio(false)}
                                onConfirm={(numeroInicio) => {
                                    setMostrarModalOficio(false);
                                    handleGenerarReporte(numeroInicio);
                                }}
                            />
                        </div>
                    ) : tabActiva === 'coevaluaciones' ? (
                        /* Contenido combinado para coevaluaciones */
                        <div className="space-y-6" data-aos="fade-up" data-aos-delay="100">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="h-6 w-6 text-[#189cbf]" />
                                <h3 className="text-lg font-semibold text-gray-800">Reportes de Coevaluaciones</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Panel de Coevaluaciones por Carrera */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Por Carrera</h4>
                                    <p className="text-gray-600 mb-4">
                                        Genera reportes de las asignaciones de coevaluaciones para una carrera específica.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                if (!carreraSeleccionada || !periodoSeleccionado) {
                                                    showToast('Debes seleccionar una carrera y un período antes de continuar.');
                                                    return;
                                                }
                                                handlePrevisualizarCoevaluaciones();
                                                setPreviewActivo('carrera');
                                            }}
                                            disabled={cargandoCoevaluacion}
                                            className={`${botonClase} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf] disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {cargandoCoevaluacion ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Eye className="h-4 w-4 mr-2" />
                                            )}
                                            Previsualizar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!carreraSeleccionada || !periodoSeleccionado) {
                                                    showToast('Debes seleccionar una carrera y un período antes de continuar.');
                                                    return;
                                                }
                                                handleGenerarReporteCoevaluacionPDF();
                                            }}
                                            disabled={generandoPDF}
                                            className={`${botonClase} text-white bg-[#189cbf] border border-transparent hover:bg-[#147a99] focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2 disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {generandoPDF ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4 mr-2" />
                                            )}
                                            Generar PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!carreraSeleccionada || !periodoSeleccionado) {
                                                    showToast('Debes seleccionar una carrera y un período antes de continuar.');
                                                    return;
                                                }
                                                handleGenerarReporteCoevaluacionExcel();
                                            }}
                                            disabled={generandoExcel}
                                            className={`${botonClase} text-white bg-green-600 border border-transparent hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {generandoExcel ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            )}
                                            Generar Excel
                                        </button>
                                    </div>
                                </div>

                                {/* Panel de Coevaluaciones General */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">General</h4>
                                    <p className="text-gray-600 mb-4">
                                        Genera reportes de las asignaciones de coevaluaciones para todas las carreras.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                if (!periodoSeleccionado) {
                                                    showToast('Debes seleccionar un período antes de continuar.');
                                                    return;
                                                }
                                                handlePrevisualizarCoevaluacionesGenerales();
                                                setPreviewActivo('general');
                                            }}
                                            disabled={cargandoGeneral}
                                            className={`${botonClase} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf] disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {cargandoGeneral ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Eye className="h-4 w-4 mr-2" />
                                            )}
                                            Previsualizar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!periodoSeleccionado) {
                                                    showToast('Debes seleccionar un período antes de continuar.');
                                                    return;
                                                }
                                                handleGenerarReporteCoevaluacionGeneralPDF();
                                            }}
                                            disabled={generandoPDFGeneral}
                                            className={`${botonClase} text-white bg-[#189cbf] border border-transparent hover:bg-[#147a99] focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2 disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {generandoPDFGeneral ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4 mr-2" />
                                            )}
                                            Generar PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!periodoSeleccionado) {
                                                    showToast('Debes seleccionar un período antes de continuar.');
                                                    return;
                                                }
                                                handleGenerarReporteCoevaluacionGeneralExcel();
                                            }}
                                            disabled={generandoExcelGeneral}
                                            className={`${botonClase} text-white bg-green-600 border border-transparent hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {generandoExcelGeneral ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            )}
                                            Generar Excel
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas y previsualización: mostrar solo la activa */}
                            {previewActivo === 'carrera' && renderEstadisticasCoevaluacion()}
                            {previewActivo === 'carrera' && mostrarPreviewCoevaluacion && (
                                <div className="mt-6" data-aos="fade-up" data-aos-delay="400">
                                    {/* Mobile cards */}
                                    <div className="block sm:hidden space-y-3">
                                        {(() => {
                                            const datosAgrupados = datosCoevaluacion.reduce((acc, asignacion) => {
                                                const carreraNombre = asignacion.carrera?.nombre || 'Sin carrera';
                                                const nivelNombre = asignacion.nivel?.nombre || 'Sin nivel';
                                                if (!acc[carreraNombre]) acc[carreraNombre] = {};
                                                if (!acc[carreraNombre][nivelNombre]) acc[carreraNombre][nivelNombre] = [];
                                                acc[carreraNombre][nivelNombre].push(asignacion);
                                                return acc;
                                            }, {} as { [key: string]: { [key: string]: typeof datosCoevaluacion } });
                                            return (
                                                <>
                                                    {Object.entries(datosAgrupados).map(([carrera, niveles]) => (
                                                        <div key={carrera} className="mb-4">
                                                            <div className="text-base font-bold text-[#189cbf] mb-2 flex items-center"><Building className="w-4 h-4 mr-2" />{carrera}</div>
                                                            {Object.entries(niveles).map(([nivel, nivelAsignaciones]) => (
                                                                <div key={nivel} className="mb-2">
                                                                    <div className="text-sm font-semibold text-green-700 mb-1 flex items-center"><GraduationCap className="w-4 h-4 mr-2" />{nivel}</div>
                                                                    {nivelAsignaciones.map((asignacion: AsignacionCoevaluacion, index: number) => (
                                                                        <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm mb-2">
                                                                            <div className="font-semibold text-xs text-gray-700 mb-1 flex items-center gap-2">
                                                                                <BookOpen className="w-4 h-4 text-[#189cbf]" />
                                                                                {asignacion.nombre_asignatura || '—'}
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                                                <span className="flex items-center gap-1">
                                                                                    <User className="w-3 h-3 text-gray-400" />
                                                                                    {capitalizarNombreCompleto(asignacion.nombre_evaluador) || '—'}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <User className="w-3 h-3 text-gray-400" />
                                                                                    {capitalizarNombreCompleto(asignacion.nombre_evaluado) || '—'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                                                <span className="flex items-center gap-1">
                                                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                                                    {formatearFecha(asignacion.fecha)}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                                                    {formatearHora(asignacion.hora_inicio)} - {formatearHora(asignacion.hora_fin)}
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
                                                            ))}
                                                        </div>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    {/* Desktop table */}
                                    <div className="hidden sm:block">
                                        <div className="space-y-6">
                                            {(() => {
                                                const datosAgrupados = datosCoevaluacion.reduce((acc, asignacion) => {
                                                    const carreraNombre = asignacion.carrera?.nombre || 'Sin carrera';
                                                    const nivelNombre = asignacion.nivel?.nombre || 'Sin nivel';
                                                    if (!acc[carreraNombre]) acc[carreraNombre] = {};
                                                    if (!acc[carreraNombre][nivelNombre]) acc[carreraNombre][nivelNombre] = [];
                                                    acc[carreraNombre][nivelNombre].push(asignacion);
                                                    return acc;
                                                }, {} as { [key: string]: { [key: string]: typeof datosCoevaluacion } });
                                                return (
                                                    <>
                                                        {Object.entries(datosAgrupados).map(([carrera, niveles]) => (
                                                            <div key={carrera} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm mb-6">
                                                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                                    <Building className="h-5 w-5 mr-2 text-[#189cbf]" />
                                                                    {carrera}
                                                                </h3>
                                                                {Object.entries(niveles).map(([nivel, nivelAsignaciones]) => (
                                                                    <div key={`${carrera}-${nivel}`} className="mb-6" data-aos="fade-left" data-aos-delay={100}>
                                                                        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                                                                            <GraduationCap className="h-4 w-4 mr-2 text-green-600" />
                                                                            {nivel}
                                                                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                                                                                {nivelAsignaciones.length} asignaciones
                                                                            </span>
                                                                        </h4>
                                                                        <div className="overflow-x-auto">
                                                                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                                                                <thead className="bg-gray-50">
                                                                                    <tr>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Asignatura</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Docente Evaluador</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Docente Evaluado</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Fecha</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Horario</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Día</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-200">
                                                                                    {nivelAsignaciones.map((asignacion: AsignacionCoevaluacion, index: number) => (
                                                                                        <tr key={`${asignacion.id_asignacion}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                                                                                            <td className="px-4 py-4 text-xs text-gray-900">{asignacion.nombre_asignatura || '—'}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900">{capitalizarNombreCompleto(asignacion.nombre_evaluador) || '—'}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900">{capitalizarNombreCompleto(asignacion.nombre_evaluado) || '—'}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900 flex items-center"><Calendar className="h-4 w-4 mr-1 text-gray-400" />{formatearFecha(asignacion.fecha)}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900"><div className="flex items-center"><Clock className="h-4 w-4 mr-1 text-gray-400" />{formatearHora(asignacion.hora_inicio)} - {formatearHora(asignacion.hora_fin)}</div></td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900"><span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full border border-gray-300">{asignacion.dia || '—'}</span></td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {previewActivo === 'general' && mostrarPreviewGeneral && datosGenerales.length > 0 && (
                                <div className="mt-6" data-aos="fade-up" data-aos-delay="300">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-gray-800">Previsualización General</h4>
                                        <button
                                            onClick={() => setMostrarPreviewGeneral(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    {/* Métricas generales con el mismo diseño que por carrera */}
                                    {(() => {
                                        const stats = obtenerEstadisticasReporte(datosGenerales);
                                        return (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 w-full">
                                                <div className="bg-[#189cbf]/10 p-4 rounded-lg text-center border border-[#189cbf]/20 shadow-sm flex flex-col items-center">
                                                    <FileText className="h-8 w-8 text-[#189cbf] mb-2" />
                                                    <div className="text-2xl font-bold text-[#189cbf]">{stats.totalAsignaciones}</div>
                                                    <div className="text-sm text-gray-600">Asignaciones</div>
                                                </div>
                                                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100 shadow-sm flex flex-col items-center">
                                                    <Users className="h-8 w-8 text-green-600 mb-2" />
                                                    <div className="text-2xl font-bold text-green-600">{stats.evaluadoresUnicos}</div>
                                                    <div className="text-sm text-gray-600">Evaluadores</div>
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100 shadow-sm flex flex-col items-center">
                                                    <User className="h-8 w-8 text-purple-600 mb-2" />
                                                    <div className="text-2xl font-bold text-purple-600">{stats.evaluadosUnicos}</div>
                                                    <div className="text-sm text-gray-600">Evaluados</div>
                                                </div>
                                                <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100 shadow-sm flex flex-col items-center">
                                                    <BookOpen className="h-8 w-8 text-orange-600 mb-2" />
                                                    <div className="text-2xl font-bold text-orange-600">{stats.asignaturasUnicas}</div>
                                                    <div className="text-sm text-gray-600">Asignaturas</div>
                                                </div>
                                                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100 shadow-sm flex flex-col items-center">
                                                    <Building className="h-8 w-8 text-red-600 mb-2" />
                                                    <div className="text-2xl font-bold text-red-600">{stats.carrerasUnicas}</div>
                                                    <div className="text-sm text-gray-600">Carreras</div>
                                                </div>
                                                <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100 shadow-sm flex flex-col items-center">
                                                    <GraduationCap className="h-8 w-8 text-indigo-600 mb-2" />
                                                    <div className="text-2xl font-bold text-indigo-600">{stats.nivelesUnicos}</div>
                                                    <div className="text-sm text-gray-600">Niveles</div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {/* Agrupación por carrera y nivel con tablas de detalle */}
                                    <div className="block sm:hidden space-y-3">
                                        {(() => {
                                            const datosAgrupados = datosGenerales.reduce((acc, asignacion) => {
                                                const carreraNombre = asignacion.carrera?.nombre || 'Sin carrera';
                                                const nivelNombre = asignacion.nivel?.nombre || 'Sin nivel';
                                                if (!acc[carreraNombre]) acc[carreraNombre] = {};
                                                if (!acc[carreraNombre][nivelNombre]) acc[carreraNombre][nivelNombre] = [];
                                                acc[carreraNombre][nivelNombre].push(asignacion);
                                                return acc;
                                            }, {} as { [key: string]: { [key: string]: typeof datosGenerales } });
                                            return (
                                                <>
                                                    {Object.entries(datosAgrupados).map(([carrera, niveles]) => (
                                                        <div key={carrera} className="mb-4">
                                                            <div className="text-base font-bold text-[#189cbf] mb-2 flex items-center"><Building className="w-4 h-4 mr-2" />{carrera}</div>
                                                            {Object.entries(niveles).map(([nivel, nivelAsignaciones]) => (
                                                                <div key={nivel} className="mb-2">
                                                                    <div className="text-sm font-semibold text-green-700 mb-1 flex items-center"><GraduationCap className="w-4 h-4 mr-2" />{nivel}</div>
                                                                    {nivelAsignaciones.map((asignacion: AsignacionCoevaluacion, index: number) => (
                                                                        <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm mb-2">
                                                                            <div className="font-semibold text-xs text-gray-700 mb-1 flex items-center gap-2">
                                                                                <BookOpen className="w-4 h-4 text-[#189cbf]" />
                                                                                {asignacion.nombre_asignatura || '—'}
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                                                <span className="flex items-center gap-1">
                                                                                    <User className="w-3 h-3 text-gray-400" />
                                                                                    {capitalizarNombreCompleto(asignacion.nombre_evaluador) || '—'}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <User className="w-3 h-3 text-gray-400" />
                                                                                    {capitalizarNombreCompleto(asignacion.nombre_evaluado) || '—'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                                                <span className="flex items-center gap-1">
                                                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                                                    {formatearFecha(asignacion.fecha)}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                                                    {formatearHora(asignacion.hora_inicio)} - {formatearHora(asignacion.hora_fin)}
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
                                                            ))}
                                                        </div>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="space-y-6">
                                            {(() => {
                                                const datosAgrupados = datosGenerales.reduce((acc, asignacion) => {
                                                    const carreraNombre = asignacion.carrera?.nombre || 'Sin carrera';
                                                    const nivelNombre = asignacion.nivel?.nombre || 'Sin nivel';
                                                    if (!acc[carreraNombre]) acc[carreraNombre] = {};
                                                    if (!acc[carreraNombre][nivelNombre]) acc[carreraNombre][nivelNombre] = [];
                                                    acc[carreraNombre][nivelNombre].push(asignacion);
                                                    return acc;
                                                }, {} as { [key: string]: { [key: string]: typeof datosGenerales } });
                                                return (
                                                    <>
                                                        {Object.entries(datosAgrupados).map(([carrera, niveles]) => (
                                                            <div key={carrera} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm mb-6">
                                                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                                    <Building className="h-5 w-5 mr-2 text-[#189cbf]" />
                                                                    {carrera}
                                                                </h3>
                                                                {Object.entries(niveles).map(([nivel, nivelAsignaciones]) => (
                                                                    <div key={`${carrera}-${nivel}`} className="mb-6" data-aos="fade-left" data-aos-delay={100}>
                                                                        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                                                                            <GraduationCap className="h-4 w-4 mr-2 text-green-600" />
                                                                            {nivel}
                                                                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                                                                                {nivelAsignaciones.length} asignaciones
                                                                            </span>
                                                                        </h4>
                                                                        <div className="overflow-x-auto">
                                                                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                                                                <thead className="bg-gray-50">
                                                                                    <tr>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Asignatura</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Docente Evaluador</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Docente Evaluado</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Fecha</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Horario</th>
                                                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Día</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-200">
                                                                                    {nivelAsignaciones.map((asignacion: AsignacionCoevaluacion, index: number) => (
                                                                                        <tr key={`${asignacion.id_asignacion}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                                                                                            <td className="px-4 py-4 text-xs text-gray-900">{asignacion.nombre_asignatura || '—'}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900">{capitalizarNombreCompleto(asignacion.nombre_evaluador) || '—'}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900">{capitalizarNombreCompleto(asignacion.nombre_evaluado) || '—'}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900 flex items-center"><Calendar className="h-4 w-4 mr-1 text-gray-400" />{formatearFecha(asignacion.fecha)}</td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900"><div className="flex items-center"><Clock className="h-4 w-4 mr-1 text-gray-400" />{formatearHora(asignacion.hora_inicio)} - {formatearHora(asignacion.hora_fin)}</div></td>
                                                                                            <td className="px-4 py-4 text-xs text-gray-900"><span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full border border-gray-300">{asignacion.dia || '—'}</span></td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : tabActiva === 'promedios' ? (
                        /* Contenido combinado para promedios */
                        <div className="space-y-6" data-aos="fade-up" data-aos-delay="100">
                            <div className="flex items-center gap-3 mb-4">
                                <BarChart className="h-6 w-6 text-[#189cbf]" />
                                <h3 className="text-lg font-semibold text-gray-800">Reporte de Promedios</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Panel de Promedios por Carrera */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Por Carrera</h4>
                                    <p className="text-gray-600 mb-4">
                                        Genera un reporte de promedios para una carrera específica.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                if (!carreraSeleccionada || !periodoSeleccionado) {
                                                    showToast('Debes seleccionar una carrera y un período antes de continuar.');
                                                    return;
                                                }
                                                handlePrevisualizarPromedios();
                                            }}
                                            disabled={cargandoPromedios}
                                            className={`${botonClase} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf] disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {cargandoPromedios ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Eye className="h-4 w-4 mr-2" />
                                            )}
                                            Previsualizar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!carreraSeleccionada || !periodoSeleccionado) {
                                                    showToast('Debes seleccionar una carrera y un período antes de continuar.');
                                                    return;
                                                }
                                                handleGenerarReportePromediosPDF();
                                            }}
                                            disabled={generandoPDFPromedios}
                                            className={`${botonClase} text-white bg-[#189cbf] border border-transparent hover:bg-[#147a99] focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2 disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {generandoPDFPromedios ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4 mr-2" />
                                            )}
                                            Generar PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Panel de Promedios Todas las Carreras */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">General</h4>
                                    <p className="text-gray-600 mb-4">
                                        Genera un reporte de promedios general para todas las carreras.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        {/* NUEVO: Botón de previsualizar */}
                                        <button
                                            onClick={() => {
                                                if (!periodoSeleccionado) {
                                                    showToast('Debes seleccionar un período antes de continuar.');
                                                    return;
                                                }
                                                handlePrevisualizarPromediosTodas();
                                            }}
                                            disabled={cargandoPromediosTodas}
                                            className={`${botonClase} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf] disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {cargandoPromediosTodas ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Eye className="h-4 w-4 mr-2" />
                                            )}
                                            Previsualizar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!periodoSeleccionado) {
                                                    showToast('Debes seleccionar un período antes de continuar.');
                                                    return;
                                                }
                                                handleGenerarReportePromediosTodasPDF();
                                            }}
                                            disabled={generandoPDFPromediosTodas}
                                            className={`${botonClase} text-white bg-[#189cbf] border border-transparent hover:bg-[#147a99] focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2 disabled:cursor-not-allowed`}
                                            tabIndex={0}
                                        >
                                            {generandoPDFPromediosTodas ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4 mr-2" />
                                            )}
                                            Generar PDF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Previsualización de promedios */}
                            {mostrarPreviewPromedios && (
                                <div className="mt-6" data-aos="fade-up" data-aos-delay="400">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-gray-800">Previsualización de Promedios</h4>
                                        <button
                                            onClick={() => setMostrarPreviewPromedios(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    {/* Nombre de la carrera y cantidad de docentes */}
                                    {carreraSeleccionada && (
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 mb-4 rounded-lg">
                                            <GraduationCap className="h-5 w-5 text-[#189cbf]" />
                                            <span className="text-lg font-semibold text-gray-800">{carreras.find(c => c.id_carrera === carreraSeleccionada)?.nombre_carrera || carreraSeleccionada}</span>
                                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">{Array.isArray(datosPromedios) ? datosPromedios.length : 0} docente{Array.isArray(datosPromedios) && datosPromedios.length === 1 ? '' : 's'}</span>
                                        </div>
                                    )}
                                    {/* Mobile cards */}
                                    <div className="block sm:hidden space-y-3">
                                        {Array.isArray(datosPromedios) && datosPromedios.map((docente, index) => (
                                            <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                                <div className="font-semibold text-sm text-[#189cbf] mb-1 flex items-center gap-2">
                                                    <User className="w-4 h-4" /> {capitalizarNombreCompleto(docente.nombre_completo)}
                                                </div>
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <div><span className="font-semibold">Autoevaluación (10%): </span>{docente.autoevaluacion !== undefined ? Number(docente.autoevaluacion).toFixed(2) : 'N/A'}</div>
                                                    <div><span className="font-semibold">Heteroevaluación (40%): </span>{docente.heteroevaluacion !== undefined ? Number(docente.heteroevaluacion).toFixed(2) : 'N/A'}</div>
                                                    <div><span className="font-semibold">Coevaluación (30%): </span>{docente.coevaluacion !== undefined ? Number(docente.coevaluacion).toFixed(2) : 'N/A'}</div>
                                                    <div><span className="font-semibold">Eval. Autoridades (20%): </span>{docente.evaluacion_autoridades !== undefined ? Number(docente.evaluacion_autoridades).toFixed(2) : 'N/A'}</div>
                                                    <div className="font-bold text-[#189cbf]">Total: {docente.promedio_ponderado !== undefined ? Number(docente.promedio_ponderado).toFixed(2) : 'N/A'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Desktop table */}
                                    <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Autoevaluación (10%)</th>
                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Heteroevaluación (40%)</th>
                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Coevaluación (30%)</th>
                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Eval. Autoridades (20%)</th>
                                                        <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {Array.isArray(datosPromedios) && datosPromedios.map((docente, index) => (
                                                        <tr key={index}>
                                                            <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">{capitalizarNombreCompleto(docente.nombre_completo)}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.autoevaluacion !== undefined ? Number(docente.autoevaluacion).toFixed(2) : 'N/A'}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.heteroevaluacion !== undefined ? Number(docente.heteroevaluacion).toFixed(2) : 'N/A'}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.coevaluacion !== undefined ? Number(docente.coevaluacion).toFixed(2) : 'N/A'}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.evaluacion_autoridades !== undefined ? Number(docente.evaluacion_autoridades).toFixed(2) : 'N/A'}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-xs font-bold text-gray-900">{docente.promedio_ponderado !== undefined ? Number(docente.promedio_ponderado).toFixed(2) : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                            )}
                            {/* NUEVO: Previsualización de promedios generales (todas las carreras) agrupados por carrera */}
                            {mostrarPreviewPromediosTodas && datosPromediosTodas && (
                                <div className="mt-6" data-aos="fade-up" data-aos-delay="400">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-gray-800">Previsualización de Promedios - Todas las Carreras</h4>
                                        <button
                                            onClick={() => setMostrarPreviewPromediosTodas(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-8">
                                        {/* Mobile cards agrupadas por carrera */}
                                        <div className="block sm:hidden space-y-6">
                                            {Object.entries(datosPromediosTodas).map(([nombreCarrera, carrera]: any) => (
                                                <div key={nombreCarrera} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                                        <GraduationCap className="h-5 w-5 text-[#189cbf]" />
                                                        <span className="text-lg font-semibold text-gray-800">{nombreCarrera}</span>
                                                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">{carrera.docentes.length} docentes</span>
                                                    </div>
                                                    <div className="p-3 space-y-2">
                                                        {Array.isArray(carrera.docentes) && carrera.docentes.map((docente: any, index: number) => (
                                                            <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                                                <div className="font-semibold text-sm text-[#189cbf] mb-1 flex items-center gap-2">
                                                                    <User className="w-4 h-4" /> {capitalizarNombreCompleto(docente.nombre_completo)}
                                                                </div>
                                                                <div className="flex flex-col gap-1 text-xs">
                                                                    <div><span className="font-semibold">Autoevaluación (10%): </span>{docente.autoevaluacion !== undefined ? Number(docente.autoevaluacion).toFixed(2) : 'N/A'}</div>
                                                                    <div><span className="font-semibold">Heteroevaluación (40%): </span>{docente.heteroevaluacion !== undefined ? Number(docente.heteroevaluacion).toFixed(2) : 'N/A'}</div>
                                                                    <div><span className="font-semibold">Coevaluación (30%): </span>{docente.coevaluacion !== undefined ? Number(docente.coevaluacion).toFixed(2) : 'N/A'}</div>
                                                                    <div><span className="font-semibold">Eval. Autoridades (20%): </span>{docente.evaluacion_autoridades !== undefined ? Number(docente.evaluacion_autoridades).toFixed(2) : 'N/A'}</div>
                                                                    <div className="font-bold text-[#189cbf]">Total: {docente.promedio_ponderado !== undefined ? Number(docente.promedio_ponderado).toFixed(2) : 'N/A'}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Desktop tablas agrupadas por carrera (sin cambios) */}
                                        <div className="hidden sm:block space-y-8">
                                            {Object.entries(datosPromediosTodas).map(([nombreCarrera, carrera]: any) => (
                                                <div key={nombreCarrera} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" data-aos="fade-up" data-aos-delay={100}>
                                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                                        <GraduationCap className="h-5 w-5 text-[#189cbf]" />
                                                        <span className="text-lg font-semibold text-gray-800">{nombreCarrera}</span>
                                                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">{carrera.docentes.length} docentes</span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Autoevaluación (10%)</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Heteroevaluación (40%)</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Coevaluación (30%)</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Eval. Autoridades (20%)</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {Array.isArray(carrera.docentes) && carrera.docentes.map((docente: any, index: number) => (
                                                                    <tr key={index}>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">{capitalizarNombreCompleto(docente.nombre_completo)}</td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.autoevaluacion !== undefined ? Number(docente.autoevaluacion).toFixed(2) : 'N/A'}</td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.heteroevaluacion !== undefined ? Number(docente.heteroevaluacion).toFixed(2) : 'N/A'}</td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.coevaluacion !== undefined ? Number(docente.coevaluacion).toFixed(2) : 'N/A'}</td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{docente.evaluacion_autoridades !== undefined ? Number(docente.evaluacion_autoridades).toFixed(2) : 'N/A'}</td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-xs font-bold text-gray-900">{docente.promedio_ponderado !== undefined ? Number(docente.promedio_ponderado).toFixed(2) : 'N/A'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : tabActiva === 'analisisDetallado' ? (
                        /* Contenido para análisis detallado */
                        <div className="space-y-6" data-aos="fade-up" data-aos-delay="100">
                            <div className="flex items-center gap-3 mb-4">
                                <LineChart className="h-6 w-6 text-[#189cbf]" />
                                <h3 className="text-lg font-semibold text-gray-800">Reporte de Análisis Detallado por Ítems</h3>
                            </div>

                            <p className="text-gray-600">
                                Analiza el desempeño detallado por cada ítem evaluativo, agrupado por tipo (actitudinal, conceptual, procedimental).
                            </p>

                            <div className="flex-1 mb-4">
                                <label htmlFor="tipoEvaluacionSelect" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-[#189cbf]" />
                                        Seleccionar Tipo de Evaluación
                                    </div>
                                </label>
                                <Select
                                    inputId="tipoEvaluacionSelect"
                                    options={opcionesTipoEvaluacion}
                                    value={opcionesTipoEvaluacion.find(opt => opt.value === tipoEvaluacionSeleccionado)}
                                    onChange={selected => setTipoEvaluacionSeleccionado(selected ? selected.value : null)}
                                    placeholder="Selecciona un tipo de evaluación"
                                    isSearchable={false}
                                    isClearable={false}
                                    styles={customStyles}
                                    isDisabled={cargandoPromediosItems}
                                    menuPortalTarget={document.body}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        if (!periodoSeleccionado || !tipoEvaluacionSeleccionado) {
                                            showToast('Debes seleccionar un período y tipo de evaluación antes de continuar.');
                                            return;
                                        }
                                        handlePrevisualizarPromediosItems();
                                    }}
                                    disabled={cargandoPromediosItems}
                                    className={`${botonClase} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf] disabled:cursor-not-allowed`}
                                    tabIndex={0}
                                >
                                    {cargandoPromediosItems ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Eye className="h-4 w-4 mr-2" />
                                    )}
                                    Previsualizar Análisis
                                </button>

                                <button
                                    onClick={() => {
                                        if (!periodoSeleccionado || !tipoEvaluacionSeleccionado) {
                                            showToast('Debes seleccionar un período y tipo de evaluación antes de continuar.');
                                            return;
                                        }
                                        handleGenerarReportePromediosItemsPDF();
                                    }}
                                    disabled={generandoPDFPromediosItems}
                                    className={`${botonClase} text-white bg-[#189cbf] border border-transparent hover:bg-[#147a99] focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2 disabled:cursor-not-allowed`}
                                    tabIndex={0}
                                >
                                    {generandoPDFPromediosItems ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <FileText className="h-4 w-4 mr-2" />
                                    )}
                                    Generar Reporte PDF
                                </button>
                            </div>

                            {/* Mantener la previsualización existente */}
                            {mostrarPreviewPromediosItems && datosPromediosItems && (
                                <div className="mt-6" data-aos="fade-up" data-aos-delay="400">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-gray-800">
                                            Previsualización de Promedios por Ítems - {datosPromediosItems.estadisticas_generales.tipo_evaluacion}
                                        </h4>
                                        <button
                                            onClick={() => setMostrarPreviewPromediosItems(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    {/* Estadísticas generales */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <h5 className="text-sm font-medium text-gray-500 mb-2">Total Preguntas</h5>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {datosPromediosItems.estadisticas_generales.total_preguntas}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <h5 className="text-sm font-medium text-gray-500 mb-2">Promedio General</h5>
                                            <p className="text-2xl font-bold text-[#189cbf]">
                                                {datosPromediosItems.estadisticas_generales.promedio_general}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <h5 className="text-sm font-medium text-gray-500 mb-2">Tipo Evaluación</h5>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {datosPromediosItems.estadisticas_generales.tipo_evaluacion}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Promedios por tipo - Mobile cards */}
                                    <div className="block sm:hidden space-y-6">
                                        {/* Actitudinal */}
                                        {datosPromediosItems.promedios_por_tipo.actitudinal && datosPromediosItems.promedios_por_tipo.actitudinal.length > 0 && (
                                            <div>
                                                <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                                                    <h5 className="text-lg font-semibold text-blue-900">Preguntas Actitudinales</h5>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {datosPromediosItems.promedios_por_tipo.actitudinal.map((pregunta, index) => (
                                                        <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                                            <div className="font-semibold text-xs text-gray-700 mb-1">{pregunta.texto_pregunta}</div>
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                <div><span className="font-semibold">Promedio: </span><span className="text-[#189cbf]">{pregunta.promedio}</span></div>
                                                                <div><span className="font-semibold">Total Respuestas: </span>{pregunta.total_respuestas}</div>
                                                                <div><span className="font-semibold">Desviación Estándar: </span>{pregunta.desviacion_estandar}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Conceptual */}
                                        {datosPromediosItems.promedios_por_tipo.conceptual && datosPromediosItems.promedios_por_tipo.conceptual.length > 0 && (
                                            <div>
                                                <div className="bg-green-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                                                    <h5 className="text-lg font-semibold text-green-900">Preguntas Conceptuales</h5>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {datosPromediosItems.promedios_por_tipo.conceptual.map((pregunta, index) => (
                                                        <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                                            <div className="font-semibold text-xs text-gray-700 mb-1">{pregunta.texto_pregunta}</div>
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                <div><span className="font-semibold">Promedio: </span><span className="text-[#189cbf]">{pregunta.promedio}</span></div>
                                                                <div><span className="font-semibold">Total Respuestas: </span>{pregunta.total_respuestas}</div>
                                                                <div><span className="font-semibold">Desviación Estándar: </span>{pregunta.desviacion_estandar}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Procedimental */}
                                        {datosPromediosItems.promedios_por_tipo.procedimental && datosPromediosItems.promedios_por_tipo.procedimental.length > 0 && (
                                            <div>
                                                <div className="bg-purple-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                                                    <h5 className="text-lg font-semibold text-purple-900">Preguntas Procedimentales</h5>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {datosPromediosItems.promedios_por_tipo.procedimental.map((pregunta, index) => (
                                                        <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                                            <div className="font-semibold text-xs text-gray-700 mb-1">{pregunta.texto_pregunta}</div>
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                <div><span className="font-semibold">Promedio: </span><span className="text-[#189cbf]">{pregunta.promedio}</span></div>
                                                                <div><span className="font-semibold">Total Respuestas: </span>{pregunta.total_respuestas}</div>
                                                                <div><span className="font-semibold">Desviación Estándar: </span>{pregunta.desviacion_estandar}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Desktop tablas por tipo (sin cambios) */}
                                    <div className="hidden sm:block space-y-6">
                                        {/* Actitudinal */}
                                        {datosPromediosItems.promedios_por_tipo.actitudinal && datosPromediosItems.promedios_por_tipo.actitudinal.length > 0 && (
                                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                                                    <h5 className="text-lg font-semibold text-blue-900">Preguntas Actitudinales</h5>
                                                </div>
                                                <div className="p-4 overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead>
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Respuestas</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desviación Estándar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {datosPromediosItems.promedios_por_tipo.actitudinal.map((pregunta, index) => (
                                                                <tr key={index} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-3 text-sm text-gray-900">{pregunta.texto_pregunta}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-[#189cbf]">{pregunta.promedio}</td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600">{pregunta.total_respuestas}</td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600">{pregunta.desviacion_estandar}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        {/* Conceptual */}
                                        {datosPromediosItems.promedios_por_tipo.conceptual && datosPromediosItems.promedios_por_tipo.conceptual.length > 0 && (
                                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                                                    <h5 className="text-lg font-semibold text-green-900">Preguntas Conceptuales</h5>
                                                </div>
                                                <div className="p-4 overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead>
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Respuestas</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desviación Estándar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {datosPromediosItems.promedios_por_tipo.conceptual.map((pregunta, index) => (
                                                                <tr key={index} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-3 text-sm text-gray-900">{pregunta.texto_pregunta}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-[#189cbf]">{pregunta.promedio}</td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600">{pregunta.total_respuestas}</td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600">{pregunta.desviacion_estandar}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        {/* Procedimental */}
                                        {datosPromediosItems.promedios_por_tipo.procedimental && datosPromediosItems.promedios_por_tipo.procedimental.length > 0 && (
                                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                <div className="bg-purple-50 px-4 py-3 border-b border-gray-200">
                                                    <h5 className="text-lg font-semibold text-purple-900">Preguntas Procedimentales</h5>
                                                </div>
                                                <div className="p-4 overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead>
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Respuestas</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desviación Estándar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {datosPromediosItems.promedios_por_tipo.procedimental.map((pregunta, index) => (
                                                                <tr key={index} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-3 text-sm text-gray-900">{pregunta.texto_pregunta}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-[#189cbf]">{pregunta.promedio}</td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600">{pregunta.total_respuestas}</td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600">{pregunta.desviacion_estandar}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Toast flotante en la esquina inferior derecha */}
            {toast && (
                <div className={`fixed z-50 bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg border text-sm flex items-center gap-3 transition-all animate-fade-in-down
                ${toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : ''}
                ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
              `}>
                    {toast.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                    {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                    {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-lg font-bold text-gray-400 hover:text-gray-700">×</button>
                </div>
            )}

            {mostrarModalFirmas && (
                <ModalConfiguracionFirmas
                    isOpen={mostrarModalFirmas}
                    onClose={() => setMostrarModalFirmas(false)}
                    onSuccess={msg => showToast(msg, 'success')}
                    onError={msg => showToast(msg, 'error')}
                    maxAutoridades={1}
                    autoridadesExternas={autoridadesSoloVicerrectora} // Solo la vicerrectora
                />
            )}
        </div>
    );
};

export default ReportesAdmin;