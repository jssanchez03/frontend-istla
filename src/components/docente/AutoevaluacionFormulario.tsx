import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle, ArrowLeft, CircleHelp, User, Info, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { obtenerPeriodos } from "../../services/evaluacionesService";
import { toast, Toaster } from "react-hot-toast";

interface Pregunta {
    id_pregunta: number;
    texto: string;
    tipo_pregunta: 'actitudinal' | 'conceptual' | 'procedimental';
}

interface DecodedToken {
    id?: number;
    userId?: number;
    user_id?: number;
}

const AutoevaluacionFormulario = () => {
    const { id } = useParams(); // id de la evaluación
    const navigate = useNavigate();
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [respuestas, setRespuestas] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("ser");
    const [periodo, setPeriodo] = useState<number | "">("");
    const [distributivo, setDistributivo] = useState<number | null>(null);
    const [mostrarInfo, setMostrarInfo] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        const cargarPreguntas = async () => {
            try {
                const resEval = await axios.get(
                    `http://localhost:3000/api/v1/evaluaciones/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const idFormulario = resEval.data.id_formulario;
                const resPreg = await axios.get(
                    `http://localhost:3000/api/v1/formularios/${idFormulario}/preguntas`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setPreguntas(resPreg.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Error al cargar las preguntas.");
                setLoading(false);
            }
        };

        const cargarPeriodoInicial = async () => {
            try {
                const periodosData = await obtenerPeriodos();
                // Directamente establecer el primer periodo sin guardarlo en estado
                if (periodosData.length > 0) {
                    setPeriodo(periodosData[0].id_periodo);
                }
            } catch (error) {
                console.error("Error al cargar periodo inicial:", error);
            }
        };

        cargarPreguntas();
        cargarPeriodoInicial();
    }, [id]);

    // Nuevo useEffect para cargar el distributivo cuando periodo cambie y esté definido
    useEffect(() => {
        const fetchDistributivo = async () => {
            if (!periodo) return;
            const token = localStorage.getItem("token");
            const decoded = decodeToken(token || "");
            const idUsuario = decoded?.id || decoded?.userId || decoded?.user_id;
            if (!idUsuario) return;
            try {
                const response = await axios.get(
                    `http://localhost:3000/api/v1/distributivos/${periodo}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                // ✅ Verifica si hay distributivo y guarda asignatura
                if (response.data.length > 0) {
                    const distrib = response.data[0].id_distributivo;
                    setDistributivo(distrib);
                } else {
                    setDistributivo(null);
                    toast("No tienes distributivo asignado para este periodo.", { icon: "⚠️" });
                }
            } catch (error) {
                console.error("Error al cargar distributivo:", error);
                setDistributivo(null);
            }
        };
        fetchDistributivo();
    }, [periodo]);

    const handleChange = (preguntaId: number, valor: string) => {
        setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
    };

    const decodeToken = (token: string): DecodedToken | null => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");

        const totalPreguntas = [...(secciones.ser || []), ...(secciones.saber || []), ...(secciones.hacer || [])].length;
        const totalRespondidas = Object.keys(respuestas).length;

        if (totalRespondidas < totalPreguntas) {
            toast.error("Por favor, responda todas las preguntas antes de enviar.");
            return;
        }

        try {
            const decodedToken = decodeToken(token || "");
            const usuarioId = decodedToken?.id || decodedToken?.userId || decodedToken?.user_id;

            if (!usuarioId) {
                toast.error("Error: No se pudo identificar al usuario");
                return;
            }

            // ✅ Evita enviar si distributivo es null
            if (!distributivo) {
                toast.error("No se encontró un distributivo asignado para tu usuario.");
                return;
            }

            const respuestasFormateadas = Object.entries(respuestas).map(([id_pregunta, respuesta]) => ({
                id_pregunta: Number(id_pregunta),
                respuesta,
                evaluado_id: usuarioId,
                id_distributivo: distributivo
            }));

            await axios.post(
                `http://localhost:3000/api/v1/evaluaciones/${id}/respuestas`,
                { respuestas: respuestasFormateadas },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success("¡Autoevaluación enviada con éxito!");
            setTimeout(() => navigate("/docente"), 1200);
        } catch (err) {
            console.error(err);
            toast.error("Error al enviar respuestas.");
        }
    };

    // ✅ ACTUALIZADA: Función para agrupar preguntas por tipo_pregunta
    const agruparPreguntas = () => {
        const secciones: { [key: string]: Pregunta[] } = {
            "ser": preguntas.filter(p => p.tipo_pregunta === 'actitudinal'),
            "saber": preguntas.filter(p => p.tipo_pregunta === 'conceptual'),
            "hacer": preguntas.filter(p => p.tipo_pregunta === 'procedimental'),
        };
        return secciones;
    };

    // ✅ NUEVA: Función para obtener el número de pregunta correcto basado en la sección
    const obtenerNumeroPregunta = (seccion: string, indiceLocal: number) => {
        const secciones = agruparPreguntas();
        let numeroBase = 1;

        if (seccion === "saber") {
            numeroBase += secciones.ser.length;
        } else if (seccion === "hacer") {
            numeroBase += secciones.ser.length + secciones.saber.length;
        }

        return numeroBase + indiceLocal;
    };

    const secciones = agruparPreguntas();

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#189cbf]"></div>
            <span className="ml-3">Cargando...</span>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-md">
            <p>{error}</p>
        </div>
    );

    return (
        <div className="max-w-8xl mx-auto px-2 sm:px-4 py-4">
            <Toaster position="bottom-right" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-4 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl text-gray-800 font-medium">Autoevaluación Docente</h1>
                </div>
                <button
                    onClick={() => setMostrarInfo(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors w-full sm:w-auto text-xs sm:text-base"
                    title="Información sobre el formulario"
                >
                    <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base font-medium">Información</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-[#189cbf] text-white p-3 sm:p-4 rounded-t-lg">
                    <div className="flex items-center">
                        <User className="h-6 w-6 mr-3" />
                        <h2 className="text-xl font-medium">Formulario de Autoevaluación</h2>
                        <CircleHelp className="h-4 w-4 ml-2" />
                    </div>
                    <p className="text-white/90 text-sm mt-1">
                        Reflexione sobre su propio desempeño docente. La autoevaluación es fundamental para el crecimiento profesional continuo.
                    </p>
                </div>

                <div className="mb-4 sm:mb-6 ml-3 sm:ml-6 mt-4 sm:mt-6">
                    <p className="text-xs sm:text-sm font-medium mb-2 text-gray-700 px-2 sm:px-0"><b>Instrucciones: </b>A continuación, se presentan varios indicadores. Marque de 1-5 en la casilla que coincida con su criterio de autoevaluación</p>
                    {/* Tabla de escala - Versión móvil mejorada */}
                    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
                        {/* Versión móvil - Grid compacto */}
                        <div className="block sm:hidden mb-4">
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <h4 className="text-center font-medium text-gray-700 mb-3 text-sm">
                                    Escala valorativa (1: Deficiente, 5: Excelente)
                                </h4>
                                <div className="grid grid-cols-5 gap-1 text-xs">
                                    <div className="text-center p-2 bg-white rounded border">
                                        <div className="font-medium">1</div>
                                        <div className="text-red-600">0-20</div>
                                        <div>Deficiente</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded border">
                                        <div className="font-medium">2</div>
                                        <div className="text-orange-600">21-30</div>
                                        <div>Regular</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded border">
                                        <div className="font-medium">3</div>
                                        <div className="text-yellow-600">31-50</div>
                                        <div>Buena</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded border">
                                        <div className="font-medium">4</div>
                                        <div className="text-blue-600">51-85</div>
                                        <div>Muy buena</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded border">
                                        <div className="font-medium">5</div>
                                        <div className="text-green-600">86-100</div>
                                        <div>Excelente</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Versión desktop - Tabla original */}
                        <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-300">
                            <table className="w-full min-w-[400px] border-collapse text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-2 text-center border-gray-300 text-gray-700" colSpan={5}>
                                            Escala valorativa (1: Deficiente, 5: Excelente)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-2 text-center text-gray-700 border-t border-r border-gray-300">0-20<br />Deficiente</td>
                                        <td className="p-2 text-center text-gray-700 border-t border-r border-gray-300">21-30<br />Regular</td>
                                        <td className="p-2 text-center text-gray-700 border-t border-r border-gray-300">31-50<br />Buena</td>
                                        <td className="p-2 text-center text-gray-700 border-t border-r border-gray-300">51-85<br />Muy buena</td>
                                        <td className="p-2 text-center text-gray-700 border-t border-r border-gray-300">86-100<br />Excelente</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-4 pb-0">
                        <div className="w-full p-0 sm:p-1">
                            {/* Pestañas - Mejoradas para móvil */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 mb-4 sm:mb-6 bg-gray-200 rounded-lg overflow-hidden">
                                <button
                                    className={`py-3 px-2 sm:py-2 sm:px-4 text-center text-gray-800 font-medium transition-all duration-200 relative text-xs sm:text-base ${activeTab === "ser" ? "bg-white text-[#189cbf]" : "bg-gray-200 hover:bg-gray-100"
                                        }`}
                                    onClick={() => setActiveTab("ser")}
                                >
                                    Para el ser (Actitudinal)
                                    {activeTab === "ser" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#189cbf]"></div>
                                    )}
                                </button>
                                <button
                                    className={`py-3 px-2 sm:py-2 sm:px-4 text-center text-gray-800 font-medium transition-all duration-200 relative text-xs sm:text-base ${activeTab === "saber" ? "bg-white text-[#189cbf]" : "bg-gray-200 hover:bg-gray-100"
                                        }`}
                                    onClick={() => setActiveTab("saber")}
                                >
                                    Para el saber (Conceptual)
                                    {activeTab === "saber" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#189cbf]"></div>
                                    )}
                                </button>
                                <button
                                    className={`py-3 px-2 sm:py-2 sm:px-4 text-center text-gray-800 font-medium transition-all duration-200 relative text-xs sm:text-base ${activeTab === "hacer" ? "bg-white text-[#189cbf]" : "bg-gray-200 hover:bg-gray-100"
                                        }`}
                                    onClick={() => setActiveTab("hacer")}
                                >
                                    Para el hacer (Procedimental)
                                    {activeTab === "hacer" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#189cbf]"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === "ser" && (
                                <motion.div
                                    key="ser"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mt-0">
                                        {/* Indicador visual de avance */}
                                       <div className="mb-4 sm:mb-6">
                                           <div className="text-xs sm:text-sm text-center sm:text-right text-gray-500 mb-2">
                                               Preguntas respondidas: {Object.keys(respuestas).length} / {preguntas.length}
                                           </div>
                                           <div className="w-full bg-gray-200 rounded-full h-2">
                                               <div
                                                   className="bg-[#189cbf] h-2 rounded-full transition-all duration-300"
                                                   style={{
                                                       width: `${(Object.keys(respuestas).length / preguntas.length) * 100}%`,
                                                   }}
                                               ></div>
                                           </div>
                                       </div>
                                        {/* Preguntas */}
                                       <div className="bg-white rounded-lg ">
                                            {secciones.ser &&
                                                secciones.ser.map((pregunta, idx) => (
                                                    <div
                                                        key={pregunta.id_pregunta}
                                                        className="p-3 sm:p-4 mb-3 sm:mb-4 bg-gray-50 sm:bg-white rounded-lg border sm:shadow-md"
                                                    >
                                                        <div className="mb-3 sm:mb-3">
                                                            <span className="font-medium text-sm sm:text-base">
                                                                {obtenerNumeroPregunta("ser", idx)}. {pregunta.texto}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 sm:gap-6 justify-center">
                                                            {[1, 2, 3, 4, 5].map((valor) => (
                                                                <label
                                                                    key={valor}
                                                                    className="flex flex-col items-center cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`pregunta-${pregunta.id_pregunta}`}
                                                                        value={valor}
                                                                        checked={
                                                                            respuestas[pregunta.id_pregunta] === String(valor)
                                                                        }
                                                                        onChange={(e) =>
                                                                            handleChange(pregunta.id_pregunta, e.target.value)
                                                                        }
                                                                        className="sr-only"
                                                                    />
                                                                    <div
                                                                        className={`w-10 h-10 sm:w-12 sm:h-8 rounded-md flex items-center justify-center border-2 transition-all duration-200 text-sm sm:text-base ${respuestas[pregunta.id_pregunta] === String(valor)
                                                                            ? "bg-[#189cbf] text-white border-[#189cbf]"
                                                                            : "bg-white border-gray-300 hover:bg-gray-50"
                                                                            }`}
                                                                    >
                                                                        {valor}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                       <div className="flex flex-col sm:flex-row justify-end mt-4 sm:mt-6 gap-2">
                                           <button
                                               onClick={() => setActiveTab("saber")}
                                               className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#189cbf] hover:bg-[#157a99] text-white font-medium"
                                           >
                                               Siguiente sección
                                           </button>
                                       </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "saber" && (
                                <motion.div
                                    key="saber"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mt-0">
                                        {/* Indicador visual de avance */}
                                       <div className="mb-4 sm:mb-6">
                                           <div className="text-xs sm:text-sm text-center sm:text-right text-gray-500 mb-2">
                                               Preguntas respondidas: {Object.keys(respuestas).length} / {preguntas.length}
                                           </div>
                                           <div className="w-full bg-gray-200 rounded-full h-2">
                                               <div
                                                   className="bg-[#189cbf] h-2 rounded-full transition-all duration-300"
                                                   style={{
                                                       width: `${(Object.keys(respuestas).length / preguntas.length) * 100}%`,
                                                   }}
                                               ></div>
                                           </div>
                                       </div>
                                        {/* Preguntas */}
                                       <div className="bg-white rounded-lg ">
                                            {secciones.saber &&
                                                secciones.saber.map((pregunta, idx) => (
                                                    <div
                                                        key={pregunta.id_pregunta}
                                                        className="p-3 sm:p-4 mb-3 sm:mb-4 bg-gray-50 sm:bg-white rounded-lg border sm:shadow-md"
                                                    >
                                                        <div className="mb-3 sm:mb-3">
                                                            <span className="font-medium text-sm sm:text-base">
                                                                {obtenerNumeroPregunta("saber", idx)}. {pregunta.texto}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 sm:gap-6 justify-center">
                                                            {[1, 2, 3, 4, 5].map((valor) => (
                                                                <label
                                                                    key={valor}
                                                                    className="flex flex-col items-center cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`pregunta-${pregunta.id_pregunta}`}
                                                                        value={valor}
                                                                        checked={
                                                                            respuestas[pregunta.id_pregunta] === String(valor)
                                                                        }
                                                                        onChange={(e) =>
                                                                            handleChange(pregunta.id_pregunta, e.target.value)
                                                                        }
                                                                        className="sr-only"
                                                                    />
                                                                    <div
                                                                        className={`w-10 h-10 sm:w-12 sm:h-8 rounded-md flex items-center justify-center border-2 transition-all duration-200 text-sm sm:text-base ${respuestas[pregunta.id_pregunta] === String(valor)
                                                                            ? "bg-[#189cbf] text-white border-[#189cbf]"
                                                                            : "bg-white border-gray-300 hover:bg-gray-50"
                                                                            }`}
                                                                    >
                                                                        {valor}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 gap-2">
                                            <button
                                                onClick={() => setActiveTab("ser")}
                                                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#189cbf] text-[#189cbf] hover:bg-gray-50 font-medium"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("hacer")}
                                                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#189cbf] hover:bg-[#157a99] text-white font-medium"
                                            >
                                                Siguiente sección
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "hacer" && (
                                <motion.div
                                    key="hacer"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mt-0">
                                        {/* Indicador visual de avance */}
                                       <div className="mb-4 sm:mb-6">
                                           <div className="text-xs sm:text-sm text-center sm:text-right text-gray-500 mb-2">
                                               Preguntas respondidas: {Object.keys(respuestas).length} / {preguntas.length}
                                           </div>
                                           <div className="w-full bg-gray-200 rounded-full h-2">
                                               <div
                                                   className="bg-[#189cbf] h-2 rounded-full transition-all duration-300"
                                                   style={{
                                                       width: `${(Object.keys(respuestas).length / preguntas.length) * 100}%`,
                                                   }}
                                               ></div>
                                           </div>
                                       </div>
                                        {/* Preguntas */}
                                       <div className="bg-white rounded-lg ">
                                            {secciones.hacer &&
                                                secciones.hacer.map((pregunta, idx) => (
                                                    <div
                                                        key={pregunta.id_pregunta}
                                                        className="p-3 sm:p-4 mb-3 sm:mb-4 bg-gray-50 sm:bg-white rounded-lg border sm:shadow-md"
                                                    >
                                                        <div className="mb-3 sm:mb-3">
                                                            <span className="font-medium text-sm sm:text-base">
                                                                {obtenerNumeroPregunta("hacer", idx)}. {pregunta.texto}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 sm:gap-6 justify-center">
                                                            {[1, 2, 3, 4, 5].map((valor) => (
                                                                <label
                                                                    key={valor}
                                                                    className="flex flex-col items-center cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`pregunta-${pregunta.id_pregunta}`}
                                                                        value={valor}
                                                                        checked={
                                                                            respuestas[pregunta.id_pregunta] === String(valor)
                                                                        }
                                                                        onChange={(e) =>
                                                                            handleChange(pregunta.id_pregunta, e.target.value)
                                                                        }
                                                                        className="sr-only"
                                                                    />
                                                                    <div
                                                                        className={`w-10 h-10 sm:w-12 sm:h-8 rounded-md flex items-center justify-center border-2 transition-all duration-200 text-sm sm:text-base ${respuestas[pregunta.id_pregunta] === String(valor)
                                                                            ? "bg-[#189cbf] text-white border-[#189cbf]"
                                                                            : "bg-white border-gray-300 hover:bg-gray-50"
                                                                            }`}
                                                                    >
                                                                        {valor}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 gap-2">
                                            <button
                                                onClick={() => setActiveTab("saber")}
                                                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#189cbf] text-[#189cbf] hover:bg-gray-50 font-medium"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={distributivo === null}
                                                className={`w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center font-medium transition-all duration-200 
                                                ${distributivo === null
                                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        : "bg-[#189cbf] hover:bg-[#157a99] text-white"}
                                            `}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Finalizar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

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
                                        Información sobre el Formulario
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
                                    <h4 className="font-semibold text-gray-800 mb-3">¿Qué verás en este formulario?</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <CircleHelp className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h5 className="font-medium text-blue-900 mb-1">Preguntas Organizadas</h5>
                                                <p className="text-blue-800 text-sm">
                                                    Preguntas divididas en secciones: Ser, Saber y Hacer para evaluar diferentes aspectos de tu práctica docente.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h5 className="font-medium text-green-900 mb-1">Escala Valorativa</h5>
                                                <p className="text-green-800 text-sm">
                                                    Escala del 1 al 5 donde 1 es "Muy Malo" y 5 es "Excelente" para calificar cada aspecto.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Instrucciones:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Lee cada pregunta cuidadosamente</li>
                                        <li>• Sé honesto y reflexivo en tu autoevaluación</li>
                                        <li>• Completa todas las preguntas antes de enviar</li>
                                        <li>• Esta evaluación es confidencial</li>
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

export default AutoevaluacionFormulario;