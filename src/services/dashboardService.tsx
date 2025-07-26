import axios from "axios";

const API_URL = "https://evaluacion.istla-sigala.edu.ec/api/api/v1";

export const obtenerEstadisticasGenerales = async (periodo: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/estadisticas-generales`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { periodo },
  });
  return res.data;
};

export const obtenerDatosGraficos = async (periodo: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/datos-graficos`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { periodo },
  });
  return res.data;
};

export const obtenerDetalleParticipacionPorTipo = async (periodo: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/detalle-participacion`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { periodo },
  });
  return res.data;
};

export const obtenerResultadosDetallados = async (periodo: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/resultados-detallados`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { periodo },
  });
  return res.data;
};

// Nuevas funciones para respuestas globales
export const obtenerRespuestasPorTipoYDocente = async (periodo: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/respuestas-por-tipo/${periodo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const obtenerEstadisticasPorTipoPregunta = async (periodo: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/estadisticas-tipo-pregunta/${periodo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const obtenerDatosMapaCalor = async (periodo: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/dashboard/mapa-calor/${periodo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const obtenerPromedioItemsPorTipo = async (idPeriodo: number, tipoEvaluacion: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/promedio-items/${idPeriodo}/${tipoEvaluacion}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const obtenerPreguntasExtremas = async (idPeriodo: number, tipoEvaluacion: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/preguntas-extremas/${idPeriodo}/${tipoEvaluacion}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const obtenerPromediosPorCarrera = async (idPeriodo: number, tipoEvaluacion: number) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/promedios-carrera/${idPeriodo}/${tipoEvaluacion}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};