import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, GraduationCap, Star, Calendar, BookCheck, Info, X, Eye } from 'lucide-react';
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from '../../context/AuthContext';
import evaluacionAutoridadesService, { Periodo, Carrera, Docente, EvaluacionData } from '../../services/evaluacionAutoridades';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Select from "react-select";
import { capitalizarNombreCompleto } from "../../lib/utils";

// Interfaces optimizadas
interface FormData {
    periodo: string;
    carrera: string;
    docente: string;
    calificacion: string;
    observaciones: string;
}

interface EvaluacionExistente {
    id_evaluacion_autoridad: number;
    id_periodo: number;
    id_docente_evaluado: number;
    id_carrera: number;
    calificacion: string;
    observaciones: string;
    nombres_docente: string;
    cedula_docente: string;
    fecha_evaluacion: string;
    nombre_periodo: string;
    nombre_carrera: string;
    evaluador_nombres: string;
    evaluador_cedula: string;
}

const EvaluacionAutoridades: React.FC = () => {
    const { usuario } = useAuth();

    // Estados principales
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [evaluaciones, setEvaluaciones] = useState<EvaluacionExistente[]>([]);

    // Estados del formulario
    const [formData, setFormData] = useState<FormData>({
        periodo: '', carrera: '', docente: '', calificacion: '', observaciones: ''
    });

    // Estados de UI simplificados
    const [loading, setLoading] = useState(false);
    const [loadingDocentes, setLoadingDocentes] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [periodoListar, setPeriodoListar] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [elementosPorPagina, setElementosPorPagina] = useState(10);
    const [mostrarInfo, setMostrarInfo] = useState(false);

    // Agrega un estado para la carga de carreras
    const [cargandoCarreras, setCargandoCarreras] = useState(false);

    // 1. Agrega estados para el modal de detalles
    const [showDetalle, setShowDetalle] = useState(false);
    const [evaluacionDetalle, setEvaluacionDetalle] = useState<EvaluacionExistente | null>(null);

    // Estado para materias del docente en el modal de detalles
    const [materiasDetalle, setMateriasDetalle] = useState<string[]>([]);
    const [loadingMateriasDetalle, setLoadingMateriasDetalle] = useState(false);

    // Efectos
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    // NUEVO: Recargar carreras cuando cambia el periodo en el formulario
    useEffect(() => {
        if (formData.periodo) {
            cargarCarrerasPorPeriodo(formData.periodo);
        }
    }, [formData.periodo]);

    useEffect(() => {
        if (formData.periodo && formData.carrera) {
            cargarDocentes();
            if (!editingId) {
                setFormData(prev => ({ ...prev, docente: '', calificacion: '', observaciones: '' }));
            }
        }
    }, [formData.periodo, formData.carrera, editingId]);

    useEffect(() => {
        if (periodoListar) {
            cargarEvaluaciones();
            setCurrentPage(1);
        }
    }, [periodoListar]);

    useEffect(() => {
        AOS.init({
            duration: 600,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50
        });
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [elementosPorPagina, searchTerm]);

    // Funciones principales
    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            const response = await evaluacionAutoridadesService.obtenerDatosIniciales();
            if (response.success && response.data) {
                setPeriodos(response.data.periodos);
                setCarreras(response.data.carreras);
                if (response.data.periodos.length > 0) {
                    const primerPeriodo = response.data.periodos[0];
                    setPeriodoListar(primerPeriodo.id_periodo.toString());
                }
            } else {
                toast.error('Error al cargar datos iniciales');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar datos iniciales');
        } finally {
            setLoading(false);
        }
    };

    // Nueva función para cargar carreras activas por periodo
    const cargarCarrerasPorPeriodo = async (idPeriodo: string) => {
        try {
            setCargandoCarreras(true);
            const response = await evaluacionAutoridadesService.obtenerDatosIniciales(idPeriodo);
            if (response.success && response.data) {
                setCarreras(response.data.carreras);
            } else {
                toast.error('Error al cargar carreras para el período');
                setCarreras([]);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar carreras para el período');
            setCarreras([]);
        } finally {
            setCargandoCarreras(false);
        }
    };

    const cargarDocentes = async () => {
        try {
            setLoadingDocentes(true);
            const response = await evaluacionAutoridadesService.obtenerDocentes(
                parseInt(formData.periodo),
                parseInt(formData.carrera)
            );
            if (response.success && response.data) {
                setDocentes(response.data);
            } else {
                toast.error('Error al cargar docentes');
                setDocentes([]);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar docentes');
            setDocentes([]);
        } finally {
            setLoadingDocentes(false);
        }
    };

    const cargarEvaluaciones = async () => {
        try {
            setLoading(true);
            const response = await evaluacionAutoridadesService.obtenerEvaluacionesPorPeriodo(parseInt(periodoListar));
            if (response.success && response.data) {
                setEvaluaciones(response.data);
            } else {
                toast.error('Error al cargar evaluaciones');
                setEvaluaciones([]);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar evaluaciones');
            setEvaluaciones([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreate = () => {
        setFormData({ periodo: '', carrera: '', docente: '', calificacion: '', observaciones: '' });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = async (evaluacion: EvaluacionExistente) => {
        setEditingId(evaluacion.id_evaluacion_autoridad);
        setFormData({
            periodo: evaluacion.id_periodo.toString(),
            carrera: evaluacion.id_carrera.toString(),
            docente: evaluacion.id_docente_evaluado.toString(),
            calificacion: evaluacion.calificacion.toString(),
            observaciones: evaluacion.observaciones || ''
        });
        try {
            const response = await evaluacionAutoridadesService.obtenerDocentes(
                evaluacion.id_periodo,
                evaluacion.id_carrera
            );
            if (response.success && response.data) {
                setDocentes(response.data);
            }
        } catch (error) {
            console.error('Error al cargar docentes para edición:', error);
            toast.error('Error al cargar docentes para edición');
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.periodo || !formData.carrera || !formData.docente || !formData.calificacion) {
            toast.error('Todos los campos son obligatorios');
            return;
        }
        if (!usuario?.cedula || !usuario?.nombre) {
            toast.error('Error: Datos del evaluador incompletos');
            return;
        }
        const calificacion = parseFloat(formData.calificacion);
        if (!evaluacionAutoridadesService.validarCalificacion(calificacion)) {
            toast.error('La calificación debe ser un número entre 0 y 100');
            return;
        }

        try {
            setLoading(true);
            const evaluacionData: EvaluacionData = {
                id_periodo: parseInt(formData.periodo),
                id_docente_evaluado: parseInt(formData.docente),
                id_carrera: parseInt(formData.carrera),
                calificacion: parseFloat(formData.calificacion),
                evaluador_cedula: usuario?.cedula || '',
                evaluador_nombres: usuario?.nombre || '',
                evaluador_apellidos: '',
                observaciones: formData.observaciones
            };
            const response = editingId
                ? await evaluacionAutoridadesService.actualizarEvaluacion(editingId, evaluacionData)
                : await evaluacionAutoridadesService.crearEvaluacion(evaluacionData);
            if (response.success) {
                toast.success(response.message || (editingId ? 'Evaluación actualizada correctamente' : 'Evaluación creada correctamente'));
                setShowModal(false);
                setFormData({ periodo: '', carrera: '', docente: '', calificacion: '', observaciones: '' });
                setDocentes([]);
                setEditingId(null);
                if (periodoListar) cargarEvaluaciones();
            } else {
                toast.error(response.message || 'Error al guardar la evaluación');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar la evaluación');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-2">
                <div className="flex items-start gap-2">
                    <Trash2 className="text-red-500 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-gray-800">
                        ¿Estás seguro de que deseas eliminar esta evaluación?
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
    };

    const confirmarEliminacion = async (id: number) => {
        try {
            const response = await evaluacionAutoridadesService.eliminarEvaluacion(id);
            if (response.success) {
                toast.success('Evaluación eliminada correctamente');
                cargarEvaluaciones();
            } else {
                toast.error(response.message || 'Error al eliminar la evaluación');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar la evaluación');
        }
    };

    const cerrarModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ periodo: '', carrera: '', docente: '', calificacion: '', observaciones: '' });
        setDocentes([]);
    };

    const getDocenteSeleccionado = () => {
        return docentes.find(doc => doc.id_docente.toString() === formData.docente);
    };

    // Filtrar y paginar evaluaciones
    const filteredEvaluaciones = evaluaciones.filter(evaluacion => {
        const searchLower = searchTerm.toLowerCase();
        return (
            evaluacion.nombres_docente.toLowerCase().includes(searchLower) ||
            evaluacion.cedula_docente.includes(searchTerm) ||
            evaluacion.nombre_carrera.toLowerCase().includes(searchLower)
        );
    });

    const indiceInicio = (currentPage - 1) * elementosPorPagina;
    const indiceFin = indiceInicio + elementosPorPagina;
    const asignacionesPaginadas = filteredEvaluaciones.slice(indiceInicio, indiceFin);
    const totalPaginas = Math.ceil(filteredEvaluaciones.length / elementosPorPagina);

    if (loading && periodos.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#189cbf]"></div>
            </div>
        );
    }

    const opcionesPeriodos = periodos.map(periodo => ({
        value: periodo.id_periodo.toString(),
        label: periodo.descripcion
    }));

    const opcionesCarreras = carreras.map(carrera => ({
        value: carrera.id_carrera.toString(),
        label: carrera.nombre_carrera
    }));

    const opcionesDocentes = docentes.map(docente => ({
        value: docente.id_docente.toString(),
        label: `${capitalizarNombreCompleto(docente.nombres_completos)} - ${docente.cedula_docente}`
    }));

    // Filtrar docentes ya evaluados en el mismo periodo y carrera (excepto si se está editando)
    const docentesYaEvaluados = evaluaciones
        .filter(ev =>
            ev.id_periodo.toString() === formData.periodo &&
            ev.id_carrera.toString() === formData.carrera &&
            (!editingId || ev.id_evaluacion_autoridad !== editingId)
        )
        .map(ev => ev.id_docente_evaluado.toString());

    const opcionesDocentesFiltradas = opcionesDocentes.filter(opt =>
        !docentesYaEvaluados.includes(opt.value) || opt.value === formData.docente
    );

    // Puedes colocar esto al inicio del archivo o cerca del componente
    const customStyles = {
        control: (base: any, state: any) => ({
            ...base,
            borderRadius: "0.5rem",
            borderColor: state.isFocused ? "#189cbf" : "#e5e7eb",
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

    // Función para cargar materias del docente al abrir el modal de detalles
    const handleOpenDetalle = async (evaluacion: EvaluacionExistente) => {
        setEvaluacionDetalle(evaluacion);
        setShowDetalle(true);
        setMateriasDetalle([]);
        setLoadingMateriasDetalle(true);
        // Buscar en docentes cargados
        let docente = docentes.find(d => d.id_docente === evaluacion.id_docente_evaluado);
        if (docente && docente.materias) {
            setMateriasDetalle(docente.materias.split(',').map(m => m.trim()).filter(Boolean));
            setLoadingMateriasDetalle(false);
            return;
        }
        // Si no está, consulta a la API
        try {
            const res = await evaluacionAutoridadesService.obtenerDocentes(evaluacion.id_periodo, evaluacion.id_carrera);
            if (res.success && res.data) {
                const docenteApi = res.data.find((d: Docente) => d.id_docente === evaluacion.id_docente_evaluado);
                if (docenteApi && docenteApi.materias) {
                    setMateriasDetalle(docenteApi.materias.split(',').map((m: string) => m.trim()).filter(Boolean));
                } else {
                    setMateriasDetalle([]);
                }
            } else {
                setMateriasDetalle([]);
            }
        } catch {
            setMateriasDetalle([]);
        }
        setLoadingMateriasDetalle(false);
    };

    return (
        <div className="py-5">
            <Toaster position="bottom-right" />
            <div className="flex items-center justify-between mb-6" data-aos="fade-up">
                {/* Header */}
                <div>
                    <h1 className="text-xl text-gray-800 font-medium">Evaluación de Autoridades</h1>
                    <p className="text-gray-600">Gestiona las evaluaciones de docentes por período académico</p>
                </div>
                <button
                    onClick={() => setMostrarInfo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                    title="Información sobre evaluación de autoridades"
                >
                    <Info className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">Información</span>
                </button>
            </div>

            {/* Información del evaluador */}
            {usuario?.nombre && (
                <div
                    className="bg-[#189cbf]/10 border-l-4 border-[#189cbf] p-4 rounded-2xl mb-6 mt-6"
                    data-aos="fade-right"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#189cbf] rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[#189cbf] font-semibold">{usuario.nombre}</p>
                            <p className="text-[#189cbf]/80 text-xs mt-0.5">{usuario.rolTexto || 'Evaluador'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controles del datatable */}
            <div className="space-y-4" data-aos="fade-up" data-aos-delay="100">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar por docente, cédula o carrera..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#189cbf] focus:border-transparent shadow-sm shadow-gray-100/50 text-gray-700 h-10"
                            />
                        </div>
                        <div className="w-full sm:w-70">
                            <div className="w-full sm:w-70">
                                <Select
                                    options={opcionesPeriodos}
                                    value={opcionesPeriodos.find(opt => opt.value === periodoListar)}
                                    onChange={selected => setPeriodoListar(selected ? selected.value : '')}
                                    placeholder="Seleccionar período"
                                    isSearchable
                                    isClearable={false}
                                    styles={customStyles}
                                    menuPortalTarget={document.body}
                                    noOptionsMessage={() => "No hay períodos disponibles"}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm shadow-gray-100/50 h-10 w-full sm:w-auto">
                            <label className="text-sm text-gray-600">Mostrar:</label>
                            <select
                                value={elementosPorPagina}
                                onChange={(e) => {
                                    setElementosPorPagina(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border-0 bg-transparent text-sm text-gray-700 focus:ring-2 focus:ring-[#189cbf] focus:border-transparent rounded-md"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-600">registros</span>
                        </div>
                    </div>
                    {/* Lado derecho: Botón crear */}
                    <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                            onClick={handleCreate}
                            className="bg-[#189cbf] text-white px-4 py-2 rounded-lg hover:bg-[#0f7c9c] transition-colors flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
                            disabled={loading}
                        >
                            <Plus className="h-4 w-4" />
                            {loading ? "Cargando..." : "Nueva Evaluación"}
                        </button>
                    </div>
                </div>

                {/* Tabla con ordenamiento (solo escritorio) */}
                <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Docente</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell">Carrera</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Calificación</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 w-28">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center">Cargando evaluaciones...</td>
                                    </tr>
                                ) : asignacionesPaginadas.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-0">
                                            <div className="text-center py-12" data-aos="fade-up" data-aos-delay="200">
                                                <BookCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 text-lg">No se encontraron evaluaciones</p>
                                                <p className="text-gray-400 text-sm mt-2">{searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay evaluaciones disponibles para este período'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    asignacionesPaginadas.map((evaluacion) => (
                                        <tr key={evaluacion.id_evaluacion_autoridad} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap max-w-[180px] truncate lg:whitespace-normal">
                                                <div className="flex items-center min-w-0">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-[#189cbf] rounded-full flex items-center justify-center">
                                                        <User className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="ml-4 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate lg:whitespace-normal">{capitalizarNombreCompleto(evaluacion.nombres_docente)}</div>
                                                        <div className="text-sm text-gray-500 truncate lg:whitespace-normal">CI: {evaluacion.cedula_docente}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell max-w-[140px] truncate xl:whitespace-normal">
                                                <div className="flex items-center min-w-0">
                                                    <GraduationCap className="h-4 w-4 text-[#189cbf] mr-2 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-gray-900 truncate xl:whitespace-normal">{evaluacion.nombre_carrera}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                                                    <span className="text-sm font-medium text-gray-900">{evaluacion.calificacion}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium w-28">
                                                <div className="flex flex-row gap-2">
                                                    <button
                                                        onClick={() => handleOpenDetalle(evaluacion)}
                                                        className="inline-flex items-center justify-center w-8 h-8 bg-[#189cbf] text-white rounded-full hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(evaluacion)}
                                                        className="flex items-center gap-1 bg-blue-100 text-[#189cbf] px-3 py-1 rounded hover:bg-blue-200 transition text-sm"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Editar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(evaluacion.id_evaluacion_autoridad)}
                                                        className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition text-sm"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Eliminar</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tarjetas en móvil */}
                <div className="block sm:hidden space-y-4">
                    {asignacionesPaginadas.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No hay evaluaciones para este período</div>
                    ) : (
                        asignacionesPaginadas.map((evaluacion) => (
                            <div key={evaluacion.id_evaluacion_autoridad} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-2 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <div>
                                        <div className="font-semibold text-xs text-gray-700">{capitalizarNombreCompleto(evaluacion.nombres_docente)}</div>
                                        <div className="text-xs text-gray-500">CI: {evaluacion.cedula_docente}</div>
                                        <div className="text-xs text-gray-500">Carrera: {evaluacion.nombre_carrera}</div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenDetalle(evaluacion)}
                                        className="inline-flex items-center justify-center w-8 h-8 bg-[#189cbf] text-white rounded-full hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                                        title="Ver detalles"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs mb-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="font-medium text-gray-800">{evaluacion.calificacion}</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleEdit(evaluacion)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-[#189cbf] px-2 py-1 rounded hover:bg-blue-200 transition text-xs font-medium"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(evaluacion.id_evaluacion_autoridad)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition text-xs font-medium"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                            Página {currentPage} de {totalPaginas}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                                    .filter(num => {
                                        return num === 1 ||
                                            num === totalPaginas ||
                                            (num >= currentPage - 2 && num <= currentPage + 2);
                                    })
                                    .map((num, index, array) => (
                                        <div key={num} className="flex items-center">
                                            {index > 0 && array[index - 1] !== num - 1 && (
                                                <span className="px-2 text-gray-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(num)}
                                                className={`px-3 py-1 text-sm border rounded ${currentPage === num
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
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPaginas))}
                                disabled={currentPage === totalPaginas}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
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
                        className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        data-aos="zoom-in"
                        data-aos-duration="300"
                    >
                        <div className="p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Star className="w-6 h-6 text-[#189cbf]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Información sobre Evaluación de Autoridades
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
                                    La evaluación de autoridades es una modalidad dentro del proceso de coevaluación docente, donde las autoridades académicas evalúan el desempeño de los docentes:
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <User className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">¿Quién evalúa?</h4>
                                            <p className="text-blue-800 text-sm">
                                                Las autoridades académicas (vicerrectores, decanos, directores) evalúan el desempeño docente desde una perspectiva institucional y de liderazgo.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <GraduationCap className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 mb-1">Proceso de evaluación</h4>
                                            <p className="text-green-800 text-sm">
                                                Selecciona el período académico, carrera y docente a evaluar. Asigna una calificación del 0 al 100 y agrega observaciones relevantes sobre el desempeño.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <Search className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900 mb-1">Gestión de evaluaciones</h4>
                                            <p className="text-purple-800 text-sm">
                                                Utiliza la barra de búsqueda para encontrar evaluaciones por docente, cédula o carrera. Puedes editar o eliminar evaluaciones existentes.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                        <Calendar className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900 mb-1">Filtros y organización</h4>
                                            <p className="text-amber-800 text-sm">
                                                Filtra las evaluaciones por período académico y ajusta la cantidad de registros mostrados en la tabla para una mejor visualización.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Criterios de evaluación:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Desempeño académico y profesional del docente</li>
                                        <li>• Cumplimiento de responsabilidades institucionales</li>
                                        <li>• Participación en actividades académicas y de investigación</li>
                                        <li>• Liderazgo y colaboración en el desarrollo institucional</li>
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

            {/* Modal simplificado */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-aos="zoom-in" data-aos-duration="300">
                        <div className="p-6">
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
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        {editingId ? 'Editar Evaluación' : 'Nueva Evaluación'}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Cerrar"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div data-aos="fade-up" data-aos-delay="100">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Período Académico *
                                        </label>
                                        <Select
                                            options={opcionesPeriodos}
                                            value={opcionesPeriodos.find(opt => opt.value === formData.periodo)}
                                            onChange={selected => setFormData(prev => ({ ...prev, periodo: selected ? selected.value : '' }))}
                                            placeholder="Seleccionar período"
                                            isSearchable
                                            isClearable={false}
                                            classNamePrefix="react-select"
                                            styles={customStyles}
                                            menuPortalTarget={document.body}
                                            noOptionsMessage={() => "No hay períodos disponibles"}
                                        />
                                    </div>

                                    <div data-aos="fade-up" data-aos-delay="150">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Carrera *
                                        </label>
                                        <Select
                                            inputId="carreraSelect"
                                            options={opcionesCarreras}
                                            value={opcionesCarreras.find(opt => opt.value === formData.carrera)}
                                            onChange={selected => setFormData(prev => ({ ...prev, carrera: selected ? selected.value : '' }))}
                                            placeholder="Seleccionar carrera"
                                            isSearchable
                                            isClearable={false}
                                            styles={customStyles}
                                            isDisabled={loading || cargandoCarreras}
                                            noOptionsMessage={() => cargandoCarreras ? (
                                                <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#189cbf]"></span> Cargando...</span>
                                            ) : "No hay carreras disponibles"}
                                            menuPortalTarget={document.body}
                                        />
                                    </div>
                                </div>

                                <div data-aos="fade-up" data-aos-delay="200">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Docente *
                                    </label>
                                    <Select
                                        options={opcionesDocentesFiltradas}
                                        value={opcionesDocentes.find(opt => opt.value === formData.docente)}
                                        onChange={selected => setFormData(prev => ({ ...prev, docente: selected ? selected.value : '' }))}
                                        placeholder={loadingDocentes ? "Cargando docentes..." : "Seleccionar docente"}
                                        isSearchable
                                        isClearable={false}
                                        classNamePrefix="react-select"
                                        styles={customStyles}
                                        menuPortalTarget={document.body}
                                        isDisabled={!formData.periodo || !formData.carrera || loadingDocentes}
                                        noOptionsMessage={() => loadingDocentes ? "Cargando docentes..." : "No hay docentes disponibles para evaluar"}
                                    />
                                </div>
                                {formData.docente && (
                                    <div data-aos="fade-up" data-aos-delay="250">
                                        {getDocenteSeleccionado() && (
                                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] bg-[#189cbf] rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <p className="text-gray-900 font-medium">
                                                            {capitalizarNombreCompleto(getDocenteSeleccionado()?.nombres_completos || '')}
                                                        </p>
                                                        <p className="text-gray-600 text-sm">
                                                            Cédula: {getDocenteSeleccionado()?.cedula_docente}
                                                        </p>
                                                        {(() => {
                                                            const docente = getDocenteSeleccionado();
                                                            const materias = docente?.materias ?? '';
                                                            if (materias.split(',').filter(m => m.trim()).length > 0) {
                                                                return (
                                                                    <p className="text-gray-700 text-sm mt-2">
                                                                        <span className="font-semibold">Materias en el periodo:</span><br />
                                                                        {materias.split(',').map((mat, idx) => (
                                                                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs mr-1 mb-1">{mat.trim()}</span>
                                                                        ))}
                                                                    </p>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div data-aos="fade-up" data-aos-delay="300">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Calificación (0-100) *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="calificacion"
                                                    value={formData.calificacion}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#189cbf] focus:border-transparent"
                                                    placeholder="Ingrese la calificación"
                                                    required
                                                />
                                            </div>
                                            <div data-aos="fade-up" data-aos-delay="350">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Observaciones
                                                </label>
                                                <textarea
                                                    name="observaciones"
                                                    value={formData.observaciones}
                                                    onChange={handleInputChange}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#189cbf] focus:border-transparent"
                                                    placeholder="Comentarios adicionales (opcional)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3" data-aos="fade-up" data-aos-delay="400">
                                    <button
                                        type="button"
                                        onClick={cerrarModal}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.docente}
                                        className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${loading || !formData.docente
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-[#189cbf] hover:bg-[#0f7c9c]'
                                            }`}
                                    >
                                        {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de detalles (visible en móvil y escritorio) */}
            {showDetalle && evaluacionDetalle && (
                <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-xl"
                        data-aos="zoom-in"
                        data-aos-duration="300"
                        data-aos-easing="ease-out-cubic"
                    >
                        <button
                            onClick={() => setShowDetalle(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-4" data-aos="fade-up" data-aos-delay="0">
                                <Eye className="w-6 h-6 text-[#189cbf]" />
                                <h3 className="text-lg font-semibold text-gray-800">Detalles de la Evaluación</h3>
                            </div>
                            <div className="space-y-3">
                                <div data-aos="fade-up" data-aos-delay="50">
                                    <label className="block text-sm font-medium text-gray-600">Docente:</label>
                                    <p className="text-sm text-gray-800">{capitalizarNombreCompleto(evaluacionDetalle.nombres_docente)} (CI: {evaluacionDetalle.cedula_docente})</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="70">
                                    <label className="block text-sm font-medium text-gray-600">Carrera:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.nombre_carrera}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="90">
                                    <label className="block text-sm font-medium text-gray-600">Período académico:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.nombre_periodo}</p>
                                </div>
                                {/* Materias si existen */}
                                {loadingMateriasDetalle ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#189cbf]"></span> Cargando materias...
                                    </div>
                                ) : materiasDetalle.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Materias en el período:</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {materiasDetalle.map((mat, idx) => (
                                                <span key={idx} className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs mr-1 mb-1">{mat}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div data-aos="fade-up" data-aos-delay="130">
                                    <label className="block text-sm font-medium text-gray-600">Calificación:</label>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                        {evaluacionDetalle.calificacion}
                                    </span>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="150">
                                    <label className="block text-sm font-medium text-gray-600">Evaluador:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.evaluador_nombres}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="170">
                                    <label className="block text-sm font-medium text-gray-600">Fecha de evaluación:</label>
                                    <p className="text-sm text-gray-800">{new Date(evaluacionDetalle.fecha_evaluacion).toLocaleDateString()}</p>
                                </div>
                                {evaluacionDetalle.observaciones && (
                                    <div data-aos="fade-up" data-aos-delay="190">
                                        <label className="block text-sm font-medium text-gray-600">Observaciones:</label>
                                        <p className="text-sm text-gray-800">{evaluacionDetalle.observaciones}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end" data-aos="fade-up" data-aos-delay="210">
                            <button
                                onClick={() => setShowDetalle(false)}
                                className="px-4 py-2 text-sm bg-[#189cbf] text-white rounded-md hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvaluacionAutoridades;