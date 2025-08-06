import axios from "axios";

// Interfaces
export interface Periodo {
    id: number;
    nombre: string;
}

export interface Docente {
    id: number;
    nombre: string;
}

export interface Formulario {
    id_formulario: number;
    nombre: string;
    tipo?: string; // Tipo inferido del nombre (autoevaluacion, heteroevaluacion, coevaluacion)
}

export interface Pregunta {
    id_pregunta: number;
    id_formulario: number;
    texto: string;
    tipo_pregunta: string;
}

export interface Evaluacion {
    id: number;
    periodo: string;
    formulario: string;
    fecha: string;
    estado: string;
}

// Servicio para obtener periodos
export const obtenerPeriodos = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("https://evaluacion.istla-sigala.edu.ec/api/api/v1/periodos", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Servicio para obtener docentes por periodo
export const obtenerDocentesPorPeriodo = async (idPeriodo: number) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/docentes/${idPeriodo}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Servicio para obtener resumen de evaluaciones por periodo
export const obtenerResumenEvaluaciones = async (idPeriodo: number) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/evaluaciones/resumen/periodo/${idPeriodo}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Servicio para obtener formularios
export const obtenerFormularios = async (): Promise<Formulario[]> => {
    const token = localStorage.getItem("token");
    const res = await axios.get("https://evaluacion.istla-sigala.edu.ec/api/api/v1/formularios", {
        headers: { Authorization: `Bearer ${token}` },
    });

    // Añadir el tipo de evaluación basado en el nombre del formulario
    return res.data.map((formulario: Formulario) => {
        const nombreLower = formulario.nombre.toLowerCase();
        let tipo = "";

        if (nombreLower.includes("autoevaluación") || nombreLower.includes("autoevaluacion")) {
            tipo = "autoevaluacion";
        } else if (nombreLower.includes("heteroevaluación") || nombreLower.includes("heteroevaluacion")) {
            tipo = "heteroevaluacion";
        } else if (nombreLower.includes("coevaluación") || nombreLower.includes("coevaluacion")) {
            tipo = "coevaluacion";
        }

        return {
            ...formulario,
            tipo
        };
    });
};

// Crear formulario
export const crearFormulario = async (data: { nombre: string }): Promise<Formulario> => {
    const token = localStorage.getItem("token");
    const res = await axios.post("https://evaluacion.istla-sigala.edu.ec/api/api/v1/formularios", data, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
    });
    return res.data;
};

// Actualizar formulario
export const actualizarFormulario = async (id: number, data: { nombre: string }): Promise<Formulario> => {
    const token = localStorage.getItem("token");
    const res = await axios.put(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/formularios/${id}`, data, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
    });
    return res.data;
};

// Eliminar formulario
export const eliminarFormulario = async (id: number): Promise<void> => {
    const token = localStorage.getItem("token");
    await axios.delete(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/formularios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Servicio para obtener todas las evaluaciones
export const obtenerTodasMisEvaluaciones = async (): Promise<any[]> => {
    const token = localStorage.getItem("token");
    const res = await axios.get("https://evaluacion.istla-sigala.edu.ec/api/api/v1/evaluaciones/todas-mis-evaluaciones", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Servicio para crear una evaluación
export const crearEvaluacion = async (data: {
    id_formulario: number;
    id_periodo: number;
    id_distributivo?: number;
    tipo: string;
    evaluado_id?: number;
}): Promise<any> => {
    const token = localStorage.getItem("token");
    const res = await axios.post("https://evaluacion.istla-sigala.edu.ec/api/api/v1/evaluaciones", data, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
    });
    return res.data;
};

// Servicio para eliminar una evaluación
export const eliminarEvaluacion = async (id: number): Promise<void> => {
    const token = localStorage.getItem("token");
    await axios.delete(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/evaluaciones/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Servicio para editar una evaluación
export const editarEvaluacion = async (id: number, data: any): Promise<any> => {
    const token = localStorage.getItem("token");
    const res = await axios.put(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/evaluaciones/${id}`, data, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
    });
    return res.data;
};

// Servicio para preguntas
export const obtenerPreguntasPorFormulario = async (idFormulario: number): Promise<Pregunta[]> => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/formularios/${idFormulario}/preguntas`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Servicio para crear una pregunta
export const crearPregunta = async (data: { id_formulario: number; texto: string; tipo_pregunta: string }): Promise<Pregunta> => {
    const token = localStorage.getItem("token");
    const res = await axios.post("https://evaluacion.istla-sigala.edu.ec/api/api/v1/preguntas", data, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
    });
    return res.data;
};

// Servicio para eliminar una pregunta
export const eliminarPregunta = async (id: number): Promise<void> => {
    const token = localStorage.getItem("token");
    await axios.delete(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/preguntas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Servicio para actualizar una pregunta
export const actualizarPregunta = async (id: number, data: { texto: string; tipo_pregunta: string }): Promise<Pregunta> => {
    const token = localStorage.getItem("token");
    const res = await axios.put(`https://evaluacion.istla-sigala.edu.ec/api/api/v1/preguntas/${id}`, data, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
    });
    return res.data;
};

// Servicio para notificar una evaluación
export const notificarEvaluacion = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Token no disponible");

    const response = await fetch(`/api/v1/evaluaciones/${id}/notificar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Error en respuesta');
        throw new Error(error.error || error.message || "Error al notificar evaluación");
    }

    const resultado = await response.json();
    return resultado;
};

export const notificarDocentesCoevaluacion = async (idPeriodo: number) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            `https://evaluacion.istla-sigala.edu.ec/api/api/v1/notificar-docentes-coevaluacion/${idPeriodo}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error al notificar docentes");
        throw error;
    }
};