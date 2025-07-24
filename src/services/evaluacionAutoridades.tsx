import axios from 'axios';

// Interfaces para tipado
export interface Periodo {
    id_periodo: number;
    descripcion: string;
}

export interface Carrera {
    id_carrera: number;
    nombre_carrera: string;
}

export interface Docente {
    id_docente: number;
    cedula_docente: string;
    nombres_completos: string;
    nombre_carrera: string;
    materias?: string;
}

export interface EvaluacionData {
    id_periodo: number;
    id_docente_evaluado: number;
    id_carrera: number;
    calificacion: number;
    evaluador_cedula: string;
    evaluador_nombres: string;
    evaluador_apellidos: string;
    observaciones?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

const API_URL = "http://localhost:3000/api/v1";

class EvaluacionAutoridadesService {

    /**
     * Obtener datos iniciales (períodos y carreras)
     */
    async obtenerDatosIniciales(idPeriodo?: string): Promise<ApiResponse<{ periodos: Periodo[]; carreras: Carrera[] }>> {
        const token = localStorage.getItem("token");
        let url = `${API_URL}/evaluacion-autoridades/datos-iniciales`;
        if (idPeriodo) {
            url += `?idPeriodo=${idPeriodo}`;
        }
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    }

    /**
     * Obtener docentes por período y carrera
     */
    async obtenerDocentes(idPeriodo: number, idCarrera: number): Promise<ApiResponse<Docente[]>> {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/evaluacion-autoridades/docentes`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { idPeriodo, idCarrera }
        });
        return res.data;
    }

    /**
     * Crear nueva evaluación de autoridad
     */
    async crearEvaluacion(evaluacionData: EvaluacionData): Promise<ApiResponse<any>> {
        const token = localStorage.getItem("token");
        const res = await axios.post(`${API_URL}/evaluacion-autoridades/evaluacion`, evaluacionData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    }

    /**
     * Obtener evaluaciones por período
     */
    async obtenerEvaluacionesPorPeriodo(idPeriodo: number): Promise<ApiResponse<any[]>> {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/evaluacion-autoridades/evaluaciones/${idPeriodo}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    }

    /**
     * Obtener evaluación específica de un docente
     */
    async obtenerEvaluacionDocente(
        idPeriodo: number,
        idDocente: number,
        evaluadorCedula: string
    ): Promise<ApiResponse<any>> {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/evaluacion-autoridades/evaluacion/${idPeriodo}/${idDocente}/${evaluadorCedula}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    }

    /**
     * Actualizar evaluación existente
     */
    async actualizarEvaluacion(idEvaluacion: number, datos: Partial<EvaluacionData>): Promise<ApiResponse<any>> {
        const token = localStorage.getItem("token");
        const res = await axios.put(`${API_URL}/evaluacion-autoridades/evaluacion/${idEvaluacion}`, datos, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    }

    /**
     * Eliminar evaluación
     */
    async eliminarEvaluacion(idEvaluacion: number): Promise<ApiResponse<any>> {
        const token = localStorage.getItem("token");
        const res = await axios.delete(`${API_URL}/evaluacion-autoridades/evaluacion/${idEvaluacion}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    }

    /**
     * Obtener resumen de evaluaciones por período
     */
    async obtenerResumen(idPeriodo: number): Promise<ApiResponse<any>> {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/evaluacion-autoridades/resumen/${idPeriodo}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    }

    /**
     * Validar calificación
     */
    validarCalificacion(calificacion: number): boolean {
        return !isNaN(calificacion) && calificacion >= 0 && calificacion <= 100;
    }
}

export default new EvaluacionAutoridadesService();