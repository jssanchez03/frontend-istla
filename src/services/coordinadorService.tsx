import axios from 'axios';

const API_BASE_URL = 'https://evaluacion.istla-sigala.edu.ec/api/api/v1';

export interface Coordinador {
    cedula: string;
    apellidos: string;
    nombres: string;
    correo: string;
}

export interface Carrera {
    id_carrera: number;
    nombre_carrera: string;
}

export interface AsignacionCoordinador {
    id_coordinador_carrera: number;
    cedula_coordinador: string;
    nombres_coordinador: string;
    apellidos_coordinador: string;
    correo_coordinador: string;
    id_carrera: number;
    nombre_carrera: string;
    estado: string;
    fecha_asignacion: string;
}

export interface CoordinadorData {
    cedula: string;
    nombres: string;
    apellidos: string;
    correo: string;
    id_carrera: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

class CoordinadorService {
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };
    }

    // Obtener datos para los selects (coordinadores y carreras)
    async obtenerDatosSelects(): Promise<ApiResponse<{ coordinadores: Coordinador[]; carreras: Carrera[] }>> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/datos-selects`,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error: any) {
            console.error('Error al obtener datos de selects:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al obtener datos de los selects',
                error: error.message,
            };
        }
    }

    // Obtener todas las asignaciones de coordinadores
    async obtenerAsignaciones(): Promise<ApiResponse<AsignacionCoordinador[]>> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/coordinadores/asignaciones`,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error: any) {
            console.error('Error al obtener asignaciones:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al obtener las asignaciones',
                error: error.message,
            };
        }
    }

    // Obtener coordinador por ID
    async obtenerCoordinadorPorId(id: number): Promise<ApiResponse<AsignacionCoordinador>> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/coordinadores/asignaciones/${id}`,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error: any) {
            console.error('Error al obtener coordinador por ID:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al obtener el coordinador',
                error: error.message,
            };
        }
    }

    // Crear nueva asignación de coordinador
    async crearAsignacion(coordinadorData: CoordinadorData): Promise<ApiResponse<{ id: number }>> {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/coordinadores/asignaciones`,
                coordinadorData,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error: any) {
            console.error('Error al crear asignación:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al crear la asignación',
                error: error.message,
            };
        }
    }

    // Actualizar asignación de coordinador
    async actualizarAsignacion(id: number, coordinadorData: CoordinadorData): Promise<ApiResponse<any>> {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/coordinadores/asignaciones/${id}`,
                coordinadorData,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error: any) {
            console.error('Error al actualizar asignación:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al actualizar la asignación',
                error: error.message,
            };
        }
    }

    // Eliminar asignación de coordinador
    async eliminarAsignacion(id: number): Promise<ApiResponse<any>> {
        try {
            const response = await axios.delete(
                `${API_BASE_URL}/coordinadores/asignaciones/${id}`,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error: any) {
            console.error('Error al eliminar asignación:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al eliminar la asignación',
                error: error.message,
            };
        }
    }
}

export default new CoordinadorService();