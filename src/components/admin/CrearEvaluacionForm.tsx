import { useState, useEffect } from "react";
import ModalEvaluacion from "@/components/ui/modales/ModalEvaluacion";
import { obtenerTodasMisEvaluaciones, crearEvaluacion, notificarEvaluacion, eliminarEvaluacion, editarEvaluacion } from "../../services/evaluacionesService";
import { Bell, BellRing, RotateCcw, Users, GraduationCap, User, Search, Clock, Mail, X, Info, Plus, Edit2, Trash2, Eye } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { toast, Toaster } from "react-hot-toast";

interface EvaluacionTabla {
    id: number;
    id_formulario: number;
    id_periodo: number;
    periodo: string;
    formulario: string;
    fecha: string;
    fecha_notificacion: string | null;
    total_notificaciones?: number;
    tipo_evaluacion?: string;
}

const CrearEvaluacionForm = () => {
    const [evaluaciones, setEvaluaciones] = useState<EvaluacionTabla[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notificandoId, setNotificandoId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mostrarInfo, setMostrarInfo] = useState(false);

    // Estados para el datatable
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<keyof EvaluacionTabla>('fecha');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [evaluacionEdit, setEvaluacionEdit] = useState<any>(null);
    const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
    const [evaluacionDelete, setEvaluacionDelete] = useState<any>(null);
    const [confirmarTexto, setConfirmarTexto] = useState("");

    // 1. Agrega estados para el modal de detalles
    const [showDetalle, setShowDetalle] = useState(false);
    const [evaluacionDetalle, setEvaluacionDetalle] = useState<EvaluacionTabla | null>(null);

    useEffect(() => {
        AOS.init({
            duration: 600,
            once: true,
            easing: 'ease-out',
            offset: 50,
        });
    }, []);

    useEffect(() => {
        fetchEvaluaciones();
    }, []);

    const fetchEvaluaciones = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await obtenerTodasMisEvaluaciones();

            const evaluacionesFormateadas: EvaluacionTabla[] = data.map((ev: any) => ({
                id: ev.id_evaluacion,
                id_formulario: ev.id_formulario, // <-- ahora se incluye
                id_periodo: ev.id_periodo,       // <-- ahora se incluye
                formulario: ev.nombre_formulario || "Formulario desconocido",
                periodo: ev.periodo || "Sin periodo",
                fecha: ev.fecha_inicio
                    ? new Date(ev.fecha_inicio).toLocaleDateString("es-EC", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    })
                    : "Fecha no disponible",
                fecha_notificacion: ev.fecha_notificacion || null,
                total_notificaciones: ev.total_notificaciones || 0,
                tipo_evaluacion: ev.tipo_evaluacion || "autoevaluacion"
            }));

            setEvaluaciones(evaluacionesFormateadas);

            setTimeout(() => {
                AOS.refresh();
            }, 100);
        } catch (err) {
            console.error("Error al cargar evaluaciones:", err);
            setError("No se pudieron cargar las evaluaciones.");
            setEvaluaciones([]);
            toast.error("No se pudieron cargar las evaluaciones.");
        } finally {
            setIsLoading(false);
        }
    };

    const getEstimatedTime = (formulario: string) => {
        const formularioLower = formulario.toLowerCase();
        if (formularioLower.includes('hetero')) {
            return "Este proceso puede tardar varios minutos debido al gran número de estudiantes a notificar.";
        } else if (formularioLower.includes('auto')) {
            return "Este proceso puede tardar algunos minutos debido al número de docentes a notificar.";
        } else if (formularioLower.includes('coe')) {
            return "Este proceso puede tardar unos minutos debido al número de coordinadores a notificar.";
        }
        return "Este proceso puede tardar algunos minutos.";
    };

    const handleNotificarEvaluacion = async (id: number) => {
        const evaluacion = evaluaciones.find(ev => ev.id === id);
        if (!evaluacion) return;

        // Mostrar toast informativo sobre la duración estimada
        const estimatedTime = getEstimatedTime(evaluacion.formulario);
        const hasBeenNotified = !!evaluacion.fecha_notificacion;
        const accionTexto = hasBeenNotified ? "recordatorio" : "notificación";

        toast.loading(
            `Enviando ${accionTexto}... ${estimatedTime} Por favor, no cierre esta ventana.`,
            {
                id: `notification-${id}`,
                duration: 0, // No se cierra automáticamente
                style: {
                    background: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    maxWidth: '600px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                },
                iconTheme: {
                    primary: '#D97706',
                    secondary: '#FEF3C7',
                },
            }
        );

        setNotificandoId(id);
        try {
            const resultado = await notificarEvaluacion(id);
            const tipoAccion = resultado.resultado?.esReNotificacion ? "Recordatorio" : "Notificación";

            // Cerrar el toast de carga
            toast.dismiss(`notification-${id}`);

            // Mostrar toast de éxito
            toast.success(`${tipoAccion} enviado con éxito`, {
                duration: 4000,
                style: {
                    background: '#F0FDF4',
                    color: '#166534',
                    border: '1px solid #22C55E',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
                iconTheme: {
                    primary: '#22C55E',
                    secondary: '#F0FDF4',
                },
            });

            fetchEvaluaciones();
        } catch (err: any) {
            // Cerrar el toast de carga
            toast.dismiss(`notification-${id}`);

            // Mostrar toast de error
            toast.error(`Error al notificar: ${err.message}`, {
                duration: 6000,
                style: {
                    background: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
                iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FEF2F2',
                },
            });
        } finally {
            setNotificandoId(null);
        }
    };

    const handleCrearEvaluacion = async (data: {
        id_formulario: number;
        id_periodo: number;
        id_distributivo?: number;
        tipo: string;
        evaluado_id?: number;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            await crearEvaluacion(data);
            await fetchEvaluaciones();
            toast.success("Evaluación creada exitosamente");
            setModalOpen(false);
        } catch (err: any) {
            console.error("Error al crear evaluación:", err);
            let errorMessage = 'Error al crear la evaluación';
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            if (err.response?.data?.tipo === 'EVALUACION_DUPLICADA') {
                toast.error(errorMessage, {
                    duration: 6000,
                    style: {
                        background: '#FFFBEB',
                        color: '#92400E',
                        border: '1px solid #F59E0B',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        maxWidth: '500px',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    },
                    iconTheme: {
                        primary: '#D97706',
                        secondary: '#FFFBEB',
                    },
                });
            } else {
                setError(`No se pudo crear la evaluación: ${errorMessage}`);
                toast.error(`Error: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Eliminar evaluación con confirmación
    const handleDeleteEvaluacion = async (id: number) => {
        setIsLoading(true);
        try {
            await eliminarEvaluacion(id);
            toast.success("Evaluación eliminada correctamente");
            fetchEvaluaciones();
        } catch (err: any) {
            toast.error("Error al eliminar la evaluación");
        } finally {
            setIsLoading(false);
            setModalDeleteOpen(false);
            setEvaluacionDelete(null);
        }
    };

    // Editar evaluación
    const handleEditEvaluacion = async (data: any) => {
        if (!evaluacionEdit) return;
        setIsLoading(true);
        try {
            await editarEvaluacion(evaluacionEdit.id, data);
            toast.success("Evaluación actualizada correctamente");
            fetchEvaluaciones();
            setModalEditOpen(false);
            setEvaluacionEdit(null);
        } catch (err: any) {
            toast.error("Error al actualizar la evaluación");
        } finally {
            setIsLoading(false);
        }
    };

    // Función para filtrar evaluaciones
    const filteredEvaluaciones = evaluaciones.filter(evaluacion => {
        const searchLower = searchTerm.toLowerCase();
        return (
            evaluacion.periodo.toLowerCase().includes(searchLower) ||
            evaluacion.formulario.toLowerCase().includes(searchLower) ||
            evaluacion.fecha.toLowerCase().includes(searchLower)
        );
    });

    // Función para ordenar evaluaciones
    const sortedEvaluaciones = [...filteredEvaluaciones].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Calcular paginación
    const totalItems = sortedEvaluaciones.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = sortedEvaluaciones.slice(startIndex, endIndex);

    // Función para manejar el ordenamiento
    const handleSort = (field: keyof EvaluacionTabla) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getNotificationButtonProps = (evalItem: EvaluacionTabla) => {
        const isNotifying = notificandoId === evalItem.id;
        const hasBeenNotified = !!evalItem.fecha_notificacion;
        if (isNotifying) {
            return {
                text: "Enviando...",
                icon: <RotateCcw className="w-4 h-4 animate-spin" />,
                className: "bg-blue-100 text-blue-600 cursor-not-allowed",
                disabled: true
            };
        }
        if (hasBeenNotified) {
            return {
                text: "Re-notificar",
                icon: <BellRing className="w-4 h-4" />,
                className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
                disabled: false
            };
        }
        return {
            text: "Notificar",
            icon: <Bell className="w-4 h-4" />,
            className: "bg-[#189cbf]/10 text-[#189cbf] hover:bg-[#189cbf]/20",
            disabled: false
        };
    };

    const getFormularioColor = (formulario: string) => {
        const formularioLower = formulario.toLowerCase();
        if (formularioLower.includes('coe')) {
            return 'bg-blue-50 text-blue-700';
        } else if (formularioLower.includes('hetero')) {
            return 'bg-green-50 text-green-700';
        } else if (formularioLower.includes('auto')) {
            return 'bg-purple-50 text-purple-700';
        }
        return 'bg-gray-50 text-gray-700';
    };

    const getTooltipContent = (evalItem: EvaluacionTabla) => {
        const formularioLower = evalItem.formulario.toLowerCase();
        const hasBeenNotified = !!evalItem.fecha_notificacion;

        let destinatarios = '';
        if (formularioLower.includes('coe')) {
            destinatarios = 'Coordinadores para asignación de coevaluadores docentes';
        } else if (formularioLower.includes('hetero')) {
            destinatarios = 'Todos los estudiantes del periodo';
        } else if (formularioLower.includes('auto')) {
            destinatarios = 'Docentes del periodo';
        } else {
            destinatarios = 'Usuarios del sistema';
        }

        const estimatedTime = getEstimatedTime(evalItem.formulario);
        return `${hasBeenNotified ? 'Reenviar recordatorio' : 'Notificar'} por correo electrónico a: ${destinatarios}. ${estimatedTime}`;
    };

    // Nueva función para doble confirmación de eliminación
    const mostrarConfirmacionEliminar = (evalItem: any) => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-2" data-aos="fade-up" data-aos-duration="300">
                <div className="flex items-start gap-2">
                    <Trash2 className="text-red-500 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-gray-800">
                        ¿Está seguro de que desea eliminar esta evaluación?
                    </p>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            setEvaluacionDelete(evalItem);
                            setModalDeleteOpen(true);
                        }}
                        className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
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

    // Nueva función para confirmar notificación
    const mostrarConfirmacionNotificar = (evalItem: EvaluacionTabla) => {
        const esRecordatorio = !!evalItem.fecha_notificacion;
        const mensaje = esRecordatorio
            ? '¿Desea enviar un recordatorio por correo de esta evaluación?'
            : '¿Desea enviar la notificación por correo de esta evaluación?';
        toast((t) => (
            <div className="p-4 rounded-lg bg-white flex flex-col" data-aos="fade-up" data-aos-duration="300">
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="text-[#189cbf]" size={20} />
                    <span className="text-sm font-medium text-gray-800">{mensaje}</span>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            handleNotificarEvaluacion(evalItem.id);
                        }}
                        className="text-sm px-3 py-1 rounded bg-[#189cbf] text-white hover:bg-[#157a99] transition"
                    >
                        Notificar
                    </button>
                </div>
            </div>
        ), {
            duration: 10000,
            style: {
                borderRadius: '12px',
                background: '#fff',
                minWidth: '320px',
                padding: 0
            },
        });
    };

    return (
        <>
            <Toaster position="bottom-right" />
            <div className="space-y-4">


                <div className="py-5 " data-aos="fade-up">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl text-gray-800 font-medium">Creación de Evaluación</h1>
                            <p className="text-gray-600">Crea evaluaciones según el formulario y periodo. Luego podrás notificar o enviar recordatorios a los evaluados desde la tabla inferior.</p>
                        </div>
                        <button
                            onClick={() => setMostrarInfo(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                            title="Información sobre notificaciones"
                        >
                            <Info className="w-5 h-5" />
                            <span className="hidden sm:inline font-medium">Información</span>
                        </button>
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
                            className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            data-aos="zoom-in"
                            data-aos-duration="300"
                        >
                            <div className="p-6 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Mail className="w-6 h-6 text-[#189cbf]" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            Información sobre notificaciones
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
                                        Las notificaciones se envían automáticamente por correo electrónico a los participantes según el tipo de evaluación:
                                    </p>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <Users className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-blue-900 mb-1">Coevaluación</h4>
                                                <p className="text-blue-800 text-sm">
                                                    Notifica a los coordinadores académicos para que asignen parejas evaluadoras entre docentes del mismo departamento o área.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                            <GraduationCap className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-green-900 mb-1">Heteroevaluación</h4>
                                                <p className="text-green-800 text-sm">
                                                    Notifica masivamente a todos los estudiantes matriculados en el periodo académico correspondiente para evaluar a sus docentes.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                            <User className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-purple-900 mb-1">Autoevaluación</h4>
                                                <p className="text-purple-800 text-sm">
                                                    Notifica individualmente a cada docente activo del periodo para que complete su proceso de autoevaluación.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                            <Clock className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-amber-900 mb-1">Tiempo de procesamiento</h4>
                                                <p className="text-amber-800 text-sm">
                                                    El envío de notificaciones puede tardar varios minutos dependiendo del número de destinatarios.
                                                    <strong className="block mt-1">¡Importante!</strong> Mantenga esta ventana abierta hasta que el proceso termine completamente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-2">Funcionalidades adicionales:</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Puedes reenviar recordatorios a quienes no hayan completado la evaluación</li>
                                            <li>• El sistema registra la fecha y hora de cada notificación enviada</li>
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

                {error && (
                    <div
                        className="bg-red-50 border border-red-200 text-red-800 p-4 text-sm rounded-md flex items-start"
                        data-aos="fade-up"
                        data-aos-delay="50"
                    >
                        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                            <strong className="font-medium">Error: </strong>
                            {error}
                        </span>
                    </div>
                )}

                <ModalEvaluacion
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleCrearEvaluacion}
                />
                {/* Modal de edición */}
                <ModalEvaluacion
                    isOpen={modalEditOpen}
                    onClose={() => { setModalEditOpen(false); setEvaluacionEdit(null); }}
                    onSubmit={handleEditEvaluacion}
                    initialData={evaluacionEdit}
                    modoEdicion={true}
                />
                {/* Modal de confirmación de borrado */}
                {modalDeleteOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setModalDeleteOpen(false)} />
                        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6" data-aos="zoom-in" data-aos-duration="400">
                            <div className="flex items-center gap-3 mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                                <h3 className="text-lg font-semibold text-gray-800">Eliminar Evaluación</h3>
                            </div>
                            <p className="text-gray-700 mb-4">
                                <span className="text-red-600 font-semibold">¡Advertencia!</span> Si elimina la evaluación, también se eliminarán todas las respuestas y evaluaciones realizadas asociadas a este periodo.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-700 mb-1">Para continuar, escriba <span className="font-bold">CONFIRMAR</span> en mayúsculas:</label>
                                <input
                                    type="text"
                                    value={confirmarTexto}
                                    onChange={e => setConfirmarTexto(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                                    placeholder="CONFIRMAR"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setModalDeleteOpen(false); setConfirmarTexto(""); }} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm">Cancelar</button>
                                <button
                                    onClick={() => { handleDeleteEvaluacion(evaluacionDelete?.id); setConfirmarTexto(""); }}
                                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
                                    disabled={confirmarTexto !== "CONFIRMAR"}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controles del datatable */}
                <div className=" space-y-4" data-aos="fade-up" data-aos-delay="150">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar por periodo, formulario o fecha..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#189cbf] focus:border-transparent shadow-sm shadow-gray-100/50 text-gray-700 h-10"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm shadow-gray-100/50 h-10 w-full sm:w-auto">
                                <label className="text-sm text-gray-600">Mostrar:</label>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
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
                                onClick={() => setModalOpen(true)}
                                className="bg-[#189cbf] text-white px-4 py-2 rounded-lg hover:bg-[#0f7c9c] transition-colors flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
                                disabled={isLoading}
                            >
                                <Plus className="h-4 w-4" />
                                {isLoading ? "Cargando..." : "Nueva Evaluación"}
                            </button>
                        </div>
                    </div>

                    {/* Tabla con ordenamiento */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {/* Tarjetas en móvil */}
                        <div className=" block sm:hidden space-y-3">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">Cargando evaluaciones...</div>
                            ) : currentItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">{searchTerm ? 'No se encontraron evaluaciones' : 'No hay evaluaciones disponibles'}</div>
                            ) : (
                                currentItems.map((evalItem) => {
                                    const buttonProps = getNotificationButtonProps(evalItem);
                                    const formularioColorClass = getFormularioColor(evalItem.formulario);
                                    return (
                                        <div key={evalItem.id} className="rounded-lg p-3 flex flex-col gap-1 shadow-sm sm:bg-white sm:border sm:border-gray-200">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-xs text-gray-700">{evalItem.periodo}</span>
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${formularioColorClass}`}>{evalItem.formulario}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    {evalItem.fecha}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    {evalItem.fecha_notificacion ? new Date(evalItem.fecha_notificacion).toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Sin notificar"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        const original = evaluaciones.find(ev => ev.id === evalItem.id);
                                                        setEvaluacionEdit({
                                                            id: evalItem.id,
                                                            id_formulario: original?.id_formulario,
                                                            id_periodo: original?.id_periodo,
                                                            tipo: evalItem.tipo_evaluacion || ""
                                                        });
                                                        setModalEditOpen(true);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-[#189cbf] px-2 py-1 rounded hover:bg-blue-200 transition text-xs font-medium"
                                                    title="Editar evaluación"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const original = evaluaciones.find(ev => ev.id === evalItem.id);
                                                        mostrarConfirmacionEliminar({
                                                            id: evalItem.id,
                                                            id_formulario: original?.id_formulario,
                                                            id_periodo: original?.id_periodo
                                                        });
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition text-xs font-medium"
                                                    title="Eliminar evaluación"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Eliminar
                                                </button>
                                                <button
                                                    onClick={() => mostrarConfirmacionNotificar(evalItem)}
                                                    disabled={buttonProps.disabled}
                                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded font-medium transition-colors text-xs ${buttonProps.className}`}
                                                    title={getTooltipContent(evalItem)}
                                                >
                                                    {buttonProps.icon}
                                                    {buttonProps.text}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {/* Tabla en escritorio */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('periodo')}>Periodo</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('formulario')}>Formulario</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr><td colSpan={3} className="px-6 py-4 text-center">Cargando evaluaciones...</td></tr>
                                    ) : currentItems.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-4 text-center">{searchTerm ? 'No se encontraron evaluaciones' : 'No hay evaluaciones disponibles'}</td></tr>
                                    ) : (
                                        currentItems.map((evalItem) => {
                                            const buttonProps = getNotificationButtonProps(evalItem);
                                            const formularioColorClass = getFormularioColor(evalItem.formulario);
                                            return (
                                                <tr key={evalItem.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">{evalItem.periodo}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${formularioColorClass}`}>{evalItem.formulario}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-row gap-2">
                                                            <button
                                                                onClick={() => { setEvaluacionDetalle(evalItem); setShowDetalle(true); }}
                                                                className="inline-flex items-center justify-center w-8 h-8 bg-[#189cbf] text-white rounded-full hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                                                                title="Ver detalles"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const original = evaluaciones.find(ev => ev.id === evalItem.id);
                                                                    setEvaluacionEdit({
                                                                        id: evalItem.id,
                                                                        id_formulario: original?.id_formulario,
                                                                        id_periodo: original?.id_periodo,
                                                                        tipo: evalItem.tipo_evaluacion || ""
                                                                    });
                                                                    setModalEditOpen(true);
                                                                }}
                                                                className="flex items-center gap-1 bg-blue-100 text-[#189cbf] px-3 py-1 rounded font-medium hover:bg-blue-200 transition text-sm"
                                                                title="Editar evaluación"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const original = evaluaciones.find(ev => ev.id === evalItem.id);
                                                                    mostrarConfirmacionEliminar({
                                                                        id: evalItem.id,
                                                                        id_formulario: original?.id_formulario,
                                                                        id_periodo: original?.id_periodo
                                                                    });
                                                                }}
                                                                className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded font-medium hover:bg-red-200 transition text-sm"
                                                                title="Eliminar evaluación"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                                Eliminar
                                                            </button>
                                                            <button
                                                                onClick={() => mostrarConfirmacionNotificar(evalItem)}
                                                                disabled={buttonProps.disabled}
                                                                className={`flex items-center gap-1 px-3 py-1 rounded font-medium transition-colors text-sm ${buttonProps.className}`}
                                                                title={getTooltipContent(evalItem)}
                                                            >
                                                                {buttonProps.icon}
                                                                {buttonProps.text}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Página {currentPage} de {totalPages}
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
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(num => {
                                            return num === 1 ||
                                                num === totalPages ||
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
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalles */}
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
                                    <label className="block text-sm font-medium text-gray-600">Periodo:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.periodo}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="100">
                                    <label className="block text-sm font-medium text-gray-600">Formulario:</label>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getFormularioColor(evaluacionDetalle.formulario)}`}>{evaluacionDetalle.formulario}</span>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="150">
                                    <label className="block text-sm font-medium text-gray-600">Fecha de inicio:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.fecha}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="200">
                                    <label className="block text-sm font-medium text-gray-600">Fecha de última notificación:</label>
                                    <p className="text-sm text-gray-800">{evaluacionDetalle.fecha_notificacion ? new Date(evaluacionDetalle.fecha_notificacion).toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Sin notificar"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end" data-aos="fade-up" data-aos-delay="250">
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
        </>
    );
};

export default CrearEvaluacionForm;