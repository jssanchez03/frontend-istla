import axios from 'axios';

// Configuración de la URL base - usa una URL fija o configura variables de entorno de React
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://evaluacion.istla-sigala.edu.ec/api/api';

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

export interface PeriodoInfo {
    id_periodo: number;
    descripcion_periodo: string;
}

export interface AutoridadFirma {
    id_autoridad: number;
    nombre_autoridad: string;
    cargo_autoridad: string;
    orden_firma: number;
    created_at?: string;
    updated_at?: string;
}

export interface ReporteResponse {
    success: boolean;
    message?: string;
    data?: AsignacionCoevaluacion[];
    error?: string;
}

export interface AutoridadesResponse {
    success: boolean;
    message?: string;
    data?: AutoridadFirma[];
    error?: string;
}

export interface EstadisticasGenerales {
    totalAsignaciones: number;
    totalEvaluadores: number;
    totalEvaluados: number;
    totalCarreras: number;
    asignacionesPorCarrera: Array<{
        carrera: string;
        total: number;
    }>;
    asignacionesPorEstado: Array<{
        estado: string;
        total: number;
    }>;
}

interface ReporteResponses {
    success: boolean;
    data?: AsignacionCoevaluacion[];
    message?: string;
}

class ReporteCoevaluacionService {
    private axiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: `${API_BASE_URL}/v1`,
            timeout: 30000, // 30 segundos para reportes
        });

        // Interceptor para agregar token de autenticación
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Interceptor para manejar errores globalmente
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('Error en servicio de reporte:', error);
                if (error.response?.status === 401) {
                    // Token expirado o inválido
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Genera y descarga el reporte PDF
     */
    async generarReportePDF(idPeriodo: number): Promise<void> {
        try {
            const response = await this.axiosInstance.get(`/generar/${idPeriodo}`, {
                responseType: 'blob', // Importante para manejar archivos binarios
            });

            // Crear blob del PDF
            const blob = new Blob([response.data], { type: 'application/pdf' });

            // Crear URL temporal para descarga
            const url = window.URL.createObjectURL(blob);

            // Crear elemento de descarga temporal
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_coevaluaciones_periodo_${idPeriodo}.pdf`;
            document.body.appendChild(link);

            // Activar descarga
            link.click();

            // Limpiar recursos
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 404) {
                    throw new Error('No se encontraron asignaciones para el período seleccionado');
                } else if (error.response?.status === 500) {
                    throw new Error('Error interno del servidor al generar el reporte');
                } else {
                    throw new Error('Error de conexión al generar el reporte');
                }
            }
            throw error;
        }
    }

    /**
     * Obtiene vista previa de los datos del reporte
     */
    async previsualizarDatos(idPeriodo: number): Promise<AsignacionCoevaluacion[]> {
        try {
            const response = await this.axiosInstance.get<ReporteResponse>(`/preview/${idPeriodo}`);

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
                    throw new Error('No se encontraron asignaciones para el período seleccionado');
                } else if (error.response?.status === 400) {
                    throw new Error('ID de período inválido');
                } else {
                    throw new Error('Error al obtener los datos del reporte');
                }
            }
            throw error;
        }
    }

    /**
     *  Genera y descarga el reporte Excel
     */
    async generarReporteExcel(idPeriodo: number): Promise<void> {
        try {
            const response = await this.axiosInstance.get(`/generar-excel/${idPeriodo}`, {
                responseType: 'blob', // Importante para manejar archivos binarios
            });

            // Crear blob del Excel
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Crear URL temporal para descarga
            const url = window.URL.createObjectURL(blob);

            // Crear elemento de descarga temporal
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_coevaluaciones_periodo_${idPeriodo}.xlsx`;
            document.body.appendChild(link);

            // Activar descarga
            link.click();

            // Limpiar recursos
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 404) {
                    throw new Error('No se encontraron asignaciones para el período seleccionado');
                } else if (error.response?.status === 500) {
                    throw new Error('Error interno del servidor al generar el reporte Excel');
                } else {
                    throw new Error('Error de conexión al generar el reporte Excel');
                }
            }
            throw error;
        }
    }

    /**
     * 🆕 NUEVO: Obtiene vista previa de los datos generales (todas las carreras) - Solo para administradores
     */
    async previsualizarDatosGenerales(idPeriodo: number): Promise<AsignacionCoevaluacion[]> {
        try {
            const response = await this.axiosInstance.get<ReporteResponses>(`/preview/${idPeriodo}`);

            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Error al obtener datos de previsualización general');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 403) {
                    throw new Error('No tienes permisos para acceder a los datos generales');
                } else if (error.response?.status === 404) {
                    throw new Error('No se encontraron asignaciones para el período seleccionado');
                } else if (error.response?.status === 400) {
                    throw new Error('ID de período inválido');
                } else {
                    throw new Error('Error al obtener los datos del reporte general');
                }
            }
            throw error;
        }
    }

    // /**
    //  * 🆕 NUEVO: Obtiene estadísticas generales (todas las carreras) - Solo para administradores
    //  */
    // async obtenerEstadisticasGenerales(idPeriodo: number): Promise<EstadisticasGenerales> {
    //     try {
    //         const response = await this.axiosInstance.get<EstadisticasResponse>(`/estadisticas-generales/${idPeriodo}`);

    //         if (response.data.success && response.data.data) {
    //             return response.data.data;
    //         } else {
    //             throw new Error(response.data.message || 'Error al obtener estadísticas generales');
    //         }
    //     } catch (error) {
    //         if (axios.isAxiosError(error)) {
    //             if (error.response?.status === 401) {
    //                 throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
    //             } else if (error.response?.status === 403) {
    //                 throw new Error('No tienes permisos para acceder a las estadísticas generales');
    //             } else if (error.response?.status === 404) {
    //                 throw new Error('No se encontraron datos para el período seleccionado');
    //             } else if (error.response?.status === 400) {
    //                 throw new Error('ID de período inválido');
    //             } else {
    //                 throw new Error('Error al obtener las estadísticas generales');
    //             }
    //         }
    //         throw error;
    //     }
    // }

    /**
     * 🆕 NUEVO: Genera y descarga el reporte PDF general (todas las carreras) - Solo para administradores
     */
    async generarReporteGeneralPDF(idPeriodo: number): Promise<void> {
        try {
            const response = await this.axiosInstance.get(`/generar/${idPeriodo}`, {
                responseType: 'blob',
            });

            // Crear y descargar el archivo PDF
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_coevaluaciones_general_periodo_${idPeriodo}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 403) {
                    throw new Error('No tienes permisos para generar reportes generales');
                } else if (error.response?.status === 404) {
                    throw new Error('No se encontraron asignaciones para generar el reporte general');
                } else if (error.response?.status === 400) {
                    throw new Error('ID de período inválido');
                } else {
                    throw new Error('Error al generar el reporte PDF general');
                }
            }
            throw error;
        }
    }

    /**
     * 🆕 NUEVO: Genera y descarga el reporte Excel general (todas las carreras) - Solo para administradores
     */
    async generarReporteExcelGeneral(idPeriodo: number): Promise<void> {
        try {
            const response = await this.axiosInstance.get(`/generar-excel-general/${idPeriodo}`, {
                responseType: 'blob',
            });

            // Crear y descargar el archivo Excel
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_coevaluaciones_general_periodo_${idPeriodo}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 403) {
                    throw new Error('No tienes permisos para generar reportes generales');
                } else if (error.response?.status === 404) {
                    throw new Error('No se encontraron asignaciones para generar el reporte general');
                } else if (error.response?.status === 400) {
                    throw new Error('ID de período inválido');
                } else {
                    throw new Error('Error al generar el reporte Excel general');
                }
            }
            throw error;
        }
    }

    /**
     * 🆕 NUEVO: Obtiene las autoridades disponibles para firmas
     */
    async obtenerAutoridadesParaFirmas(): Promise<AutoridadFirma[]> {
        try {
            const response = await this.axiosInstance.get<AutoridadesResponse>('/autoridades-firmas');

            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Error al obtener autoridades para firmas');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 404) {
                    throw new Error('No se encontraron autoridades configuradas');
                } else {
                    throw new Error('Error al obtener las autoridades para firmas');
                }
            }
            throw error;
        }
    }

    /**
     * 🆕 NUEVO: Crea una nueva autoridad para firmas
     */
    async crearAutoridadFirma(autoridad: Omit<AutoridadFirma, 'id_autoridad' | 'created_at' | 'updated_at'>): Promise<AutoridadFirma> {
        try {
            // ✅ VALIDACIÓN SIN ACTIVO
            if (!autoridad.nombre_autoridad || !autoridad.cargo_autoridad) {
                throw new Error('Los campos nombre_autoridad y cargo_autoridad son obligatorios');
            }

            const response = await this.axiosInstance.post<{ success: boolean; data: AutoridadFirma; message?: string }>('/autoridades-firmas', autoridad);

            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Error al crear autoridad para firmas');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 400) {
                    const errorMessage = error.response?.data?.message || 'Datos inválidos para crear la autoridad';
                    throw new Error(errorMessage);
                } else {
                    throw new Error('Error al crear la autoridad para firmas');
                }
            }
            throw error;
        }
    }

    /**
     * 🆕 ACTUALIZADO: Actualiza una autoridad existente
     */
    async actualizarAutoridadFirma(id: number, autoridad: Partial<Omit<AutoridadFirma, 'id_autoridad' | 'created_at' | 'updated_at'>>): Promise<AutoridadFirma> {
        try {
            const response = await this.axiosInstance.put<{ success: boolean; data: AutoridadFirma; message?: string }>(`/autoridades-firmas/${id}`, autoridad);

            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Error al actualizar autoridad para firmas');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 404) {
                    throw new Error('Autoridad no encontrada');
                } else if (error.response?.status === 400) {
                    // Mostrar el error específico del backend si está disponible
                    const errorMessage = error.response?.data?.message || 'Datos inválidos para actualizar la autoridad';
                    throw new Error(errorMessage);
                } else {
                    throw new Error('Error al actualizar la autoridad para firmas');
                }
            }
            throw error;
        }
    }

    /**
     * 🆕 NUEVO: Elimina una autoridad
     */
    async eliminarAutoridadFirma(id: number): Promise<void> {
        try {
            const response = await this.axiosInstance.delete<{ success: boolean; message?: string }>(`/autoridades-firmas/${id}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Error al eliminar autoridad para firmas');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 404) {
                    throw new Error('Autoridad no encontrada');
                } else {
                    throw new Error('Error al eliminar la autoridad para firmas');
                }
            }
            throw error;
        }
    }

    /**
     * Actualiza los órdenes de firma de múltiples autoridades
     */
    async actualizarOrdenesAutoridadesFirmas(actualizaciones: Array<{ id_autoridad: number, orden_firma: number }>): Promise<{ success: boolean, message: string }> {
        try {
            const response = await this.axiosInstance.put('/actualizar-ordenes', actualizaciones);

            if (response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Error al actualizar órdenes de autoridades');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente');
                } else if (error.response?.status === 400) {
                    throw new Error(error.response.data.message || 'Datos inválidos para actualizar órdenes');
                } else if (error.response?.status === 404) {
                    throw new Error('No se encontraron las autoridades especificadas');
                } else {
                    throw new Error('Error al actualizar los órdenes de las autoridades');
                }
            }
            throw error;
        }
    }

    /**
     * Agrupa las asignaciones por carrera y nivel para previsualización
     */
    agruparAsignacionesPorCarreraYNivel(asignaciones: AsignacionCoevaluacion[]) {
        const grupos: Record<string, Record<string, AsignacionCoevaluacion[]>> = {};

        asignaciones.forEach(asignacion => {
            const carreraNombre = asignacion.carrera?.nombre || 'Sin carrera';
            const nivelNombre = asignacion.nivel?.nombre || 'Sin nivel';

            if (!grupos[carreraNombre]) {
                grupos[carreraNombre] = {};
            }

            if (!grupos[carreraNombre][nivelNombre]) {
                grupos[carreraNombre][nivelNombre] = [];
            }

            grupos[carreraNombre][nivelNombre].push(asignacion);
        });

        return grupos;
    }

    /**
     * Formatea la fecha para mostrar
     */
    formatearFecha(fecha: string): string {
        try {
            return new Date(fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    }

    /**
     * Formatea la hora para mostrar
     */
    formatearHora(hora: string): string {
        try {
            if (hora.includes(':')) {
                const [hours, minutes] = hora.split(':');
                return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            }
            return hora;
        } catch {
            return 'Hora inválida';
        }
    }

    /**
     * Valida si hay datos suficientes para generar el reporte
     */
    validarDatosReporte(asignaciones: AsignacionCoevaluacion[]): boolean {
        return asignaciones.length > 0 &&
            asignaciones.some(a => a.nombre_evaluador && a.nombre_evaluado);
    }

    /**
     * Obtiene estadísticas básicas del reporte
     */
    obtenerEstadisticasReporte(asignaciones: AsignacionCoevaluacion[]) {
        const totalAsignaciones = asignaciones.length;
        const evaluadoresUnicos = new Set(asignaciones.map(a => a.id_docente_evaluador)).size;
        const evaluadosUnicos = new Set(asignaciones.map(a => a.id_docente_evaluado)).size;
        const asignaturasUnicas = new Set(asignaciones.map(a => a.id_asignatura)).size;
        const carrerasUnicas = new Set(asignaciones.map(a => a.carrera?.nombre)).size;
        const nivelesUnicos = new Set(asignaciones.map(a => a.nivel?.nombre)).size;

        return {
            totalAsignaciones,
            evaluadoresUnicos,
            evaluadosUnicos,
            asignaturasUnicas,
            carrerasUnicas,
            nivelesUnicos
        };
    }
}

export default new ReporteCoevaluacionService();