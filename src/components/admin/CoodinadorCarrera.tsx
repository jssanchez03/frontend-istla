import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, GraduationCap, Mail, Calendar, Grid3X3, List, Info, X } from 'lucide-react';
import { toast, Toaster } from "react-hot-toast";
import coordinadorService, {
    Coordinador,
    Carrera,
    AsignacionCoordinador,
    CoordinadorData
} from '../../services/coordinadorService';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Select from "react-select";
import { capitalizarNombreCompleto } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            data-aos="fade"
            data-aos-duration="200"
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
                data-aos="fade-up"
                data-aos-duration="350"
            >
                {children}
            </div>
        </div>
    );
};

const CoordinadorCarrera: React.FC = () => {
    // Estados principales
    const [asignaciones, setAsignaciones] = useState<AsignacionCoordinador[]>([]);
    const [coordinadores, setCoordinadores] = useState<Coordinador[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    // Estados del modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CoordinadorData>({
        cedula: '',
        nombres: '',
        apellidos: '',
        correo: '',
        id_carrera: 0
    });
    const [mostrarInfo, setMostrarInfo] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
    const [confirmationToastId, setConfirmationToastId] = useState<string | null>(null);
    // Estado para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const elementosPorPagina = 5;

    // Inicializar AOS
    useEffect(() => {
        AOS.init({
            duration: 600,
            once: true,
            easing: 'ease-out',
            offset: 50,
        });
    }, []);

    // Cargar datos iniciales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [selectsResult, asignacionesResult] = await Promise.all([
                coordinadorService.obtenerDatosSelects(),
                coordinadorService.obtenerAsignaciones()
            ]);

            if (selectsResult.success) {
                setCoordinadores(selectsResult.data?.coordinadores || []);
                setCarreras(selectsResult.data?.carreras || []);
            } else {
                toast.error(selectsResult.message || 'Error al cargar datos de selects');
            }

            if (asignacionesResult.success) {
                setAsignaciones(asignacionesResult.data || []);
            } else {
                toast.error(asignacionesResult.message || 'Error al cargar asignaciones');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar datos');
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar asignaciones por búsqueda
    const filteredAsignaciones = asignaciones.filter(asignacion => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (asignacion.nombres_coordinador?.toLowerCase() || '').includes(searchLower) ||
            (asignacion.apellidos_coordinador?.toLowerCase() || '').includes(searchLower) ||
            (asignacion.nombre_carrera?.toLowerCase() || '').includes(searchLower) ||
            (asignacion.cedula_coordinador || '').includes(searchTerm)
        );
    });

    // Calcular datos paginados
    const totalPaginas = Math.ceil(filteredAsignaciones.length / elementosPorPagina);
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const indiceFin = indiceInicio + elementosPorPagina;
    const asignacionesPaginadas = filteredAsignaciones.slice(indiceInicio, indiceFin);

    // Abrir modal para crear
    const handleCreate = () => {
        setFormData({ cedula: '', nombres: '', apellidos: '', correo: '', id_carrera: 0 });
        setEditingId(null);
        setShowModal(true);
    };

    // Abrir modal para editar
    const handleEdit = async (id: number) => {
        try {
            const result = await coordinadorService.obtenerCoordinadorPorId(id);
            if (result.success && result.data) {
                setFormData({
                    cedula: result.data.cedula_coordinador,
                    nombres: result.data.nombres_coordinador,
                    apellidos: result.data.apellidos_coordinador,
                    correo: result.data.correo_coordinador,
                    id_carrera: result.data.id_carrera
                });
                setEditingId(id);
                setShowModal(true);
            } else {
                toast.error(result.message || 'Error al obtener datos del coordinador');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al obtener datos del coordinador');
        }
    };

    // Guardar (crear o actualizar)
    const handleSave = async () => {
        if (!formData.cedula || !formData.id_carrera) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        try {
            const result = editingId
                ? await coordinadorService.actualizarAsignacion(editingId, formData)
                : await coordinadorService.crearAsignacion(formData);

            if (result.success) {
                toast.success(editingId ? 'Asignación actualizada correctamente' : 'Asignación creada correctamente');
                setShowModal(false);
                loadData();
            } else {
                toast.error(result.message || 'Error al guardar la asignación');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar la asignación');
        }
    };

    // Eliminar asignación con confirmación toast
    const handleDelete = (id: number) => {
        // Prevenir múltiples clicks en el mismo elemento
        if (deletingIds.has(id)) {
            return;
        }

        // Cerrar cualquier toast de confirmación anterior
        if (confirmationToastId) {
            toast.dismiss(confirmationToastId);
        }

        const toastId = toast((t) => (
            <div className="flex flex-col gap-3 p-2">
                <div className="flex items-start gap-2">
                    <Trash2 className="text-red-500 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-gray-800">
                        ¿Estás seguro de que deseas eliminar esta asignación?
                    </p>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            setConfirmationToastId(null);
                        }}
                        className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            setConfirmationToastId(null);
                            confirmarEliminacion(id);
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

        setConfirmationToastId(toastId);
    };

    const confirmarEliminacion = async (id: number) => {
        // Marcar como "eliminando" para prevenir múltiples clicks
        setDeletingIds(prev => new Set(prev).add(id));

        try {
            const result = await coordinadorService.eliminarAsignacion(id);

            if (result.success) {
                // Actualizar el estado local inmediatamente para una mejor UX
                setAsignaciones(prev => prev.filter(asignacion => asignacion.id_coordinador_carrera !== id));

                // Mostrar toast de éxito
                toast.success('Asignación eliminada correctamente', {
                    duration: 3000,
                    style: {
                        borderRadius: '12px',
                        background: '#fefefe',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                });
            } else {
                toast.error(result.message || 'Error al eliminar la asignación');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar la asignación');
        } finally {
            // Remover el ID de la lista de "eliminando"
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#189cbf]"></div>
            </div>
        );
    }

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
            fontSize: "0.95rem",
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
            fontSize: "0.95rem",
            padding: "0.5rem 1rem",
        }),
        input: (base: any) => ({
            ...base,
            fontSize: "0.95rem",
        }),
        singleValue: (base: any) => ({
            ...base,
            fontSize: "0.95rem",
            color: "#111827",
        }),
        menuPortal: (base: any) => ({
            ...base,
            zIndex: 99999,
        }),
    };

    return (
        <>
            <Toaster
                position="bottom-right"
            />
            <div className="py-5">
                <div className='flex items-center justify-between mb-6' data-aos="fade-up">
                    <div>
                        <h1 className="text-lg sm:text-xl text-gray-800 font-medium">Coordinadores de Carrera</h1>
                        <p className="text-sm sm:text-base text-gray-600">Gestiona las asignaciones de coordinadores a las diferentes carreras</p>
                    </div>
                    <button
                        onClick={() => setMostrarInfo(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                        title="Información sobre coordinadores de carrera"
                    >
                        <Info className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Información</span>
                    </button>
                </div>

                {/* Controles superiores Coordinador de Carrera */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6" data-aos="fade-up" data-aos-delay="100">
                    {/* Buscador */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por coordinador, carrera, correo..."
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
                        {/* Botón crear en sm+ */}
                        <button
                            onClick={handleCreate}
                            className="bg-[#189cbf] hover:bg-[#0f7c9c] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Nueva Asignación</span>
                        </button>
                    </div>
                    {/* Botón crear en móvil */}
                    <div className="sm:hidden mt-2">
                        <button
                            onClick={handleCreate}
                            className="w-full bg-[#189cbf] hover:bg-[#0f7c9c] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Asignación
                        </button>
                    </div>
                </div>

                {/* Vista de tabla (solo escritorio) */}
                {viewMode === 'table' && (
                    <div className="hidden sm:block bg-white shadow rounded-lg overflow-hidden" data-aos="fade-up" data-aos-delay="150">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                                            Coordinador
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                                            Carrera
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell">
                                            Contacto
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors hidden xl:table-cell">
                                            Fecha Asignación
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors w-28">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {asignacionesPaginadas.map((asignacion, index) => (
                                        <tr
                                            key={asignacion.id_coordinador_carrera}
                                            className="hover:bg-gray-50 transition-colors"
                                            data-aos="fade-up"
                                            data-aos-delay={200 + (index * 50)}
                                        >
                                            <td className="px-3 sm:px-6 py-4 max-w-[180px] truncate lg:whitespace-normal">
                                                <div className="flex items-center min-w-0">
                                                    <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-[#189cbf] rounded-full flex items-center justify-center">
                                                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                                    </div>
                                                    <div className="ml-3 sm:ml-4 min-w-0">
                                                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate lg:whitespace-normal">
                                                            {capitalizarNombreCompleto(asignacion.nombres_coordinador)} {capitalizarNombreCompleto(asignacion.apellidos_coordinador)}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-500 truncate lg:whitespace-normal">
                                                            CI: {asignacion.cedula_coordinador}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 max-w-[140px] truncate lg:whitespace-normal">
                                                <div className="flex items-center min-w-0">
                                                    <GraduationCap className="h-4 w-4 text-[#189cbf] mr-2 flex-shrink-0" />
                                                    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate lg:whitespace-normal">
                                                        {asignacion.nombre_carrera}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 hidden lg:table-cell max-w-[160px] truncate xl:whitespace-normal">
                                                <div className="flex items-center min-w-0">
                                                    <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                                    <span className="text-xs sm:text-sm text-gray-900 truncate xl:whitespace-normal">
                                                        {asignacion.correo_coordinador}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                                    <span className="text-xs sm:text-sm text-gray-900">
                                                        {new Date(asignacion.fecha_asignacion).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium w-28">
                                                <div className="flex flex-col gap-1 min-[400px]:flex-row min-[400px]:gap-2">
                                                    <button
                                                        onClick={() => handleEdit(asignacion.id_coordinador_carrera)}
                                                        className="flex items-center justify-center gap-1 bg-blue-100 text-[#189cbf] px-2 sm:px-3 py-1 rounded hover:bg-blue-200 transition text-xs sm:text-sm"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Editar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(asignacion.id_coordinador_carrera)}
                                                        className="flex items-center justify-center gap-1 bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded hover:bg-red-200 transition text-xs sm:text-sm"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Eliminar</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAsignaciones.map((asignacion, index) => (
                            <div
                                key={asignacion.id_coordinador_carrera}
                                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow"
                                data-aos="fade-up"
                                data-aos-delay={200 + (index * 100)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-[#189cbf] rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                                {capitalizarNombreCompleto(asignacion.nombres_coordinador)} {capitalizarNombreCompleto(asignacion.apellidos_coordinador)}
                                            </h3>
                                            <p className="text-xs text-gray-500">CI: {asignacion.cedula_coordinador}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <button
                                            onClick={() => handleEdit(asignacion.id_coordinador_carrera)}
                                            className="text-[#189cbf] hover:text-[#0f7c9c] p-1 rounded"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(asignacion.id_coordinador_carrera)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{asignacion.correo_coordinador}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-[#189cbf] flex-shrink-0" />
                                        <span className="font-medium truncate">{asignacion.nombre_carrera}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <span>Desde: {new Date(asignacion.fecha_asignacion).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Controles de paginación SOLO en la vista de tabla */}
                {viewMode === 'table' && totalPaginas > 1 && (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 pt-4 border-t border-gray-200 space-y-3 md:space-y-0 px-4 md:px-0">
                        <div className="text-sm text-gray-600 text-center md:text-left">
                            Página {paginaActual} de {totalPaginas}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                disabled={paginaActual === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                                    .filter(num => {
                                        return num === 1 ||
                                            num === totalPaginas ||
                                            (num >= paginaActual - 2 && num <= paginaActual + 2);
                                    })
                                    .map((num, index, array) => (
                                        <div key={num} className="flex items-center">
                                            {index > 0 && array[index - 1] !== num - 1 && (
                                                <span className="px-2 text-gray-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setPaginaActual(num)}
                                                className={`px-3 py-1 text-sm border rounded ${paginaActual === num
                                                    ? 'bg-[#189cbf] text-white border-[#189cbf]'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>
                            <button
                                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                disabled={paginaActual === totalPaginas}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
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
                                            <GraduationCap className="w-6 h-6 text-[#189cbf]" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            Información sobre Coordinadores de Carrera
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
                                        Este módulo permite gestionar las asignaciones de coordinadores a carreras específicas. Es fundamental para que los coordinadores puedan acceder a sus funcionalidades:
                                    </p>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <Plus className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-blue-900 mb-1">Crear Asignación</h4>
                                                <p className="text-blue-800 text-sm">
                                                    Asignar un coordinador existente a una carrera específica. Sin esta asignación, el coordinador no podrá acceder a los reportes de su carrera.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                            <Edit2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-green-900 mb-1">Editar Asignación</h4>
                                                <p className="text-green-800 text-sm">
                                                    Modificar la asignación existente, cambiar el coordinador o la carrera asignada según sea necesario.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                            <Trash2 className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-purple-900 mb-1">Eliminar Asignación</h4>
                                                <p className="text-purple-800 text-sm">
                                                    Remover la asignación de un coordinador a una carrera. Esto impedirá que el coordinador acceda a los reportes de esa carrera.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                            <Search className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-amber-900 mb-1">Buscar y Filtrar</h4>
                                                <p className="text-amber-800 text-sm">
                                                    Buscar asignaciones por nombre del coordinador, cédula o carrera para encontrar rápidamente la información necesaria.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-2">Importante:</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Los coordinadores <strong>deben</strong> tener una asignación de carrera para descargar reportes</li>
                                            <li>• El sistema registra automáticamente la fecha de asignación</li>
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

                {/* Mensaje cuando no hay datos */}
                {filteredAsignaciones.length === 0 && (
                    <div className="text-center py-12" data-aos="fade-up" data-aos-delay="200">
                        <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No se encontraron asignaciones</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando una nueva asignación'}
                        </p>
                    </div>
                )}

                {/* Modal */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <div className="p-4 sm:p-6">
                        {/* Encabezado con icono y botón cerrar */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#189cbf]/10 rounded-lg">
                                    {editingId ? (
                                        <Edit2 className="w-6 h-6 text-[#189cbf]" />
                                    ) : (
                                        <Plus className="w-6 h-6 text-[#189cbf]" />
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {editingId ? 'Editar Asignación de Coordinador' : 'Nueva Asignación de Coordinador'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cerrar"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Coordinador *
                                </label>
                                <Select
                                    options={coordinadores.map(coord => ({
                                        value: coord.cedula,
                                        label: `${capitalizarNombreCompleto(coord.nombres)} ${capitalizarNombreCompleto(coord.apellidos)} - ${coord.cedula}`,
                                    }))}
                                    value={coordinadores
                                        .map(coord => ({
                                            value: coord.cedula,
                                            label: `${capitalizarNombreCompleto(coord.nombres)} ${capitalizarNombreCompleto(coord.apellidos)} - ${coord.cedula}`,
                                        }))
                                        .find(opt => opt.value === formData.cedula)}
                                    onChange={selected => {
                                        if (selected) {
                                            const coord = coordinadores.find(c => c.cedula === selected.value);
                                            setFormData({
                                                ...formData,
                                                cedula: selected.value,
                                                nombres: coord?.nombres || '',
                                                apellidos: coord?.apellidos || '',
                                                correo: coord?.correo || '',
                                            });
                                        } else {
                                            setFormData({
                                                ...formData,
                                                cedula: '',
                                                nombres: '',
                                                apellidos: '',
                                                correo: '',
                                            });
                                        }
                                    }}
                                    placeholder="Seleccionar coordinador..."
                                    isSearchable
                                    isClearable={false}
                                    styles={customStyles}
                                    menuPortalTarget={document.body}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Carrera *
                                </label>
                                <Select
                                    options={carreras.map(carrera => ({
                                        value: carrera.id_carrera,
                                        label: carrera.nombre_carrera,
                                    }))}
                                    value={carreras
                                        .map(carrera => ({
                                            value: carrera.id_carrera,
                                            label: carrera.nombre_carrera,
                                        }))
                                        .find(opt => opt.value === formData.id_carrera)}
                                    onChange={selected => setFormData({
                                        ...formData,
                                        id_carrera: selected ? selected.value : 0,
                                    })}
                                    placeholder="Seleccionar carrera..."
                                    isSearchable
                                    isClearable={false}
                                    styles={customStyles}
                                    menuPortalTarget={document.body}
                                />
                            </div>

                            {formData.cedula && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-600 break-words">
                                        <strong>Nombre:</strong> {capitalizarNombreCompleto(formData.nombres)} {capitalizarNombreCompleto(formData.apellidos)}
                                    </p>
                                    <p className="text-sm text-gray-600 break-words">
                                        <strong>Email:</strong> {formData.correo}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-[#189cbf] hover:bg-[#0f7c9c] text-white py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
                            >
                                {editingId ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default CoordinadorCarrera;