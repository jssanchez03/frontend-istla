import { useEffect, useState } from "react";
import { obtenerEstadisticasGenerales, obtenerDatosGraficos, obtenerDetalleParticipacionPorTipo, obtenerResultadosDetallados, obtenerDatosMapaCalor, obtenerPromedioItemsPorTipo, obtenerPreguntasExtremas, obtenerPromediosPorCarrera } from "../../services/dashboardService";
import { obtenerPeriodos } from "../../services/evaluacionesService";
import { Users, BarChart2, CheckSquare, UserCheck, ChevronDown, TrendingDown, Minus, TrendingUp, Activity, User, Search, GraduationCap, Info, X } from "lucide-react";
import ReactECharts from 'echarts-for-react';
import AOS from "aos";
import "aos/dist/aos.css";
import { capitalizarNombreCompleto } from "../../lib/utils";

interface Periodo {
    id_periodo: number;
    descripcion: string;
}

interface DetalleParticipacion {
    tipo: string;
    esperadas: number;
    completadas: number;
    porcentaje: number;
}

interface Estadisticas {
    total_docentes_evaluados: number;
    total_docentes_anteriores: number;
    total_evaluaciones_completadas: number;
    total_evaluaciones_anteriores: number;
    promedio_general: number;
    promedio_general_anterior: number;
    tasa_participacion: number;
    tasa_participacion_anterior: number;
}

interface ResultadoDetallado {
    id_distributivo: string;
    docente: string;
    autoevaluacion: string | null;
    heteroevaluacion: string | null;
    coevaluacion: string | null;
    evaluacion_autoridades: string | null;
    promedio_general: number | null;
}

interface DatosGraficos {
    promedioPorTipo: Array<{
        tipo_evaluacion: string;
        promedio: number;
    }>;
    promedioPorCarrera: Array<{
        carrera: string;
        promedio: number;
    }>;
    datosHistoricos: Array<{
        periodo: number;
        nombre_periodo: string;
        promedio: number;
    }>;
}

interface DatosMapaCalor {
    mapaCalor: {
        actitudinal: {
            autoevaluacion: number;
            heteroevaluacion: number;
            coevaluacion: number;
        };
        conceptual: {
            autoevaluacion: number;
            heteroevaluacion: number;
            coevaluacion: number;
        };
        procedimental: {
            autoevaluacion: number;
            heteroevaluacion: number;
            coevaluacion: number;
        };
    };
    estadisticas: {
        actitudinal: {
            autoevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
            heteroevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
            coevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
        };
        conceptual: {
            autoevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
            heteroevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
            coevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
        };
        procedimental: {
            autoevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
            heteroevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
            coevaluacion: {
                total_respuestas: number;
                docentes_evaluados: number;
            };
        };
    };
}

interface PreguntaExtrema {
    id_pregunta: number;
    texto_pregunta: string;
    promedio: string;
    total_respuestas: number;
    tipo_pregunta: string;
}

interface PreguntasExtremas {
    actitudinal: {
        mejores: PreguntaExtrema[];
        peores: PreguntaExtrema[];
    };
    conceptual: {
        mejores: PreguntaExtrema[];
        peores: PreguntaExtrema[];
    };
    procedimental: {
        mejores: PreguntaExtrema[];
        peores: PreguntaExtrema[];
    };
}

interface PreguntasExtremasResponse {
    preguntas_extremas: PreguntasExtremas;
    tipo_evaluacion: string;
    periodo_id: number;
}

interface PromedioItem {
    id_pregunta: number;
    texto_pregunta: string;
    promedio: string;
    total_respuestas: number;
    desviacion_estandar: string;
}

interface PromediosItemsResponse {
    promedios_por_tipo: {
        actitudinal: PromedioItem[];
        conceptual: PromedioItem[];
        procedimental: PromedioItem[];
    };
    estadisticas_generales: {
        total_preguntas: number;
        promedio_general: string;
        tipo_evaluacion: string;
        periodo_id: number;
    };
}

interface CarreraPromedios {
    nombre_carrera: string;
    total_docentes: number;
    total_respuestas: number;
    promedio_general: string;
    secciones: {
        actitudinal: {
            promedio: string;
            total_respuestas: number;
        };
        conceptual: {
            promedio: string;
            total_respuestas: number;
        };
        procedimental: {
            promedio: string;
            total_respuestas: number;
        };
    };
}

interface PromediosPorCarrera {
    carreras: CarreraPromedios[];
    estadisticas_generales: {
        total_carreras: number;
        promedio_institucional: string;
        total_docentes_evaluados: number;
        total_respuestas: number;
        tipo_evaluacion: string;
        periodo_id: number;
        carreras_con_datos: number;
    };
}

type TabActivo = 'general' | 'autoevaluacion' | 'heteroevaluacion' | 'coevaluacion' | 'resultados';

const getTipoEvaluacionId = (tipo: string): number => {
    switch (tipo) {
        case 'autoevaluacion': return 1;
        case 'heteroevaluacion': return 2;
        case 'coevaluacion': return 3;
        default: return 1;
    }
};

// Hook personalizado para animar números
function useCountUp(end: number, duration = 1200, decimals = 0) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let start = 0;
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = start + (end - start) * progress;
            setValue(Number(current.toFixed(decimals)));
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setValue(Number(end.toFixed(decimals)));
            }
        };
        requestAnimationFrame(step);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [end, duration, decimals]);
    return value;
}

const DashboardGeneral = () => {
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
    const [datosGraficos, setDatosGraficos] = useState<DatosGraficos | null>(null);
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | "">("");
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [tabActivo, setTabActivo] = useState<TabActivo>('general');
    const [detalleParticipacion, setDetalleParticipacion] = useState<DetalleParticipacion[]>([]);
    const [resultadosDetallados, setResultadosDetallados] = useState<ResultadoDetallado[]>([]);
    const [cargandoResultados, setCargandoResultados] = useState(false);
    const [datosMapaCalor, setDatosMapaCalor] = useState<DatosMapaCalor | null>(null);
    const [preguntasExtremas, setPreguntasExtremas] = useState<{
        [key: string]: PreguntasExtremas | null;
    }>({
        autoevaluacion: null,
        heteroevaluacion: null,
        coevaluacion: null
    });
    const [promediosItems, setPromediosItems] = useState<PromediosItemsResponse | null>(null);
    const [promediosPorCarrera, setPromediosPorCarrera] = useState<PromediosPorCarrera | null>(null);
    const [elementosPorPagina, setElementosPorPagina] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarInfo, setMostrarInfo] = useState(false);

    const calcularCambio = (actual: number, anterior: number): string => {
        const cambio = actual - anterior;
        return cambio >= 0 ? `+${cambio}` : `${cambio}`;
    };

    const calcularCambioPorcentaje = (actual: number, anterior: number): string => {
        if (anterior === 0) return "+0%";
        const cambio = ((actual - anterior) / anterior) * 100;
        const valor = cambio.toFixed(1);
        return cambio >= 0 ? `+${valor}%` : `${valor}%`;
    };

    const filteredResultados = resultadosDetallados.filter(resultado => {
        const searchLower = searchTerm.toLowerCase();
        return (
            resultado.docente.toLowerCase().includes(searchLower) ||
            resultado.id_distributivo.toString().includes(searchLower)
        );
    });

    const totalPaginas = Math.ceil(filteredResultados.length / elementosPorPagina);
    const indiceInicio = (currentPage - 1) * elementosPorPagina;
    const indiceFin = indiceInicio + elementosPorPagina;
    const resultadosPaginados = filteredResultados.slice(indiceInicio, indiceFin);

    const cargarDetalleParticipacion = async (periodo: number) => {
        try {
            const data = await obtenerDetalleParticipacionPorTipo(periodo);
            setDetalleParticipacion(data);
        } catch (error) {
            console.error("Error al cargar detalle de participación:", error);
        }
    };

    const cargarResultadosDetallados = async (periodo: number) => {
        try {
            setCargandoResultados(true);
            const data = await obtenerResultadosDetallados(periodo);
            setResultadosDetallados(data);
        } catch (error) {
            console.error("Error al cargar resultados detallados:", error);
        } finally {
            setCargandoResultados(false);
        }
    };

    const cargarDatosMapaCalor = async (periodo: number) => {
        try {
            const data = await obtenerDatosMapaCalor(periodo);
            setDatosMapaCalor(data);
        } catch (error) {
            console.error("Error al cargar datos del mapa de calor:", error);
        }
    };

    const cargarPreguntasExtremas = async (periodo: number, tipoEvaluacion: number) => {
        try {
            const data: PreguntasExtremasResponse = await obtenerPreguntasExtremas(periodo, tipoEvaluacion);
            // Determinar el tipo de evaluación basado en el ID
            const tipoKey = tipoEvaluacion === 1 ? 'autoevaluacion' :
                tipoEvaluacion === 2 ? 'heteroevaluacion' :
                    'coevaluacion';
            // Actualizar solo el tipo específico
            setPreguntasExtremas(prev => ({
                ...prev,
                [tipoKey]: data.preguntas_extremas
            }));
        } catch (error) {
            console.error("Error al cargar preguntas extremas:", error);
        }
    };

    const cargarPromediosItems = async (periodo: number, tipoEvaluacion: number) => {
        try {
            const data: PromediosItemsResponse = await obtenerPromedioItemsPorTipo(periodo, tipoEvaluacion);
            setPromediosItems(data);
        } catch (error) {
            console.error("Error al cargar promedios por items:", error);
            setPromediosItems(null);
        }
    };

    const cargarPromediosPorCarrera = async (periodo: number, tipoEvaluacion: number) => {
        try {
            const data = await obtenerPromediosPorCarrera(periodo, tipoEvaluacion);
            setPromediosPorCarrera(data);
        } catch (error) {
            console.error("Error al cargar promedios por carrera:", error);
        }
    };

    useEffect(() => {
        AOS.init({ duration: 700, once: true });
        cargarPeriodos();
    }, []);

    useEffect(() => {
        if (periodoSeleccionado !== "") {
            cargarDatos(periodoSeleccionado);
            cargarDatosGraficos(periodoSeleccionado);
            cargarDetalleParticipacion(periodoSeleccionado);
            cargarResultadosDetallados(periodoSeleccionado);
            cargarDatosMapaCalor(periodoSeleccionado);
            // Cargar datos específicos por tipo de evaluación
            [1, 2, 3].forEach(tipoId => {
                cargarPreguntasExtremas(periodoSeleccionado, tipoId);
                cargarPromediosItems(periodoSeleccionado, tipoId);
                cargarPromediosPorCarrera(periodoSeleccionado, tipoId);
            });
        }
    }, [periodoSeleccionado]);

    useEffect(() => {
        if (periodoSeleccionado !== "" && ['autoevaluacion', 'heteroevaluacion', 'coevaluacion'].includes(tabActivo)) {
            const tipoId = getTipoEvaluacionId(tabActivo);
            cargarPreguntasExtremas(periodoSeleccionado, tipoId);
            cargarPromediosItems(periodoSeleccionado, tipoId);
            cargarPromediosPorCarrera(periodoSeleccionado, tipoId);
        }
    }, [tabActivo, periodoSeleccionado]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, periodoSeleccionado]);

    const cargarDatos = async (periodo: number) => {
        try {
            const data = await obtenerEstadisticasGenerales(periodo);
            setEstadisticas(data);
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    };

    const cargarDatosGraficos = async (periodo: number) => {
        try {
            const data = await obtenerDatosGraficos(periodo);
            setDatosGraficos(data);
        } catch (error) {
            console.error("Error al cargar datos de gráficos:", error);
        }
    };

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

    const handlePeriodoChange = (periodo: Periodo) => {
        setPeriodoSeleccionado(periodo.id_periodo);
        setIsSelectOpen(false);
    };

    // Configuraciones de gráficos simplificadas
    const getChartOptions = () => {
        const commonStyle = {
            title: {
                left: 'center',
                textStyle: { fontSize: 14, fontWeight: '500', color: '#374151' },
                subtextStyle: { fontSize: 11, color: '#6B7280' }
            },
            tooltip: {
                backgroundColor: '#ffffff',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                textStyle: { color: '#374151', fontSize: 12 }
            }
        };

        return {
            line: {
                ...commonStyle,
                title: { ...commonStyle.title, text: 'Promedio General', subtext: 'Histórico' },
                grid: { left: '8%', right: '8%', bottom: '1%', top: '25%', containLabel: true },
                xAxis: {
                    type: 'category',
                    data: datosGraficos?.datosHistoricos?.map(item => item.nombre_periodo || `Período ${item.periodo}`) || [],
                    axisLabel: { fontSize: 11, color: '#374151' }
                },
                yAxis: {
                    type: 'value',
                    min: 0,
                    max: 100,
                    axisLabel: { fontSize: 11, color: '#374151' }
                },
                series: [{
                    data: datosGraficos?.datosHistoricos?.map(item => item.promedio) || [],
                    type: 'line',
                    smooth: true,
                    lineStyle: { color: '#4285f4', width: 2 },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(66, 133, 244, 0.2)' },
                                { offset: 1, color: 'rgba(66, 133, 244, 0.02)' }
                            ]
                        }
                    }
                }]
            },
            pie: {
                ...commonStyle,
                title: { ...commonStyle.title, text: 'Promedio', subtext: 'Por Tipo de Evaluación' },
                series: [{
                    type: 'pie',
                    radius: '60%',
                    center: ['50%', '50%'],
                    data: datosGraficos?.promedioPorTipo?.map(item => ({
                        name: item.tipo_evaluacion,
                        value: item.promedio
                    })) || [],
                    color: ['#189cbf', '#10b981', '#f59e0b', '#ef4444']
                }]
            },
            bar: {
                ...commonStyle,
                title: { ...commonStyle.title, text: 'Promedios', subtext: 'Por Carrera' },
                grid: { left: '8%', right: '8%', top: '25%', bottom: '1%', containLabel: true },
                tooltip: {
                    backgroundColor: '#ffffff',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    textStyle: { color: '#374151', fontSize: 12 },
                    confine: true,  // Mantiene el tooltip dentro del contenedor
                    formatter: function (params: any) {
                        const nombreCompleto = datosGraficos?.promedioPorCarrera?.[params.dataIndex]?.carrera || 'N/A';
                        const promedio = params.value;
                        return `<div style="padding: 8px; max-width: 900px;">
                <div style="font-weight: bold; margin-bottom: 4px; word-wrap: break-word; line-height: 1.4;">
                    ${nombreCompleto}
                </div>
                <div style="color: #6B7280;">
                    Promedio: <span style="color: #374151; font-weight: 500;">${promedio.toFixed(1)}</span>
                </div>
            </div>`;
                    }
                },
                xAxis: {
                    type: 'category',
                    data: datosGraficos?.promedioPorCarrera?.map(item =>
                        item.carrera.length > 12 ? item.carrera.substring(0, 12) + '...' : item.carrera
                    ) || [],
                    axisLabel: { fontSize: 11, color: '#374151' }
                },
                yAxis: {
                    type: 'value',
                    min: 0,
                    max: 100,
                    axisLabel: { fontSize: 11, color: '#374151' }
                },
                series: [{
                    data: datosGraficos?.promedioPorCarrera?.map((item, index) => ({
                        value: item.promedio,
                        itemStyle: {
                            color: ['#189cbf', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
                            borderRadius: [4, 4, 0, 0]
                        }
                    })) || [],
                    type: 'bar',
                    barWidth: '50%'
                }]
            }
        };
    };

    // Función mejorada para buscar por tipo de evaluación
    const getDetalleParticipacionByTipo = (tipoEvaluacion: string): DetalleParticipacion | null => {
        if (!detalleParticipacion || detalleParticipacion.length === 0) return null;

        // Mapeo de tipos para mayor precisión
        const tipoMap: { [key: string]: string[] } = {
            'autoevaluacion': ['autoevaluación', 'autoevaluacion', 'auto-evaluación', 'auto evaluación'],
            'heteroevaluacion': ['heteroevaluación', 'heteroevaluacion', 'hetero-evaluación', 'hetero evaluación'],
            'coevaluacion': ['coevaluación', 'coevaluacion', 'co-evaluación', 'co evaluación']
        };

        const posiblesTipos = tipoMap[tipoEvaluacion.toLowerCase()] || [tipoEvaluacion];

        return detalleParticipacion.find(detalle =>
            posiblesTipos.some(tipo =>
                detalle.tipo.toLowerCase().includes(tipo.toLowerCase()) ||
                tipo.toLowerCase().includes(detalle.tipo.toLowerCase())
            )
        ) || null;
    };

    const renderCards = (tipoEvaluacion?: string) => {
        if (tipoEvaluacion) {
            const detalle = getDetalleParticipacionByTipo(tipoEvaluacion);

            if (!detalle) {
                return (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No se encontraron datos de participación para {tipoEvaluacion}</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Datos disponibles: {detalleParticipacion.map(d => d.tipo).join(', ') || 'Ninguno'}
                        </p>
                    </div>
                );
            }

            return (
                <div className="mb-6">
                    <CardParticipacion
                        tipo={detalle.tipo}
                        completadas={detalle.completadas}
                        esperadas={detalle.esperadas}
                        porcentaje={detalle.porcentaje}
                    />
                </div>
            );
        }

        // Cards generales
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 dashboard-cards-grid-mobile">
                <CardDashboard
                    titulo="Docentes Evaluados"
                    valor={(estadisticas?.total_docentes_evaluados ?? 0).toString()}
                    cambio={calcularCambio(
                        estadisticas?.total_docentes_evaluados ?? 0,
                        estadisticas?.total_docentes_anteriores ?? 0
                    ) + " desde el último período"}
                    icono={<UserCheck size={24} className="text-pink-600" />}
                    color="bg-pink-50"
                    iconBg="bg-pink-100"
                    tendencia={
                        (estadisticas?.total_docentes_evaluados ?? 0) >=
                            (estadisticas?.total_docentes_anteriores ?? 0) ? "up" : "down"
                    }
                />
                <CardDashboard
                    titulo="Promedio General"
                    valor={`${parseFloat((estadisticas?.promedio_general ?? 0).toString()).toFixed(0)}/100`}
                    cambio={calcularCambioPorcentaje(
                        estadisticas?.promedio_general ?? 0,
                        estadisticas?.promedio_general_anterior ?? 0
                    ) + " desde el último período"}
                    icono={<BarChart2 size={24} className="text-red-600" />}
                    color="bg-red-50"
                    iconBg="bg-red-100"
                    tendencia={
                        (estadisticas?.promedio_general ?? 0) >=
                            (estadisticas?.promedio_general_anterior ?? 0) ? "up" : "down"
                    }
                />
                <CardDashboard
                    titulo="Evaluaciones Completadas"
                    valor={(estadisticas?.total_evaluaciones_completadas ?? 0).toString()}
                    cambio={calcularCambio(
                        estadisticas?.total_evaluaciones_completadas ?? 0,
                        estadisticas?.total_evaluaciones_anteriores ?? 0
                    ) + " desde el último período"}
                    icono={<CheckSquare size={24} className="text-yellow-600" />}
                    color="bg-yellow-50"
                    iconBg="bg-yellow-100"
                    tendencia={
                        (estadisticas?.total_evaluaciones_completadas ?? 0) >=
                            (estadisticas?.total_evaluaciones_anteriores ?? 0) ? "up" : "down"
                    }
                />
                <CardDashboard
                    titulo="Tasa de Participación"
                    valor={`${parseFloat((estadisticas?.tasa_participacion ?? 0).toString()).toFixed(1)}%`}
                    cambio={calcularCambioPorcentaje(
                        estadisticas?.tasa_participacion ?? 0,
                        estadisticas?.tasa_participacion_anterior ?? 0
                    ) + " desde el último período"}
                    icono={<Users size={24} className="text-cyan-600" />}
                    color="bg-cyan-50"
                    iconBg="bg-cyan-100"
                    tendencia={
                        (estadisticas?.tasa_participacion ?? 0) >=
                            (estadisticas?.tasa_participacion_anterior ?? 0) ? "up" : "down"
                    }
                />
            </div>
        );
    };

    // 4. Componente para renderizar los promedios por items
    const renderPromediosItems = () => {
        if (!promediosItems) {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Desempeño por Ítem Evaluativo
                    </h3>
                    <div className="text-center py-12">
                        <div className="animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500">Cargando datos...</p>
                        </div>
                    </div>
                </div>
            );
        }

        const { promedios_por_tipo, estadisticas_generales } = promediosItems;

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Desempeño por Ítem Evaluativo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 dashboard-cards-grid-mobile">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 dashboard-card-mobile">
                            <p className="text-sm text-blue-600 font-medium">Total Preguntas</p>
                            <p className="text-2xl font-bold text-blue-900">{estadisticas_generales.total_preguntas}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 dashboard-card-mobile">
                            <p className="text-sm text-green-600 font-medium">Promedio General</p>
                            <p className="text-2xl font-bold text-green-900">
                                {parseFloat(estadisticas_generales.promedio_general).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 dashboard-card-mobile">
                            <p className="text-sm text-purple-600 font-medium">Tipo Evaluación</p>
                            <p className="text-lg font-bold text-purple-900 capitalize">{estadisticas_generales.tipo_evaluacion}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {(['actitudinal', 'conceptual', 'procedimental'] as const).map((seccion) => (
                        <div key={seccion} className="bg-gray-50 rounded-lg p-6 border border-gray-100 dashboard-card-mobile">
                            <h4 className="font-semibold text-gray-900 mb-6 text-center">
                                {seccion.charAt(0).toUpperCase() + seccion.slice(1)} ({promedios_por_tipo[seccion]?.length || 0} preguntas)
                            </h4>

                            {promedios_por_tipo[seccion]?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 dashboard-cards-grid-mobile">
                                    {promedios_por_tipo[seccion].map((item) => (
                                        <div key={item.id_pregunta} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300 dashboard-card-mobile">
                                            <div className="flex justify-between items-start mb-3">
                                                <p className="text-sm text-gray-800 font-medium leading-tight flex-1 pr-2">
                                                    {item.texto_pregunta.length > 70
                                                        ? `${item.texto_pregunta.substring(0, 70)}...`
                                                        : item.texto_pregunta
                                                    }
                                                </p>
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${parseFloat(item.promedio) >= 4.5
                                                    ? 'bg-green-100 text-green-800'
                                                    : parseFloat(item.promedio) >= 3.5
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {parseFloat(item.promedio) >= 4.5 ? 'Excelente' :
                                                        parseFloat(item.promedio) >= 3.5 ? 'Bueno' : 'Mejorable'}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Promedio:</span>
                                                    <span className="text-lg font-bold text-gray-900">
                                                        {parseFloat(item.promedio).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Respuestas:</span>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {item.total_respuestas}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Desv. Estándar:</span>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {parseFloat(item.desviacion_estandar).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Barra de progreso visual */}
                                            <div className="mt-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ease-out ${parseFloat(item.promedio) >= 4.5 ? 'bg-green-500' :
                                                            parseFloat(item.promedio) >= 3.5 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                        style={{ width: `${(parseFloat(item.promedio) / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="animate-pulse">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
                                        <p className="text-gray-500">No hay datos disponibles para esta sección</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    const renderContent = () => {
        const chartOptions = getChartOptions();
        switch (tabActivo) {
            case 'general':
                return (
                    <div className="animate-fade-in">
                        {renderCards()}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm" data-aos="fade-up" data-aos-delay="0">
                                <ReactECharts key={`line-${periodoSeleccionado}-${tabActivo}`} option={chartOptions.line} style={{ height: '240px', width: '100%' }} className="dashboard-chart-mobile" />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm" data-aos="fade-up" data-aos-delay="100">
                                <ReactECharts key={`pie-${periodoSeleccionado}-${tabActivo}`} option={chartOptions.pie} style={{ height: '240px', width: '100%' }} className="dashboard-chart-mobile" />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm" data-aos="fade-up" data-aos-delay="200">
                                <ReactECharts key={`bar-${periodoSeleccionado}-${tabActivo}`} option={chartOptions.bar} style={{ height: '240px', width: '100%' }} className="dashboard-chart-mobile" />
                            </div>
                        </div>
                        {datosMapaCalor && <div className="dashboard-heatmap-mobile"><MapaCalor datos={datosMapaCalor} /></div>}
                    </div>
                );

            case 'autoevaluacion':
            case 'heteroevaluacion':
            case 'coevaluacion':
                return (
                    <div className="animate-fade-in space-y-6">
                        {/* Layout de dos columnas */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* COLUMNA 1 */}
                            <div className="space-y-6">
                                {/* Tarjeta de Participación */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 pb-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Participación de Usuarios
                                    </h3>
                                    {renderCards(tabActivo)}
                                </div>

                                {/* Tarjeta de Promedios por Carrera */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Promedios por Carrera
                                    </h3>
                                    {promediosPorCarrera ? (
                                        <div className="flex-1 overflow-hidden">
                                            <div className="max-h-117 overflow-y-auto pr-2 space-y-8">
                                                {promediosPorCarrera.carreras.map((carrera, index) => (
                                                    <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-100 dashboard-card-mobile">
                                                        <h4 className="font-semibold text-gray-900 mb-6 text-center">
                                                            {carrera.nombre_carrera}
                                                        </h4>
                                                        <div className="grid grid-cols-3 gap-6 dashboard-cards-grid-mobile">
                                                            {/* Actitudinal */}
                                                            <div className="text-center">
                                                                <div className="relative inline-flex items-center justify-center mb-2">
                                                                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#f3f4f6"
                                                                            strokeWidth="3"
                                                                        />
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke={parseFloat(carrera.secciones.actitudinal.promedio) >= 4.5 ? '#059669' :
                                                                                parseFloat(carrera.secciones.actitudinal.promedio) >= 3.5 ? '#d97706' : '#dc2626'}
                                                                            strokeWidth="3"
                                                                            strokeDasharray={`${(parseFloat(carrera.secciones.actitudinal.promedio) / 5) * 100}, 100`}
                                                                            strokeLinecap="round"
                                                                            className="transition-all duration-700 ease-out"
                                                                        />
                                                                    </svg>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-lg font-bold text-gray-900">
                                                                            {parseFloat(carrera.secciones.actitudinal.promedio).toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm text-gray-600 font-medium">Actitudinal</div>
                                                                <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${parseFloat(carrera.secciones.actitudinal.promedio) >= 4.5
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : parseFloat(carrera.secciones.actitudinal.promedio) >= 3.5
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {parseFloat(carrera.secciones.actitudinal.promedio) >= 4.5 ? 'Excelente' :
                                                                        parseFloat(carrera.secciones.actitudinal.promedio) >= 3.5 ? 'Bueno' : 'Mejorable'}
                                                                </div>
                                                            </div>

                                                            {/* Conceptual */}
                                                            <div className="text-center">
                                                                <div className="relative inline-flex items-center justify-center mb-2">
                                                                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#f3f4f6"
                                                                            strokeWidth="3"
                                                                        />
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke={parseFloat(carrera.secciones.conceptual.promedio) >= 4.5 ? '#059669' :
                                                                                parseFloat(carrera.secciones.conceptual.promedio) >= 3.5 ? '#d97706' : '#dc2626'}
                                                                            strokeWidth="3"
                                                                            strokeDasharray={`${(parseFloat(carrera.secciones.conceptual.promedio) / 5) * 100}, 100`}
                                                                            strokeLinecap="round"
                                                                            className="transition-all duration-700 ease-out"
                                                                        />
                                                                    </svg>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-lg font-bold text-gray-900">
                                                                            {parseFloat(carrera.secciones.conceptual.promedio).toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm text-gray-600 font-medium">Conceptual</div>
                                                                <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${parseFloat(carrera.secciones.conceptual.promedio) >= 4.5
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : parseFloat(carrera.secciones.conceptual.promedio) >= 3.5
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {parseFloat(carrera.secciones.conceptual.promedio) >= 4.5 ? 'Excelente' :
                                                                        parseFloat(carrera.secciones.conceptual.promedio) >= 3.5 ? 'Bueno' : 'Mejorable'}
                                                                </div>
                                                            </div>

                                                            {/* Procedimental */}
                                                            <div className="text-center">
                                                                <div className="relative inline-flex items-center justify-center mb-2">
                                                                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#f3f4f6"
                                                                            strokeWidth="3"
                                                                        />
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke={parseFloat(carrera.secciones.procedimental.promedio) >= 4.5 ? '#059669' :
                                                                                parseFloat(carrera.secciones.procedimental.promedio) >= 3.5 ? '#d97706' : '#dc2626'}
                                                                            strokeWidth="3"
                                                                            strokeDasharray={`${(parseFloat(carrera.secciones.procedimental.promedio) / 5) * 100}, 100`}
                                                                            strokeLinecap="round"
                                                                            className="transition-all duration-700 ease-out"
                                                                        />
                                                                    </svg>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-lg font-bold text-gray-900">
                                                                            {parseFloat(carrera.secciones.procedimental.promedio).toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm text-gray-600 font-medium">Procedimental</div>
                                                                <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${parseFloat(carrera.secciones.procedimental.promedio) >= 4.5
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : parseFloat(carrera.secciones.procedimental.promedio) >= 3.5
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {parseFloat(carrera.secciones.procedimental.promedio) >= 4.5 ? 'Excelente' :
                                                                        parseFloat(carrera.secciones.procedimental.promedio) >= 3.5 ? 'Bueno' : 'Mejorable'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="animate-pulse">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
                                                <p className="text-gray-500">Cargando datos...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA 2 */}
                            <div className="space-y-6">
                                {/* Tarjeta de Preguntas Mejor/Peor Evaluadas */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        Preguntas Mejor/Peor Evaluadas
                                    </h3>
                                    {preguntasExtremas[tabActivo] ? (
                                        <div className="space-y-8">
                                            {['actitudinal', 'conceptual', 'procedimental'].map((seccion) => (
                                                <div key={seccion} className="bg-gray-50 rounded-lg p-6 border border-gray-100 dashboard-card-mobile">
                                                    <h4 className="font-semibold text-gray-900 mb-4 capitalize text-center">
                                                        {seccion}
                                                    </h4>
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 dashboard-cards-grid-mobile">
                                                        {/* Mejor evaluada */}
                                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 dashboard-card-mobile">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="relative">
                                                                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#d1fae5"
                                                                            strokeWidth="3"
                                                                        />
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#059669"
                                                                            strokeWidth="3"
                                                                            strokeDasharray={`${preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.mejores?.[0] ?
                                                                                (parseFloat(preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].mejores[0].promedio) / 5) * 100 : 0}, 100`}
                                                                            strokeLinecap="round"
                                                                            className="transition-all duration-700 ease-out"
                                                                        />
                                                                    </svg>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-xs font-bold text-green-800">
                                                                            {preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.mejores?.[0] ?
                                                                                parseFloat(preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].mejores[0].promedio).toFixed(1) : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                        <p className="text-green-800 font-semibold text-sm">Mejor evaluada</p>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                                                                            style={{
                                                                                width: `${preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.mejores?.[0] ?
                                                                                    (parseFloat(preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].mejores[0].promedio) / 5) * 100 : 0}%`
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.mejores?.[0] ? (
                                                                <p className="text-gray-700 text-sm leading-relaxed">
                                                                    {preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].mejores[0].texto_pregunta.length > 70
                                                                        ? `${preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].mejores[0].texto_pregunta.substring(0, 70)}...`
                                                                        : preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].mejores[0].texto_pregunta
                                                                    }
                                                                </p>
                                                            ) : (
                                                                <p className="text-gray-400 text-sm">No disponible</p>
                                                            )}
                                                        </div>

                                                        {/* Peor evaluada */}
                                                        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-lg border border-red-200 dashboard-card-mobile">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="relative">
                                                                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#fecaca"
                                                                            strokeWidth="3"
                                                                        />
                                                                        <path
                                                                            d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#dc2626"
                                                                            strokeWidth="3"
                                                                            strokeDasharray={`${preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.peores?.[0] ?
                                                                                (parseFloat(preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].peores[0].promedio) / 5) * 100 : 0}, 100`}
                                                                            strokeLinecap="round"
                                                                            className="transition-all duration-700 ease-out"
                                                                        />
                                                                    </svg>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-xs font-bold text-red-800">
                                                                            {preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.peores?.[0] ?
                                                                                parseFloat(preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].peores[0].promedio).toFixed(1) : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                        </svg>
                                                                        <p className="text-red-800 font-semibold text-sm">Peor evaluada</p>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-red-500 rounded-full transition-all duration-500 ease-out"
                                                                            style={{
                                                                                width: `${preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.peores?.[0] ?
                                                                                    (parseFloat(preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].peores[0].promedio) / 5) * 100 : 0}%`
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {preguntasExtremas[tabActivo]?.[seccion as keyof PreguntasExtremas]?.peores?.[0] ? (
                                                                <p className="text-gray-700 text-sm leading-relaxed">
                                                                    {preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].peores[0].texto_pregunta.length > 70
                                                                        ? `${preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].peores[0].texto_pregunta.substring(0, 70)}...`
                                                                        : preguntasExtremas[tabActivo][seccion as keyof PreguntasExtremas].peores[0].texto_pregunta
                                                                    }
                                                                </p>
                                                            ) : (
                                                                <p className="text-gray-400 text-sm">No disponible</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="animate-pulse">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
                                                <p className="text-gray-500">Cargando datos...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sección de Promedios por Items - Ancho completo */}
                        {renderPromediosItems()}
                    </div>
                );
            case 'resultados':
                return (
                    <div className="animate-fade-in">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Resultados Detallados</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Listado de docentes y sus calificaciones por tipo de evaluación
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setMostrarInfo(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                                        title="Información sobre ponderación de evaluaciones"
                                    >
                                        <Info className="w-5 h-5" />
                                        <span className="hidden sm:inline font-medium">Información</span>
                                    </button>
                                </div>
                            </div>

                            {/* Barra de búsqueda y controles */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por docente"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#189cbf] focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Mostrar:</label>
                                        <select
                                            value={elementosPorPagina}
                                            onChange={(e) => {
                                                setElementosPorPagina(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#189cbf]"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                        <span className="text-sm text-gray-600">registros</span>
                                    </div>
                                </div>
                            </div>

                            {cargandoResultados ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#189cbf]"></div>
                                    <span className="ml-3 text-gray-600">Cargando resultados...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Cards en móvil */}
                                    <div className="block sm:hidden">
                                        {filteredResultados.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">No se encontraron resultados para este período</div>
                                        ) : (
                                            resultadosPaginados.map((resultado) => (
                                                <div key={resultado.id_distributivo} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-2 shadow-sm mb-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div>
                                                            <div className="font-semibold text-xs text-gray-700">{capitalizarNombreCompleto(resultado.docente)}</div>
                                                            <div className="text-xs text-gray-500 hidden md:block">ID: {resultado.id_distributivo}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-[#189cbf]/10 text-[#189cbf]">
                                                            Auto: {resultado.autoevaluacion ?? 'N/A'}
                                                        </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-[#930f4b]/10 text-[#930f4b]">
                                                            Hetero: {resultado.heteroevaluacion ?? 'N/A'}
                                                        </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-[#81bf20]/10 text-[#81bf20]">
                                                            Coe: {resultado.coevaluacion ?? 'N/A'}
                                                        </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-[#9333ea]/10 text-[#9333ea]">
                                                            Autoridad: {resultado.evaluacion_autoridades ?? 'N/A'}
                                                        </span>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${resultado.promedio_general && resultado.promedio_general >= 80
                                                            ? 'bg-green-100 text-green-800'
                                                            : resultado.promedio_general && resultado.promedio_general >= 60
                                                              ? 'bg-yellow-100 text-yellow-800'
                                                              : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            Prom: {resultado.promedio_general ? resultado.promedio_general.toFixed(2) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {/* Paginación móvil */}
                                        {totalPaginas > 1 && (
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                                <div className="text-sm text-gray-600">
                                                    Mostrando {indiceInicio + 1} a {Math.min(indiceFin, filteredResultados.length)} de {filteredResultados.length} registros
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Anterior
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                                                            .filter(num => {
                                                                return num === 1 || num === totalPaginas || (num >= currentPage - 2 && num <= currentPage + 2);
                                                            })
                                                            .map((num, index, array) => (
                                                                <div key={num} className="flex items-center">
                                                                    {index > 0 && array[index - 1] !== num - 1 && (
                                                                        <span className="px-2 text-gray-400">...</span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setCurrentPage(num)}
                                                                        className={`px-3 py-1 text-sm border rounded ${currentPage === num
                                                                            ? 'bg-[#189cbf] text-white border-[#189cbf]'
                                                                            : 'border-gray-300 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        {num}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPaginas))}
                                                        disabled={currentPage === totalPaginas}
                                                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Siguiente
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Tabla solo en escritorio */}
                                    <div className="hidden md:block px-6 pb-6 overflow-x-auto mt-4">
                                        <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
                                            <thead className="bg-gray-50 rounded-t-lg">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Docente
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Autoevaluación
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Heteroevaluación
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Coevaluación
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Eval. Autoridades
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Promedio General
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {resultadosPaginados.map((resultado, index) => (
                                                    <tr key={resultado.id_distributivo} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${index === resultadosPaginados.length - 1 ? 'last:rounded-b-lg' : ''}`}>
                                                        <td className={`px-6 py-4 whitespace-nowrap ${index === resultadosPaginados.length - 1 ? 'rounded-bl-lg' : ''}`}>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {capitalizarNombreCompleto(resultado.docente)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {resultado.autoevaluacion ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#189cbf]/10 text-[#189cbf]">
                                                                    {resultado.autoevaluacion}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {resultado.heteroevaluacion ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#930f4b]/10 text-[#930f4b]">
                                                                    {resultado.heteroevaluacion}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {resultado.coevaluacion ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#81bf20]/10 text-[#81bf20]">
                                                                    {resultado.coevaluacion}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {resultado.evaluacion_autoridades ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#9333ea]/10 text-[#9333ea]">
                                                                    {resultado.evaluacion_autoridades}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-center ${index === resultadosPaginados.length - 1 ? 'rounded-br-lg' : ''}`}>
                                                            {resultado.promedio_general ? (
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${resultado.promedio_general >= 80
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : resultado.promedio_general >= 60
                                                                      ? 'bg-yellow-100 text-yellow-800'
                                                                      : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {resultado.promedio_general.toFixed(2)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">N/A</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="py-5">
            {/* Header */}
            <div className="flex items-center mb-6" data-aos="fade-up">
                <h1 className="text-xl text-gray-800 font-medium">Resultados de Evaluación</h1>
            </div>
            {/* Dashboard Container */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden" data-aos="fade-up" data-aos-delay="100">
                {/* Header con selector de período */}
                <div className="bg-[#189cbf] text-white p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center">
                            <BarChart2 className="h-6 w-6 mr-3" />
                            <div>
                                <h2 className="text-xl font-medium flex items-center">
                                    Dashboard de Evaluación Docente
                                </h2>
                                <p className="text-white/90 text-sm mt-1">
                                    Visualización de los resultados de las evaluaciones
                                </p>
                            </div>
                        </div>

                        {/* Selector de período */}
                        <div className="relative dashboard-period-select-mobile">
                            <button
                                onClick={() => setIsSelectOpen(!isSelectOpen)}
                                className="flex items-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 min-w-[200px] justify-between transition-colors"
                            >
                                <span className="text-sm">
                                    {periodoSeleccionado ?
                                        periodos.find(p => p.id_periodo === periodoSeleccionado)?.descripcion || "Seleccionar período"
                                        : "Seleccionar período"
                                    }
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSelectOpen && (
                                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px] z-50">
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

                {/* Navegación por tabs */}
                <div className="flex justify-center p-4 pb-0">
                    <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-full md:w-auto">
                        <nav className="flex flex-col w-full gap-2 md:flex-row md:w-auto md:gap-0 dashboard-tabs-mobile">
                            {[
                                { id: 'general', label: 'General' },
                                { id: 'autoevaluacion', label: 'Autoevaluación' },
                                { id: 'heteroevaluacion', label: 'Heteroevaluación' },
                                { id: 'coevaluacion', label: 'Coevaluación' },
                                { id: 'resultados', label: 'Resultados Detallados' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTabActivo(tab.id as TabActivo)}
                                    className={`w-full md:w-auto px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${tabActivo === tab.id
                                        ? 'bg-[#189cbf] text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Contenido de los tabs */}
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>

            {/* Estilos CSS */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>

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
                        className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden" // quita overflow-y-auto aquí
                        data-aos="zoom-in"
                        data-aos-duration="300"
                    >
                        <div className="p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <BarChart2 className="w-6 h-6 text-[#189cbf]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Información sobre Ponderación de Evaluaciones
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
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Sistema de Ponderación
                                    </h4>
                                    <p className="text-slate-700 text-sm leading-relaxed mb-4">
                                        Las evaluaciones se ponderan automáticamente según los siguientes porcentajes establecidos institucionalmente:
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3 p-4 bg-[#189cbf]/5 rounded-lg border border-[#189cbf]/20">
                                            <div className="p-2 bg-[#189cbf]/10 rounded-lg">
                                                <User className="w-5 h-5 text-[#189cbf]" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[#189cbf] mb-1">Autoevaluación</h4>
                                                <div className="text-2xl font-bold text-[#189cbf] mb-1">10%</div>
                                                <p className="text-gray-700 text-sm">
                                                    Evaluación que realiza el docente sobre su propio desempeño
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-[#930f4b]/5 rounded-lg border border-[#930f4b]/20">
                                            <div className="p-2 bg-[#930f4b]/10 rounded-lg">
                                                <GraduationCap className="w-5 h-5 text-[#930f4b]" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[#930f4b] mb-1">Heteroevaluación</h4>
                                                <div className="text-2xl font-bold text-[#930f4b] mb-1">40%</div>
                                                <p className="text-gray-700 text-sm">
                                                    Evaluación realizada por los estudiantes a sus docentes
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-[#81bf20]/5 rounded-lg border border-[#81bf20]/20">
                                            <div className="p-2 bg-[#81bf20]/10 rounded-lg">
                                                <Users className="w-5 h-5 text-[#81bf20]" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[#81bf20] mb-1">Coevaluación</h4>
                                                <div className="text-2xl font-bold text-[#81bf20] mb-1">30%</div>
                                                <p className="text-gray-700 text-sm">
                                                    Evaluación entre pares docentes del mismo departamento
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-[#9333ea]/5 rounded-lg border border-[#9333ea]/20">
                                            <div className="p-2 bg-[#9333ea]/10 rounded-lg">
                                                <CheckSquare className="w-5 h-5 text-[#9333ea]" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[#9333ea] mb-1">Eval. Autoridades</h4>
                                                <div className="text-2xl font-bold text-[#9333ea] mb-1">20%</div>
                                                <p className="text-gray-700 text-sm">
                                                    Evaluación realizada por las autoridades académicas
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <BarChart2 className="w-5 h-5 text-gray-600" />
                                        Cálculo del Promedio General
                                    </h4>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-2">Fórmula de cálculo:</div>
                                        <div className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200">
                                            <div className="text-center">
                                                <span className="text-[#189cbf]">Autoevaluación × 0.10</span>
                                                <span className="text-gray-500"> + </span>
                                                <span className="text-[#930f4b]">Heteroevaluación × 0.40</span>
                                                <span className="text-gray-500"> + </span>
                                                <br />
                                                <span className="text-[#81bf20]">Coevaluación × 0.30</span>
                                                <span className="text-gray-500"> + </span>
                                                <span className="text-[#9333ea]">Eval. Autoridades × 0.20</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Interpretación de Resultados
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-green-700 font-medium">80-100: Excelente</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="text-yellow-700 font-medium">60-79: Bueno</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-red-700 font-medium">0-59: Mejorable</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Notas importantes:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Si algún tipo de evaluación no está disponible, aparecerá como "N/A"</li>
                                        <li>• Los resultados se actualizan en tiempo real conforme se completan las evaluaciones</li>
                                        <li>• La ponderación es establecida por la institución y no puede ser modificada</li>
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

// Componentes simplificados
interface CardProps {
    titulo: string;
    valor: string;
    cambio: string;
    icono: React.ReactNode;
    color: string;
    iconBg: string;
    tendencia: 'up' | 'down';
}

// CardDashboard con animación de contador
const CardDashboard = ({ titulo, valor, cambio, icono, color, iconBg, tendencia }: CardProps) => {
    // Detectar si el valor es numérico (o numérico con /100 o %)
    let displayValue = valor;
    let countUpValue = null;
    let decimals = 0;
    if (/^\d+(\.\d+)?$/.test(valor)) {
        countUpValue = useCountUp(Number(valor), 1200, 0);
        displayValue = Math.round(countUpValue).toString();
    } else if (/^(\d+)(\.\d+)?\/100$/.test(valor)) {
        // Ejemplo: 85/100
        const num = Number(valor.split("/")[0]);
        countUpValue = useCountUp(num, 1200, 0);
        displayValue = `${Math.round(countUpValue)}/100`;
    } else if (/^(\d+)(\.\d+)?%$/.test(valor)) {
        // Ejemplo: 75.5%
        const num = Number(valor.replace("%", ""));
        decimals = valor.includes(".") ? 1 : 0;
        countUpValue = useCountUp(num, 1200, decimals);
        displayValue = `${countUpValue.toFixed(decimals)}%`;
    }
    return (
        <div className={`p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2 ${color}`} data-aos="fade-up">
            <div className={`w-12 h-12 flex items-center justify-center rounded-lg shadow-sm mb-2 ${iconBg}`}>{icono}</div>
            <div className="text-sm text-gray-500 font-medium mb-1">{titulo}</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
                {countUpValue !== null ? displayValue : valor}
            </div>
            <div className="flex items-center gap-2 text-xs">
                {tendencia === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={tendencia === "up" ? "text-green-600" : "text-red-600"}>{cambio}</span>
            </div>
        </div>
    );
};

interface CardParticipacionProps {
    tipo: string;
    completadas: number;
    esperadas: number;
    porcentaje: number;
}

const CardParticipacion = ({ tipo, completadas, esperadas, porcentaje }: CardParticipacionProps) => {
    const getConfigByTipo = (tipo: string) => {
        if (tipo.toLowerCase().includes('auto')) {
            return {
                bg: 'bg-[#189cbf]/10',
                iconBg: 'bg-[#189cbf]/20',
                text: 'text-[#189cbf]',
                progress: 'bg-[#189cbf]',
                icon: <User className="w-4 h-4" />
            };
        }
        if (tipo.toLowerCase().includes('hetero')) {
            return {
                bg: 'bg-[#930f4b]/10',
                iconBg: 'bg-[#930f4b]/20',
                text: 'text-[#930f4b]',
                progress: 'bg-[#930f4b]',
                icon: <Users className="w-4 h-4" />
            };
        }
        if (tipo.toLowerCase().includes('coe')) {
            return {
                bg: 'bg-[#81bf20]/10',
                iconBg: 'bg-[#81bf20]/20',
                text: 'text-[#81bf20]',
                progress: 'bg-[#81bf20]',
                icon: <UserCheck className="w-4 h-4" />
            };
        }
        return {
            bg: 'bg-gray-50',
            iconBg: 'bg-gray-100',
            text: 'text-gray-600',
            progress: 'bg-gray-500',
            icon: <Activity className="w-4 h-4" />
        };
    };

    const config = getConfigByTipo(tipo);

    // Calcular la tendencia con indicadores más visuales
    const getTendencia = () => {
        if (porcentaje >= 80) {
            return {
                color: 'text-green-600',
                bg: 'bg-green-100',
                icon: <TrendingUp className="w-3 h-3" />,
                dot: 'bg-green-500',
                text: 'Excelente'
            };
        }
        if (porcentaje >= 50) {
            return {
                color: 'text-yellow-600',
                bg: 'bg-yellow-100',
                icon: <Minus className="w-3 h-3" />,
                dot: 'bg-yellow-500',
                text: 'Regular'
            };
        }
        return {
            color: 'text-red-600',
            bg: 'bg-red-100',
            icon: <TrendingDown className="w-3 h-3" />,
            dot: 'bg-red-500',
            text: 'Baja'
        };
    };

    const tendencia = getTendencia();

    return (
        <div className={`relative p-4 rounded-xl ${config.bg} shadow-sm hover:shadow-md transition-all duration-200`}>
            {/* Header con ícono en la esquina */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${config.text} mb-1`}>
                        {tipo}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${config.text}`}>
                            {porcentaje}%
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${tendencia.bg}`}>
                            <div className={`w-2 h-2 rounded-full ${tendencia.dot}`}></div>
                            <span className={`text-xs ${tendencia.color}`}>
                                {tendencia.icon}
                            </span>
                            <span className={`text-xs font-medium ${tendencia.color}`}>
                                {tendencia.text}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={`${config.iconBg} p-2 rounded-lg`}>
                    <div className={config.text}>
                        {config.icon}
                    </div>
                </div>
            </div>

            {/* Progress bar con subtítulo */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 font-medium">
                        Participación de usuarios
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                        {Math.min(porcentaje, 100).toFixed(1)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full ${config.progress} rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Footer compacto */}
            <div className="flex items-center gap-1 text-xs">
                <span className={`${config.text} opacity-80`}>
                    {completadas} de {esperadas} evaluaciones
                </span>
            </div>
        </div>
    );
};

const MapaCalor = ({ datos }: { datos: DatosMapaCalor }) => {
    const secciones = ['actitudinal', 'conceptual', 'procedimental'] as const;
    const evaluaciones = ['autoevaluacion', 'heteroevaluacion', 'coevaluacion'] as const;

    const etiquetasSecciones: Record<typeof secciones[number], string> = {
        actitudinal: 'Ser (Actitudinal)',
        conceptual: 'Saber (Conceptual)',
        procedimental: 'Hacer (Procedimental)'
    };

    const etiquetasEvaluaciones: Record<typeof evaluaciones[number], string> = {
        autoevaluacion: 'Autoevaluación',
        heteroevaluacion: 'Heteroevaluación',
        coevaluacion: 'Coevaluación'
    };

    // Ajustado para escala del 1 al 5
    const getColorPorPuntaje = (puntaje: number) => {
        if (puntaje >= 4) return 'bg-green-500';
        if (puntaje >= 3) return 'bg-yellow-500';
        if (puntaje >= 2) return 'bg-orange-500';
        if (puntaje >= 1) return 'bg-red-500';
        return 'bg-gray-300';
    };

    const getIntensidad = (puntaje: number) => {
        if (puntaje >= 4) return 'opacity-100';
        if (puntaje >= 3) return 'opacity-75';
        if (puntaje >= 2) return 'opacity-50';
        if (puntaje >= 1) return 'opacity-25';
        return 'opacity-20';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mt-6">
            <div className="mb-3">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Mapa de Calor por Secciones
                </h3>
                <p className="text-sm text-gray-600">
                    Visualización de promedios por tipo de competencia y evaluación
                </p>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left p-2 text-sm font-medium text-gray-700">
                                    Sección
                                </th>
                                {evaluaciones.map(evaluacion => (
                                    <th key={evaluacion} className="text-center p-2 text-sm font-medium text-gray-700">
                                        {etiquetasEvaluaciones[evaluacion]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {secciones.map(seccion => (
                                <tr key={seccion} className="border-t border-gray-200">
                                    <td className="p-2">
                                        <div className="font-medium text-gray-900 text-sm">
                                            {etiquetasSecciones[seccion]}
                                        </div>
                                    </td>
                                    {evaluaciones.map(evaluacion => {
                                        const puntaje = datos.mapaCalor[seccion][evaluacion];
                                        const estadistica = datos.estadisticas[seccion]?.[evaluacion];

                                        return (
                                            <td key={evaluacion} className="p-2 text-center">
                                                <div className="relative group">
                                                    <div
                                                        className={`
                              w-12 h-12 mx-auto rounded-lg flex items-center justify-center text-white font-bold text-xs
                              ${getColorPorPuntaje(puntaje)} ${getIntensidad(puntaje)}
                              transition-all duration-200 hover:scale-110 cursor-pointer
                            `}
                                                    >
                                                        {puntaje > 0 ? puntaje.toFixed(1) : 'N/A'}
                                                    </div>

                                                    {/* Tooltip - posición inteligente */}
                                                    <div className={`
                                                        absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20
                                                        ${seccion === 'actitudinal' ? 'top-full left-1/2 transform -translate-x-1/2 mt-2' : 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'}
                                                    `}>
                                                        <div className="bg-gray-900 text-white p-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
                                                            <div className="font-medium">{etiquetasSecciones[seccion]}</div>
                                                            <div>{etiquetasEvaluaciones[evaluacion]}</div>
                                                            <div>Promedio: {puntaje > 0 ? puntaje.toFixed(2) : 'N/A'}</div>
                                                            {estadistica && (
                                                                <>
                                                                    <div>Respuestas: {estadistica.total_respuestas}</div>
                                                                    <div>Docentes: {estadistica.docentes_evaluados}</div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600">Excelente (4.0-5.0)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-600">Bueno (3.0-3.9)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-gray-600">Regular (2.0-2.9)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-600">Bajo (1.0-1.9)</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardGeneral; 