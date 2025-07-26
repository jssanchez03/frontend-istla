import axios from "axios";

const API_URL = "https://evaluacion.istla-sigala.edu.ec/api/api/v1";

// Interfaces para los tipos de datos
export interface Carrera {
    id_carrera: number;
    nombre_carrera: string;
}

export interface Periodo {
    id_periodo: number;
    descripcion: string;
}

export interface ReporteCarreraParams {
    idCarrera: number;
    idPeriodo: number;
    numeroInicioOficio: number;
}

// Interfaces para coevaluaciones
export interface AsignacionCoevaluacion {
    id_asignacion: number;
    id_periodo: number;
    id_docente_evaluador: number;
    id_docente_evaluado: number;
    id_asignatura: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    dia: string;
    estado: string;
    nombre_evaluador: string;
    nombre_evaluado: string;
    nombre_asignatura: string;
    carrera: {
        id: number;
        nombre: string;
    };
    nivel: {
        id: number;
        nombre: string;
    };
}

export interface ReporteResponse {
    success: boolean;
    message?: string;
    data?: AsignacionCoevaluacion[];
    error?: string;
}

// Interfaces para el reporte de promedio por ítems
export interface EstadisticasGenerales {
    total_preguntas: number;
    promedio_general: string;
    tipo_evaluacion: string;
}

export interface PreguntaPromedio {
    texto_pregunta: string;
    promedio: string;
    total_respuestas: number;
    desviacion_estandar: string;
}

export interface PromediosPorTipo {
    actitudinal: PreguntaPromedio[];
    conceptual: PreguntaPromedio[];
    procedimental: PreguntaPromedio[];
}

export interface DatosPromedioItems {
    estadisticas_generales: EstadisticasGenerales;
    promedios_por_tipo: PromediosPorTipo;
}

// Parámetros para el reporte PDF de promedio por ítems
export interface ReportePromedioItemsParams {
    idPeriodo: number;
    tipoEvaluacion: number; // 1=autoevaluacion, 2=heteroevaluacion, 3=coevaluacion
}

// Obtener carreras activas (opcionalmente por periodo)
export const obtenerCarrerasActivas = async (idPeriodo?: number): Promise<Carrera[]> => {
    const token = localStorage.getItem("token");
    let url = `${API_URL}/reporte-carrera/carreras`;
    if (idPeriodo) {
        url += `?idPeriodo=${idPeriodo}`;
    }
    const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data;
};

// Obtener periodos
export const obtenerPeriodos = async (): Promise<Periodo[]> => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/reporte-carrera/periodos`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data;
};

// Generar reporte de carrera (descarga archivo Word)
export const generarReporteCarrera = async (params: ReporteCarreraParams): Promise<Blob> => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
        `${API_URL}/reporte-carrera/generar`,
        params,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            responseType: 'blob', // Importante para recibir el archivo
        }
    );
    return res.data;
};

// Función auxiliar para descargar el archivo
export const descargarReporte = (blob: Blob, nombreCarrera: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fechaActual = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_Evaluacion_${nombreCarrera.replace(/\s+/g, '_')}_${fechaActual}.docx`;

    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// ============= NUEVAS FUNCIONES PARA COEVALUACIONES =============

// Generar reporte PDF de coevaluaciones por carrera
export const generarReporteCoevaluacionPDF = async (idCarrera: number, idPeriodo: number): Promise<void> => {
    const token = localStorage.getItem("token");

    try {
        const response = await axios.get(
            `${API_URL}/generar-por-carrera/${idCarrera}/${idPeriodo}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
                timeout: 30000,
            }
        );

        // Crear blob del PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });

        // Obtener nombre de la carrera para el archivo
        const carreras = await obtenerCarrerasActivas(idPeriodo);
        const carrera = carreras.find(c => c.id_carrera === idCarrera);
        const nombreCarrera = carrera ? carrera.nombre_carrera : 'Carrera';

        // Crear URL temporal para descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const fechaActual = new Date().toISOString().split('T')[0];
        link.download = `Reporte_Coevaluaciones_${nombreCarrera.replace(/\s+/g, '_')}_${fechaActual}.pdf`;

        document.body.appendChild(link);
        link.click();

        // Limpiar recursos
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
            } else if (error.response?.status === 404) {
                throw new Error('No se encontraron asignaciones de coevaluación para la carrera y período seleccionados');
            } else if (error.response?.status === 500) {
                throw new Error('Error interno del servidor al generar el reporte');
            } else {
                throw new Error('Error de conexión al generar el reporte');
            }
        }
        throw error;
    }
};

// Generar reporte Excel de coevaluaciones por carrera
export const generarReporteCoevaluacionExcel = async (idCarrera: number, idPeriodo: number): Promise<void> => {
    const token = localStorage.getItem("token");

    try {
        const response = await axios.get(
            `${API_URL}/generar-excel-por-carrera/${idCarrera}/${idPeriodo}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
                timeout: 30000,
            }
        );

        // Crear blob del Excel
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Obtener nombre de la carrera para el archivo
        const carreras = await obtenerCarrerasActivas(idPeriodo);
        const carrera = carreras.find(c => c.id_carrera === idCarrera);
        const nombreCarrera = carrera ? carrera.nombre_carrera : 'Carrera';

        // Crear URL temporal para descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const fechaActual = new Date().toISOString().split('T')[0];
        link.download = `Reporte_Coevaluaciones_${nombreCarrera.replace(/\s+/g, '_')}_${fechaActual}.xlsx`;

        document.body.appendChild(link);
        link.click();

        // Limpiar recursos
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
            } else if (error.response?.status === 404) {
                throw new Error('No se encontraron asignaciones de coevaluación para la carrera y período seleccionados');
            } else if (error.response?.status === 500) {
                throw new Error('Error interno del servidor al generar el reporte Excel');
            } else {
                throw new Error('Error de conexión al generar el reporte Excel');
            }
        }
        throw error;
    }
};

// Previsualizar datos de coevaluaciones por carrera
export const previsualizarCoevaluacionesPorCarrera = async (idCarrera: number, idPeriodo: number): Promise<AsignacionCoevaluacion[]> => {
    const token = localStorage.getItem("token");

    try {
        const response = await axios.get<ReporteResponse>(
            `${API_URL}/preview-por-carrera/${idCarrera}/${idPeriodo}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 30000,
            }
        );

        if (response.data.success && response.data.data) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Error al obtener datos de previsualización');
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
            } else if (error.response?.status === 404) {
                throw new Error('No se encontraron asignaciones de coevaluación para la carrera y período seleccionados');
            } else if (error.response?.status === 400) {
                throw new Error('ID de carrera o período inválido');
            } else {
                throw new Error('Error al obtener los datos del reporte');
            }
        }
        throw error;
    }
};

// Funciones auxiliares para manejo de datos
export const obtenerEstadisticasReporte = (datos: AsignacionCoevaluacion[]) => {
    const evaluadoresUnicos = new Set(datos.map(d => d.id_docente_evaluador)).size;
    const evaluadosUnicos = new Set(datos.map(d => d.id_docente_evaluado)).size;
    const asignaturasUnicas = new Set(datos.map(d => d.id_asignatura)).size;
    const carrerasUnicas = new Set(datos.map(d => d.carrera.id)).size;
    const nivelesUnicos = new Set(datos.map(d => d.nivel.id)).size;

    return {
        totalAsignaciones: datos.length,
        evaluadoresUnicos,
        evaluadosUnicos,
        asignaturasUnicas,
        carrerasUnicas,
        nivelesUnicos,
    };
};

export const agruparAsignacionesPorNivel = (datos: AsignacionCoevaluacion[]) => {
    return datos.reduce((acc, asignacion) => {
        const nivel = asignacion.nivel.nombre;
        if (!acc[nivel]) {
            acc[nivel] = [];
        }
        acc[nivel].push(asignacion);
        return acc;
    }, {} as { [key: string]: AsignacionCoevaluacion[] });
};

export const formatearFecha = (fecha: string): string => {
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return fecha;
    }
};

export const formatearHora = (hora: string): string => {
    try {
        const [hours, minutes] = hora.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return hora;
    }
};


//Nuevas funciones para calificaciones PDF
// Generar reporte PDF por carrera específica
export const generarReporteCalificacionPorCarreraPDF = async (idCarrera: number, idPeriodo: number): Promise<void> => {
    const token = localStorage.getItem("token");

    try {
        const response = await axios.get(
            `${API_URL}/reportes-calificacion-carrera/generar-por-carrera/${idCarrera}/${idPeriodo}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
                timeout: 30000,
            }
        );

        // Crear blob del PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });

        // Obtener nombre de la carrera para el archivo
        const carreras = await obtenerCarrerasActivas(idPeriodo);
        const carrera = carreras.find(c => c.id_carrera === idCarrera);
        const nombreCarrera = carrera ? carrera.nombre_carrera : 'Carrera';

        // Crear URL temporal para descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const fechaActual = new Date().toISOString().split('T')[0];
        link.download = `Reporte_Calificaciones_${nombreCarrera.replace(/\s+/g, '_')}_${fechaActual}.pdf`;

        document.body.appendChild(link);
        link.click();

        // Limpiar recursos
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
            } else if (error.response?.status === 404) {
                throw new Error('No se encontraron docentes para la carrera y período seleccionados');
            } else if (error.response?.status === 500) {
                throw new Error('Error interno del servidor al generar el reporte');
            } else {
                throw new Error('Error de conexión al generar el reporte');
            }
        }
        throw error;
    }
};

// Generar reporte PDF de todas las carreras
export const generarReporteCalificacionTodasCarrerasPDF = async (idPeriodo: number): Promise<void> => {
    const token = localStorage.getItem("token");

    try {
        const response = await axios.get(
            `${API_URL}/reportes-calificacion-carrera/generar-todas-carreras/${idPeriodo}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
                timeout: 30000,
            }
        );

        // Crear blob del PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });

        // Crear URL temporal para descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const fechaActual = new Date().toISOString().split('T')[0];
        link.download = `Reporte_Calificaciones_Todas_Carreras_${fechaActual}.pdf`;

        document.body.appendChild(link);
        link.click();

        // Limpiar recursos
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
            } else if (error.response?.status === 404) {
                throw new Error('No se encontraron docentes para el período seleccionado');
            } else if (error.response?.status === 500) {
                throw new Error('Error interno del servidor al generar el reporte');
            } else {
                throw new Error('Error de conexión al generar el reporte');
            }
        }
        throw error;
    }
};

// Obtener datos del reporte (sin generar PDF)
export const obtenerDatosReporteCalificacion = async (idCarrera: number | string, idPeriodo: number) => {
    const token = localStorage.getItem("token");

    try {
        const response = await axios.get(
            `${API_URL}/reportes-calificacion-carrera/datos/${idCarrera}/${idPeriodo}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000,
            }
        );

        return response.data.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
            } else if (error.response?.status === 404) {
                throw new Error('No se encontraron datos para los parámetros seleccionados');
            } else {
                throw new Error('Error al obtener los datos del reporte');
            }
        }
        throw error;
    }
};


// Nuevas funciones para promedios por ítems
// Obtener datos de promedio por ítems (para mostrar en pantalla)
export const obtenerPromedioItemsPorTipo = async (
    idPeriodo: number,
    tipoEvaluacion: number
): Promise<DatosPromedioItems> => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
        `${API_URL}/promedio-items/${idPeriodo}/${tipoEvaluacion}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return res.data.data;
};

// Generar reporte PDF de promedio por ítems (descarga archivo PDF)
export const generarReportePDFPromedioItems = async (
    params: ReportePromedioItemsParams
): Promise<Blob> => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
        `${API_URL}/promedio-items-pdf/${params.idPeriodo}/${params.tipoEvaluacion}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob', // Importante para recibir el archivo PDF
        }
    );
    return res.data;
};

// Función auxiliar para descargar el archivo PDF
export const descargarReportePDFPromedioItems = async (
    params: ReportePromedioItemsParams,
    nombreArchivo?: string
): Promise<void> => {
    try {
        const blob = await generarReportePDFPromedioItems(params);

        // Crear un enlace temporal para la descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Determinar el nombre del archivo
        const tipoEvaluacionNombre = {
            1: 'autoevaluacion',
            2: 'heteroevaluacion',
            3: 'coevaluacion'
        }[params.tipoEvaluacion] || 'evaluacion';

        link.download = nombreArchivo || `reporte_promedios_${tipoEvaluacionNombre}_${params.idPeriodo}.pdf`;

        // Ejecutar la descarga
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al descargar el reporte PDF:', error);
        throw error;
    }
};

// Función auxiliar para obtener el nombre del tipo de evaluación
export const obtenerNombreTipoEvaluacion = (tipoEvaluacion: number): string => {
    const nombres = {
        1: 'Autoevaluación',
        2: 'Heteroevaluación',
        3: 'Coevaluación'
    };
    return nombres[tipoEvaluacion as keyof typeof nombres] || 'Evaluación';
};