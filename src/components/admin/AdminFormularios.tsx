import { useState, useEffect } from "react";
import ModalFormulario from "../ui/modales/ModalFormulario";
import { obtenerFormularios, crearFormulario, actualizarFormulario, eliminarFormulario, Formulario } from "../../services/evaluacionesService";
import { toast, Toaster } from "react-hot-toast";
import { Pencil, Trash2, Plus, Search, FileText, Grid3X3, List, Calendar, Tag, Info, X, Users, GraduationCap, User } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

const AdminFormularios = () => {
    const [formularios, setFormularios] = useState<Formulario[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModalFormulario, setShowModalFormulario] = useState(false);
    const [formularioEditar, setFormularioEditar] = useState<Formulario | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [mostrarInfo, setMostrarInfo] = useState(false);

    // Función para determinar el tipo de relación según el nombre del formulario
    const getTipoRelacion = (tipo: string | undefined) => {
        if (!tipo) return "";

        switch (tipo) {
            case "heteroevaluacion":
                return "Estudiante → Docente";
            case "autoevaluacion":
                return "Docente → Docente";
            case "coevaluacion":
                return "Docente → Docente";
            default:
                return "";
        }
    };

    // Función para obtener el color del badge según el tipo
    const getTipoBadgeColor = (tipo: string | undefined) => {
        if (!tipo) return "bg-gray-100 text-gray-700";

        switch (tipo) {
            case "heteroevaluacion":
                return "bg-blue-100 text-blue-700";
            case "autoevaluacion":
                return "bg-green-100 text-green-700";
            case "coevaluacion":
                return "bg-purple-100 text-purple-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

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
                        ¿Estás seguro de que deseas eliminar este formulario?
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

    // Lógica real de eliminación
    const ejecutarEliminacion = async (id: number) => {
        try {
            await eliminarFormulario(id);
            toast.success("Formulario eliminado exitosamente");
            cargarFormularios();
        } catch (error) {
            console.error("Error al eliminar formulario:", error);
            toast.error("Error al eliminar el formulario");
        }
    };

    // Función para cargar los formularios
    const cargarFormularios = async () => {
        try {
            setLoading(true);
            const data = await obtenerFormularios();
            setFormularios(data);
            setTimeout(() => {
                AOS.refresh();
            }, 100);
        } catch (error) {
            console.error("Error al cargar formularios:", error);
            toast.error("Error al cargar los formularios");
        } finally {
            setLoading(false);
        }
    };

    // Cargar formularios al montar el componente
    useEffect(() => {
        cargarFormularios();
    }, []);

    // Filtrar formularios por búsqueda
    const filteredFormularios = formularios.filter(formulario => {
        const searchLower = searchTerm.toLowerCase();
        return (
            formulario.nombre.toLowerCase().includes(searchLower) ||
            (formulario.tipo && formulario.tipo.toLowerCase().includes(searchLower)) ||
            getTipoRelacion(formulario.tipo).toLowerCase().includes(searchLower)
        );
    });

    // Función para crear un formulario
    const handleCrearFormulario = async (data: { nombre: string }) => {
        try {
            await crearFormulario(data);
            toast.success("Formulario creado exitosamente");
            cargarFormularios();
            setShowModalFormulario(false);
        } catch (error) {
            console.error("Error al crear formulario:", error);
            toast.error("Error al crear el formulario");
        }
    };

    // Función para actualizar un formulario
    const handleActualizarFormulario = async (data: { nombre: string }) => {
        try {
            if (formularioEditar) {
                await actualizarFormulario(formularioEditar.id_formulario, data);
                toast.success("Formulario actualizado exitosamente");
                cargarFormularios();
                setShowModalFormulario(false);
            }
        } catch (error) {
            console.error("Error al actualizar formulario:", error);
            toast.error("Error al actualizar el formulario");
        }
    };

    // Manejador para el submit del modal
    const handleFormularioSubmit = (data: { nombre: string }) => {
        if (formularioEditar) {
            handleActualizarFormulario(data);
        } else {
            handleCrearFormulario(data);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#189cbf]"></div>
            </div>
        );
    }

    return (
        <div className="py-5">
            {/* Componente Toaster para mostrar notificaciones */}
            <Toaster position="bottom-right" />

            {/* Header */}
            <div className="mb-8" data-aos="fade-up">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl text-gray-800 font-medium">Creación de Formularios</h1>
                        <p className="text-gray-600">Administra los formularios de evaluación disponibles. Puedes crear, editar o eliminar formularios según el tipo de evaluación.</p>
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

            {/* Controles superiores Administrar Formularios */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6" data-aos="fade-up" data-aos-delay="100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o tipo"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#189cbf] focus:border-transparent"
                    />
                </div>
                {/* Selector de vista solo en sm+ */}
                <div className="hidden sm:flex gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-[#189cbf] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            <List className="h-4 w-4" />
                            <span className="hidden sm:inline">Tabla</span>
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white text-[#189cbf] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            <Grid3X3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Cards</span>
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setFormularioEditar(undefined);
                            setShowModalFormulario(true);
                        }}
                        className="bg-[#189cbf] hover:bg-[#0f7c9c] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Nuevo Formulario</span>
                    </button>
                </div>
                {/* Botón crear en móvil */}
                <div className="sm:hidden mt-2">
                    <button
                        onClick={() => {
                            setFormularioEditar(undefined);
                            setShowModalFormulario(true);
                        }}
                        className="w-full bg-[#189cbf] hover:bg-[#0f7c9c] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Formulario
                    </button>
                </div>
            </div>

            <ModalFormulario
                isOpen={showModalFormulario}
                onClose={() => setShowModalFormulario(false)}
                onSubmit={handleFormularioSubmit}
                initialData={formularioEditar}
            />

            {/* Vista de tabla (solo escritorio) */}
            {viewMode === 'table' && (
                <div className="hidden sm:block bg-white shadow rounded-lg overflow-hidden" data-aos="fade-up" data-aos-delay="150">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700  cursor-pointer hover:bg-gray-100 transition-colors">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700  cursor-pointer hover:bg-gray-100 transition-colors">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700  cursor-pointer hover:bg-gray-100 transition-colors">
                                        Relación
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700  cursor-pointer hover:bg-gray-100 transition-colors">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredFormularios.map((formulario, index) => (
                                    <tr
                                        key={formulario.id_formulario}
                                        className="hover:bg-gray-50 transition-colors"
                                        data-aos="fade-up"
                                        data-aos-delay={200 + (index * 50)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formulario.nombre}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoBadgeColor(formulario.tipo)}`}>
                                                <Tag className="h-3 w-3 mr-1" />
                                                {formulario.tipo || 'Sin tipo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {getTipoRelacion(formulario.tipo)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    className="flex items-center gap-1 bg-blue-100 text-[#189cbf] px-3 py-1 rounded hover:bg-blue-200 transition text-sm"
                                                    onClick={() => {
                                                        setFormularioEditar(formulario);
                                                        setShowModalFormulario(true);
                                                    }}
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                    Editar
                                                </button>
                                                <button
                                                    className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition text-sm"
                                                    onClick={() => mostrarConfirmacionEliminar(formulario.id_formulario)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Vista de cards (siempre en móvil, y en escritorio si está seleccionada) */}
            {(viewMode === 'cards' || typeof window !== 'undefined' && window.innerWidth < 640) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFormularios.map((formulario, index) => (
                        <div
                            key={formulario.id_formulario}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow"
                            data-aos="fade-up"
                            data-aos-delay={200 + (index * 100)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 h-10 w-10 bg-[#189cbf] rounded-full flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">{formulario.nombre}</h3>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setFormularioEditar(formulario);
                                            setShowModalFormulario(true);
                                        }}
                                        className="text-[#189cbf] hover:text-[#0f7c9c] p-1 rounded"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => mostrarConfirmacionEliminar(formulario.id_formulario)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoBadgeColor(formulario.tipo)}`}>
                                        <Tag className="h-3 w-3 mr-1" />
                                        {formulario.tipo || 'Sin tipo'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="font-medium">Relación:</span>
                                    <span>{getTipoRelacion(formulario.tipo)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>Creado: {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mensaje cuando no hay datos */}
            {filteredFormularios.length === 0 && (
                <div className="text-center py-12" data-aos="fade-up" data-aos-delay="200">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No se encontraron formularios</p>
                    <p className="text-gray-400 text-sm mt-2">
                        {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando un nuevo formulario'}
                    </p>
                </div>
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
                                        Tipos de Formularios de Evaluación
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
                                    Los formularios se clasifican según el tipo de evaluación y la relación entre evaluador y evaluado:
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <GraduationCap className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">Heteroevaluación</h4>
                                            <p className="text-blue-800 text-sm mb-2">
                                                <strong>Relación:</strong> Estudiante → Docente
                                            </p>
                                            <p className="text-blue-800 text-sm">
                                                Los estudiantes evalúan el desempeño de sus docentes. Este tipo de evaluación permite obtener retroalimentación directa sobre la calidad de la enseñanza desde la perspectiva del estudiante.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <User className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 mb-1">Autoevaluación</h4>
                                            <p className="text-green-800 text-sm mb-2">
                                                <strong>Relación:</strong> Docente → Docente (mismo)
                                            </p>
                                            <p className="text-green-800 text-sm">
                                                Los docentes evalúan su propio desempeño profesional. Permite la reflexión personal sobre fortalezas y áreas de mejora, promoviendo el desarrollo profesional continuo.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <Users className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900 mb-1">Coevaluación</h4>
                                            <p className="text-purple-800 text-sm mb-2">
                                                <strong>Relación:</strong> Docente → Docente (colega)
                                            </p>
                                            <p className="text-purple-800 text-sm">
                                                Los docentes evalúan a sus colegas del mismo departamento o área. Fomenta el trabajo colaborativo y permite intercambiar perspectivas profesionales entre pares.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Características importantes:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Cada formulario está diseñado específicamente para su tipo de evaluación</li>
                                        <li>• Las preguntas y criterios se adaptan a la relación evaluador-evaluado</li>
                                        <li>• Los resultados contribuyen al proceso integral de evaluación docente</li>
                                        <li>• Todos los tipos son complementarios y forman parte del sistema de calidad académica</li>
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

export default AdminFormularios;