import { useState, useEffect } from "react";
import ModalPregunta from "../ui/modales/ModalPregunta";
import { Pencil, Trash2, Info, X, FileText, Brain, Target, Users } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";
import {
    obtenerFormularios,
    obtenerPreguntasPorFormulario,
    crearPregunta,
    eliminarPregunta,
    actualizarPregunta,
    Formulario,
    Pregunta
} from "../../services/evaluacionesService";
import Select from 'react-select';

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
        fontSize: "0.875rem",
        padding: "0.5rem 1rem",
    }),
    input: (base: any) => ({
        ...base,
        fontSize: "0.875rem",
    }),
    singleValue: (base: any) => ({
        ...base,
        fontSize: "0.875rem",
        color: "#111827",
    }),
    menuPortal: (base: any) => ({
        ...base,
        zIndex: 99999, // Añadido para el portal
    }),
};

const AdminPreguntas = () => {
    const [formularios, setFormularios] = useState<Formulario[]>([]);
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [showModalPregunta, setShowModalPregunta] = useState(false);
    const [formularioSeleccionado, setFormularioSeleccionado] = useState<number | null>(null);
    const [preguntaEditar, setPreguntaEditar] = useState<Pregunta | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [loadingFormularios, setLoadingFormularios] = useState(true);
    const [mostrarInfo, setMostrarInfo] = useState(false);

    // Inicializar AOS cuando el componente se monta
    useEffect(() => {
        AOS.init({
            duration: 600,
            once: true,
            easing: 'ease-out',
            offset: 50,
        });
    }, []);

    const mostrarConfirmacionEliminar = (id: number) => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-2" data-aos="fade-up" data-aos-duration="300">
                <div className="flex items-start gap-2">
                    <Trash2 className="text-red-500 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-gray-800">
                        ¿Estás seguro de que deseas eliminar esta pregunta?
                    </p>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            ejecutarEliminacion(id);
                        }}
                        className="text-sm px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        ), {
            duration: 10000,
            style: {
                borderRadius: '12px',
                background: '#fefefe',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                minWidth: '320px',
                padding: '0px'
            },
        });
    };

    const ejecutarEliminacion = async (id: number) => {
        try {
            await eliminarPregunta(id);
            toast.success("Pregunta eliminada exitosamente");
            if (formularioSeleccionado) {
                cargarPreguntas(formularioSeleccionado);
            }
        } catch (error) {
            console.error("Error al eliminar la pregunta:", error);
            toast.error("Error al eliminar la pregunta");
        }
    };

    useEffect(() => {
        cargarFormularios();
    }, []);

    useEffect(() => {
        if (formularioSeleccionado) {
            cargarPreguntas(formularioSeleccionado);
        }
    }, [formularioSeleccionado]);

    const cargarFormularios = async () => {
        try {
            setLoadingFormularios(true);
            const data = await obtenerFormularios();
            setFormularios(data);
            setTimeout(() => {
                AOS.refresh();
            }, 100);
        } catch (error) {
            console.error("Error al cargar formularios:", error);
            toast.error("Error al cargar los formularios");
        } finally {
            setLoadingFormularios(false);
        }
    };

    const cargarPreguntas = async (idFormulario: number) => {
        try {
            setLoading(true);
            const data = await obtenerPreguntasPorFormulario(idFormulario);
            setPreguntas(data);
            setTimeout(() => {
                AOS.refresh();
            }, 100);
        } catch (error) {
            console.error("Error al cargar preguntas:", error);
            toast.error("Error al cargar las preguntas");
        } finally {
            setLoading(false);
        }
    };

    const handleFormularioSelect = (option: { value: string; label: string | undefined } | null) => {
        if (option && option.value) {
            setFormularioSeleccionado(parseInt(option.value));
        } else {
            setFormularioSeleccionado(null);
        }
    };

    const handlePreguntaSubmit = async (data: { texto: string; tipo_pregunta: string }) => {
        if (!formularioSeleccionado) return;

        try {
            if (preguntaEditar) {
                await actualizarPregunta(preguntaEditar.id_pregunta, {
                    texto: data.texto,
                    tipo_pregunta: data.tipo_pregunta
                });
            } else {
                await crearPregunta({
                    id_formulario: formularioSeleccionado,
                    texto: data.texto,
                    tipo_pregunta: data.tipo_pregunta
                });
            }

            cargarPreguntas(formularioSeleccionado);
        } catch (error) {
            console.error("Error al guardar la pregunta:", error);
            toast.error("Error al guardar la pregunta");
        }
    };

    const handleEditarPregunta = (pregunta: Pregunta) => {
        setPreguntaEditar(pregunta);
        setShowModalPregunta(true);
    };

    const abrirModalNuevaPregunta = () => {
        setPreguntaEditar(undefined);
        setShowModalPregunta(true);
    };

    const obtenerEtiquetaTipoPregunta = (tipo: string) => {
        switch (tipo) {
            case 'actitudinal':
                return 'Actitudinal';
            case 'conceptual':
                return 'Conceptual';
            case 'procedimental':
                return 'Procedimental';
            default:
                return tipo;
        }
    };

    const obtenerConteoPreguntas = () => {
        const actitudinales = preguntas.filter(p => p.tipo_pregunta === 'actitudinal').length;
        const conceptuales = preguntas.filter(p => p.tipo_pregunta === 'conceptual').length;
        const procedimentales = preguntas.filter(p => p.tipo_pregunta === 'procedimental').length;
        const total = preguntas.length;

        return { actitudinales, conceptuales, procedimentales, total };
    };

    const conteoPreguntas = obtenerConteoPreguntas();

    return (
        <div>
            <Toaster position="bottom-right" />

            <div className="py-5" data-aos="fade-up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl text-gray-800 font-medium">Gestión de Preguntas</h1>
                        <p className="text-gray-600">Gestiona las preguntas asignadas a cada formulario. Puedes crear, editar o eliminar preguntas según el tipo evaluativo.</p>
                    </div>
                    <button
                        onClick={() => setMostrarInfo(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                        title="Información sobre tipos de formularios"
                    >
                        <Info className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Información</span>
                    </button>
                </div>
            </div>

            <div
                className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end"
                data-aos="fade-up"
                data-aos-delay="50"
            >
                <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona un formulario:</label>
                    <Select
                        value={formularios.find(f => f.id_formulario === formularioSeleccionado)
                            ? { value: formularioSeleccionado?.toString() ?? "", label: formularios.find(f => f.id_formulario === formularioSeleccionado)?.nombre }
                            : null}
                        onChange={handleFormularioSelect}
                        options={formularios.map(f => ({ value: f.id_formulario.toString(), label: f.nombre }))}
                        styles={customStyles}
                        isSearchable={false}
                        menuPortalTarget={document.body}
                        isDisabled={loadingFormularios}
                        placeholder="Selecciona"
                        className="w-full sm:w-80"
                    />
                    {loadingFormularios && <p className="text-sm text-gray-500 mt-1">Cargando formularios...</p>}
                </div>

                {formularioSeleccionado && (
                    <div className="flex-shrink-0">
                        <button
                            className="bg-[#189cbf] text-white px-4 py-2 rounded-lg hover:bg-[#0f7c9c] transition flex items-center gap-2 whitespace-nowrap"
                            onClick={abrirModalNuevaPregunta}
                        >
                            + Nueva Pregunta
                        </button>
                    </div>
                )}
            </div>

            {/* Información de bienvenida */}
            {!formularioSeleccionado && (
                <div className="mt-6 mb-6" data-aos="fade-up" data-aos-delay="100">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Selecciona un Formulario
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Elige un formulario de evaluación para comenzar a gestionar sus preguntas. Podrás crear, editar y organizar preguntas por tipo evaluativo.
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-700 mb-4 font-medium">Tipos de preguntas disponibles:</p>
                            <div className="flex justify-center gap-8">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2">
                                        <span className="text-blue-800 font-bold text-sm">A</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Actitudinal</p>
                                </div>

                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2">
                                        <span className="text-green-800 font-bold text-sm">C</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Conceptual</p>
                                </div>

                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mb-2">
                                        <span className="text-purple-800 font-bold text-sm">P</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Procedimental</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {formularioSeleccionado && (
                <>
                    {/* Resumen de preguntas */}
                    <div className="mt-6 mb-6" data-aos="fade-up" data-aos-delay="150">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                <div className="text-lg font-bold text-gray-800 mb-1">
                                    {conteoPreguntas.total}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                    Total Preguntas
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-lg font-bold text-blue-600">
                                        {conteoPreguntas.actitudinales}
                                    </div>
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-800 font-bold text-xs">A</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                    Actitudinales
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-lg font-bold text-green-600">
                                        {conteoPreguntas.conceptuales}
                                    </div>
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-800 font-bold text-xs">C</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                    Conceptuales
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-lg font-bold text-purple-600">
                                        {conteoPreguntas.procedimentales}
                                    </div>
                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-800 font-bold text-xs">P</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                    Procedimentales
                                </div>
                            </div>
                        </div>
                    </div>

                    <ModalPregunta
                        isOpen={showModalPregunta}
                        onClose={() => setShowModalPregunta(false)}
                        onSubmit={handlePreguntaSubmit}
                        initialData={preguntaEditar ? {
                            texto: preguntaEditar.texto,
                            tipo_pregunta: preguntaEditar.tipo_pregunta
                        } : undefined}
                        idFormulario={formularioSeleccionado}
                    />

                    {/* Tarjetas en móvil */}
                    <div className="block sm:hidden space-y-3">
                        {loading ? null : preguntas.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No hay preguntas para este formulario</div>
                        ) : (
                            <div data-aos="fade-up">
                                {preguntas.map((pregunta) => (
                                    <div
                                        key={pregunta.id_pregunta}
                                        className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-2 shadow-sm"
                                    >
                                        <div className="text-sm text-gray-800 mb-1">{pregunta.texto}</div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${pregunta.tipo_pregunta === 'actitudinal' ? 'bg-blue-100 text-blue-800' : pregunta.tipo_pregunta === 'conceptual' ? 'bg-green-100 text-green-800' : pregunta.tipo_pregunta === 'procedimental' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{obtenerEtiquetaTipoPregunta(pregunta.tipo_pregunta)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-[#189cbf] px-2 py-1 rounded hover:bg-blue-200 transition text-xs font-medium"
                                                onClick={() => handleEditarPregunta(pregunta)}
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Editar
                                            </button>
                                            <button
                                                className="flex-1 flex items-center justify-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition text-xs font-medium"
                                                onClick={() => mostrarConfirmacionEliminar(pregunta.id_pregunta)}
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Tabla en escritorio */}
                    <div className="hidden sm:block bg-white shadow rounded-lg overflow-x-auto" data-aos="fade-up" data-aos-delay="200" data-aos-duration="600">
                        {loading ? null : (
                            <table className="min-w-full divide-y divide-gray-200 text-sm" data-aos="fade-up">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-700">Preguntas</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-700">Tipo de Pregunta</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {preguntas.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-gray-500 text-center">No hay preguntas para este formulario</td>
                                        </tr>
                                    ) : (
                                        preguntas.map((pregunta) => (
                                            <tr key={pregunta.id_pregunta}>
                                                <td className="px-6 py-4">{pregunta.texto}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${pregunta.tipo_pregunta === 'actitudinal' ? 'bg-blue-100 text-blue-800' : pregunta.tipo_pregunta === 'conceptual' ? 'bg-green-100 text-green-800' : pregunta.tipo_pregunta === 'procedimental' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{obtenerEtiquetaTipoPregunta(pregunta.tipo_pregunta)}</span>
                                                </td>
                                                <td className="px-6 py-4 space-x-2 flex">
                                                    <button className="flex items-center gap-1 bg-blue-100 text-[#189cbf] font-medium px-3 py-1 rounded hover:bg-blue-200 transition text-sm" onClick={() => handleEditarPregunta(pregunta)} title="Editar">
                                                        <Pencil className="w-4 h-4" />
                                                        Editar
                                                    </button>
                                                    <button className="flex items-center gap-1 bg-red-100 text-red-700 font-medium px-3 py-1 rounded hover:bg-red-200 transition text-sm" onClick={() => mostrarConfirmacionEliminar(pregunta.id_pregunta)} title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
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
                                        Información sobre gestión de preguntas
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
                                    El sistema de gestión de preguntas te permite crear, editar y organizar preguntas según tres tipos evaluativos fundamentales:
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <Users className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">Actitudinal</h4>
                                            <p className="text-blue-800 text-sm">
                                                Evalúa comportamientos, valores, actitudes y disposiciones. Incluye aspectos como puntualidad, respeto, colaboración, ética profesional y motivación hacia el aprendizaje.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <Brain className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 mb-1">Conceptual</h4>
                                            <p className="text-green-800 text-sm">
                                                Evalúa conocimientos teóricos, comprensión de conceptos, principios y teorías. Incluye dominio de la materia, actualización disciplinar y capacidad de explicación.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <Target className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900 mb-1">Procedimental</h4>
                                            <p className="text-purple-800 text-sm">
                                                Evalúa habilidades prácticas, metodologías de enseñanza, técnicas didácticas y capacidad de aplicar conocimientos en situaciones reales.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Funcionalidades disponibles:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Crear preguntas personalizadas para cada formulario de evaluación</li>
                                        <li>• Editar preguntas existentes manteniendo su categorización</li>
                                        <li>• Eliminar preguntas que ya no sean necesarias</li>
                                        <li>• Visualizar estadísticas por tipo de pregunta</li>
                                    </ul>
                                </div>

                                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                    <h4 className="font-semibold text-amber-900 mb-2">Recomendaciones:</h4>
                                    <ul className="text-sm text-amber-800 space-y-1">
                                        <li>• Mantén un balance entre los tres tipos de preguntas</li>
                                        <li>• Redacta preguntas claras y específicas</li>
                                        <li>• Considera el contexto y propósito de cada evaluación</li>
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

export default AdminPreguntas;