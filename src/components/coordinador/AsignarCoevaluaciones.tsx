import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Plus, Trash2, Calendar, Clock, CheckCircle, AlertCircle, Bell, RotateCcw, Info, X, Pencil, Eye } from "lucide-react";
import { obtenerPeriodos, notificarDocentesCoevaluacion } from "@/services/evaluacionesService";
import Select from "react-select";
import AOS from "aos";
import "aos/dist/aos.css";

interface Docente {
    id_docente: number;
    nombre: string;
}

interface DocenteConMaterias {
    id_docente: number;
    nombre: string;
    materias: {
        id_distributivo: number;
        id_asignatura: number;
        nombre_asignatura: string;
    }[];
}

interface Asignacion {
    id_asignacion: number;
    id_periodo: number;
    id_docente_evaluador: number;
    id_docente_evaluado: number;
    nombre_evaluador: string;
    nombre_evaluado: string;
    descripcion_periodo: string;
    fecha?: string;
    hora_inicio?: string;
    hora_fin?: string;
    dia?: string;
    id_asignatura?: number;
    id_carrera?: number;
    id_nivel?: number;
    id_distributivo?: number;
    nombre_asignatura?: string;
    nombre_carrera?: string;
    nombre_nivel?: string;
    estado_evaluacion?: string;
    fecha_completada?: string;
}

const AsignarCoevaluaciones = () => {
    const [evaluadores, setEvaluadores] = useState<Docente[]>([]);
    const [evaluados, setEvaluados] = useState<DocenteConMaterias[]>([]);
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
    const [evaluador, setEvaluador] = useState<number | null>(null);
    const [evaluado, setEvaluado] = useState<number | null>(null);
    const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<number | null>(null);
    const [periodos, setPeriodos] = useState([]);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingNotificacion, setLoadingNotificacion] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [elementosPorPagina, setElementosPorPagina] = useState(5);
    const [filtroTexto, setFiltroTexto] = useState("");
    const [fecha, setFecha] = useState<string>("");
    const [horaInicio, setHoraInicio] = useState<string>("");
    const [horaFin, setHoraFin] = useState<string>("");
    const [mostrarInfo, setMostrarInfo] = useState(false);
    const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [asignacionEdit, setAsignacionEdit] = useState<Asignacion | null>(null);
    const [showDetalle, setShowDetalle] = useState(false);
    const [asignacionDetalle, setAsignacionDetalle] = useState<Asignacion | null>(null);
    const opcionesPeriodos = periodos.map((p: any) => ({
        value: p.id_periodo,
        label: p.descripcion,
    }));

    const opcionesEvaluadores = evaluadores.map((d: Docente) => ({
        value: d.id_docente,
        label: d.nombre,
    }));

    const opcionesEvaluados = evaluados.map((d: DocenteConMaterias) => ({
        value: d.id_docente,
        label: `${d.nombre} (${d.materias.length} materia${d.materias.length !== 1 ? 's' : ''})`,
    }));

    // Opciones de asignaturas filtradas por docente evaluado seleccionado
    const opcionesAsignaturas = (() => {
        if (!evaluado) return [];

        const docenteSeleccionado = evaluados.find(d => d.id_docente === evaluado);
        if (!docenteSeleccionado) return [];

        return docenteSeleccionado.materias.map((materia) => ({
            value: materia.id_asignatura,
            label: materia.nombre_asignatura,
        }));
    })();

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

    // Función para obtener el día de la semana en español
    const obtenerDiaSemana = (fecha: string): string => {
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const fechaObj = new Date(fecha + 'T00:00:00');
        return diasSemana[fechaObj.getDay()];
    };

    // Función para formatear fecha
    const formatearFecha = (fecha: string): string => {
        if (!fecha) return '—';

        try {
            const fechaObj = new Date(fecha);
            return fechaObj.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return '—';
        }
    };

    // Función para formatear hora
    const formatearHora = (hora: string | undefined): string => {
        if (!hora) return '';
        try {
            // Si la hora viene en formato HH:MM:SS, la cortamos a HH:MM
            return hora.substring(0, 5);
        } catch (error) {
            return hora;
        }
    };

    useEffect(() => {
        cargarPeriodos();
        AOS.init({ duration: 700, once: true });
    }, []);

    // Cargar datos cuando cambie el período
    useEffect(() => {
        if (periodoSeleccionado) {
            cargarDocentes();
            cargarAsignaciones();
        }
    }, [periodoSeleccionado]);

    // Limpiar asignatura seleccionada cuando cambie el docente evaluado
    useEffect(() => {
        setAsignaturaSeleccionada(null);
    }, [evaluado]);

    // useEffect para seleccionar la asignatura al editar
    useEffect(() => {
        if (modoEdicion && asignacionEdit && evaluado) {
            // Buscar si la asignatura existe en las opciones actuales
            const docenteSeleccionado = evaluados.find(d => d.id_docente === evaluado);
            if (docenteSeleccionado && asignacionEdit.id_asignatura) {
                const existe = docenteSeleccionado.materias.some(m => m.id_asignatura === asignacionEdit.id_asignatura);
                if (existe) {
                    setAsignaturaSeleccionada(asignacionEdit.id_asignatura);
                }
            }
        }
        // Solo ejecutar cuando cambian estos valores
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modoEdicion, asignacionEdit, evaluado, evaluados]);

    const cargarPeriodos = async () => {
        try {
            const data = await obtenerPeriodos();
            setPeriodos(data);
            if (data.length > 0) {
                setPeriodoSeleccionado(data[0].id_periodo);
            }
        } catch (err) {
            console.error("Error al cargar periodos:", err);
            toast.error("Error al cargar periodos");
        }
    };

    const cargarDocentes = async () => {
        if (!periodoSeleccionado) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Cargar docentes evaluadores
            const resEvaluadores = await axios.get(
                `http://localhost:3000/api/v1/asignaciones/docentes-evaluadores/${periodoSeleccionado}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Cargar docentes con materias para ser evaluados
            const resEvaluados = await axios.get(
                `http://localhost:3000/api/v1/asignaciones/docentes-materias/${periodoSeleccionado}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (resEvaluadores.data.success) {
                setEvaluadores(resEvaluadores.data.data);
            }

            if (resEvaluados.data.success) {
                setEvaluados(resEvaluados.data.data);
            }
        } catch (err) {
            console.error("Error al cargar docentes:", err);
            toast.error("Error al cargar docentes");
        } finally {
            setLoading(false);
        }
    };

    // REVERTIR la función cargarAsignaciones a la original:
    const cargarAsignaciones = async () => {
        if (!periodoSeleccionado) return;

        try {
            const token = localStorage.getItem("token");

            const res = await axios.get("http://localhost:3000/api/v1/asignaciones", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.data.success) {
                const asignacionesFiltradas = res.data.data.filter(
                    (asig: Asignacion) => asig.id_periodo === periodoSeleccionado
                );
                setAsignaciones(asignacionesFiltradas);
            }

        } catch (err) {
            console.error("Error al cargar asignaciones:", err);
            toast.error("Error al cargar asignaciones");
        }
    };

    // 3. AGREGAR FUNCIÓN PARA FORMATEAR ESTADO:
    const formatearEstado = (estado: string) => {
        const estados = {
            'completada': {
                texto: 'Completada',
                clase: 'bg-green-100 text-green-800',
                icono: <CheckCircle className="h-3 w-3" />
            },
            'pendiente': {
                texto: 'Pendiente',
                clase: 'bg-yellow-100 text-yellow-800',
                icono: <Clock className="h-3 w-3" />
            },
            'sin_evaluacion': {
                texto: 'Sin evaluación',
                clase: 'bg-gray-100 text-gray-600',
                icono: <AlertCircle className="h-3 w-3" />
            }
        };

        return estados[estado as keyof typeof estados] || estados.sin_evaluacion;
    };

    // 2. FUNCIONES PARA PAGINACIÓN Y FILTRADO (agregar después de formatearEstado)
    const asignacionesFiltradas = asignaciones.filter(asig =>
        asig.nombre_evaluador.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        asig.nombre_evaluado.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (asig.nombre_asignatura && asig.nombre_asignatura.toLowerCase().includes(filtroTexto.toLowerCase()))
    );

    const totalPaginas = Math.ceil(asignacionesFiltradas.length / elementosPorPagina);
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const indiceFin = indiceInicio + elementosPorPagina;
    const asignacionesPaginadas = asignacionesFiltradas.slice(indiceInicio, indiceFin);

    // Resetear página cuando cambie el filtro
    useEffect(() => {
        setPaginaActual(1);
    }, [filtroTexto]);

    const limpiarFormulario = () => {
        setEvaluador(null);
        setEvaluado(null);
        setAsignaturaSeleccionada(null);
        setFecha("");
        setHoraInicio("00:00");
        setHoraFin("00:00");
    };

    const handleAsignar = async () => {
        if (!evaluador || !evaluado || !periodoSeleccionado || !fecha || !horaInicio || !horaFin) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }

        if (evaluador === evaluado) {
            toast.error("Un docente no puede evaluarse a sí mismo.");
            return;
        }

        // Validar horarios si se proporcionan
        if (horaInicio && horaFin && horaInicio >= horaFin) {
            toast.error("La hora de inicio debe ser anterior a la hora de fin.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Preparar datos con los nuevos campos
            const datosAsignacion = {
                id_docente_evaluador: evaluador,
                id_docente_evaluado: evaluado,
                id_periodo: periodoSeleccionado,
                // Campos adicionales opcionales
                ...(asignaturaSeleccionada && { id_asignatura: asignaturaSeleccionada }),
                ...(fecha && {
                    fecha,
                    dia: obtenerDiaSemana(fecha)
                }),
                ...(horaInicio && { hora_inicio: horaInicio }),
                ...(horaFin && { hora_fin: horaFin }),
            };

            const response = await axios.post(
                "http://localhost:3000/api/v1/asignaciones/crear",
                datosAsignacion,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Al final del try block en handleAsignar, después de cargarAsignaciones();
            if (response.data.success) {
                toast.success(response.data.message || "Asignación registrada exitosamente");
                limpiarFormulario();
                cargarAsignaciones();
                // Cerrar modal si está abierto
                setMostrarModalAsignacion(false);
            }
        } catch (err: any) {
            console.error("Error al asignar:", err);

            if (err.response?.status === 409) {
                // Mostrar mensaje específico del backend
                toast.error(err.response.data.error);
            } else if (err.response?.status === 400) {
                toast.error(err.response.data.error || "Datos inválidos");
            } else {
                toast.error("Error al crear la asignación");
            }
        } finally {
            setLoading(false);
        }
    };

    // 3. Funciones para confirmación de eliminación
    const mostrarConfirmacionEliminar = (id: number) => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-2" data-aos="fade-up" data-aos-duration="300">
                <div className="flex items-start gap-2">
                    <Trash2 className="text-red-500 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-gray-800">
                        ¿Estás seguro de que deseas eliminar esta asignación?
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
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.delete(
                `http://localhost:3000/api/v1/asignaciones/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Asignación eliminada exitosamente");
                cargarAsignaciones();
            }
        } catch (err: any) {
            console.error("Error al eliminar asignación:", err);
            toast.error("Error al eliminar la asignación");
        } finally {
            setLoading(false);
        }
    };

    // Agregar nueva función para manejar la notificación:
    // 3. TAMBIÉN CORRECCIÓN EN LA VALIDACIÓN DE handleNotificarDocentes
    const handleNotificarDocentes = async () => {
        if (!periodoSeleccionado) {
            toast.error("Selecciona un período para notificar.");
            return;
        }

        // Mostrar confirmación
        toast((t) => (
            <div className="flex flex-col gap-3 p-2" data-aos="fade-up" data-aos-duration="300">
                <div className="flex items-start gap-2">
                    <AlertCircle className="text-[#189cbf] mt-0.5" size={20} />
                    <p className="text-sm font-medium text-gray-800">
                        ¿Deseas notificar a todos los docentes sobre la coevaluación del período seleccionado?
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
                            ejecutarNotificacion();
                        }}
                        className="text-sm px-3 py-1 rounded-md bg-[#189cbf] text-white hover:bg-[#189cbf] transition"
                    >
                        Notificar
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

    const ejecutarNotificacion = async () => {
        // Mostrar toast informativo sobre la duración estimada
        toast.loading(
            `Enviando notificación... Este proceso puede tardar unos minutos debido al número de docentes a notificar. Por favor, no cierre esta ventana.`,
            {
                id: `notification-coevaluacion`,
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

        setLoadingNotificacion(true);
        try {
            // Asegurar que periodoSeleccionado es number
            const resultado = await notificarDocentesCoevaluacion(periodoSeleccionado!);

            // Cerrar el toast de carga
            toast.dismiss(`notification-coevaluacion`);

            if (resultado.resultado?.enviadosExitosos > 0) {
                // Mostrar toast de éxito
                toast.success(resultado.message, {
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
            } else {
                // Mostrar toast de error
                toast.error("No se pudo notificar a ningún docente", {
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
            }
        } catch (error: any) {
            console.error("Error al notificar docentes:", error);

            // Cerrar el toast de carga
            toast.dismiss(`notification-coevaluacion`);

            // Mostrar toast de error
            const errorMessage = error.response?.status === 400
                ? error.response.data.error || "No hay docentes para notificar en este período"
                : "Error al enviar las notificaciones";

            toast.error(`Error al notificar: ${errorMessage}`, {
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
            setLoadingNotificacion(false);
        }
    };

    // Nueva función para manejar edición
    const handleEditarAsignacion = (asig: Asignacion) => {
        setModoEdicion(true);
        setAsignacionEdit(asig);
        setEvaluador(asig.id_docente_evaluador);
        setEvaluado(asig.id_docente_evaluado);
        setAsignaturaSeleccionada(asig.id_asignatura || null);
        // Precargar fecha en formato YYYY-MM-DD
        let fechaISO = "";
        if (asig.fecha) {
            const d = new Date(asig.fecha);
            fechaISO = d.toISOString().slice(0, 10);
        }
        setFecha(fechaISO);
        setHoraInicio(asig.hora_inicio || "");
        setHoraFin(asig.hora_fin || "");
        setMostrarModalAsignacion(true);
    };

    const handleGuardarEdicion = async () => {
        if (!asignacionEdit) return;
        if (!evaluador || !evaluado || !periodoSeleccionado || !fecha || !horaInicio || !horaFin) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }
        if (evaluador === evaluado) {
            toast.error("Un docente no puede evaluarse a sí mismo.");
            return;
        }
        if (horaInicio && horaFin && horaInicio >= horaFin) {
            toast.error("La hora de inicio debe ser anterior a la hora de fin.");
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const datosAsignacion = {
                id_docente_evaluador: evaluador,
                id_docente_evaluado: evaluado,
                id_periodo: periodoSeleccionado,
                ...(asignaturaSeleccionada && { id_asignatura: asignaturaSeleccionada }),
                ...(fecha && { fecha, dia: obtenerDiaSemana(fecha) }),
                ...(horaInicio && { hora_inicio: horaInicio }),
                ...(horaFin && { hora_fin: horaFin }),
            };
            await axios.put(
                `http://localhost:3000/api/v1/asignaciones/${asignacionEdit.id_asignacion}`,
                datosAsignacion,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Asignación editada exitosamente");
            setMostrarModalAsignacion(false);
            setModoEdicion(false);
            setAsignacionEdit(null);
            limpiarFormulario();
            cargarAsignaciones();
        } catch (err: any) {
            console.error("Error al editar asignación:", err);
            toast.error("Error al editar la asignación");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Toaster position="bottom-right" />
            <div className="py-5 space-y-6 px-2 sm:px-4 md:px-6 lg:px-4 xl:px-0" data-aos="fade-up">
                <div className="flex items-center justify-between mb-6" data-aos="fade-right">
                    <h1 className="text-xl text-gray-800 font-medium">Asignación de Coevaluaciones</h1>
                    <button
                        onClick={() => setMostrarInfo(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#189cbf] rounded-lg transition-colors"
                        title="Información sobre asignaciones de coevaluación"
                    >
                        <Info className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Información</span>
                    </button>
                </div>

                {/* Selector de período principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna 1: Selector de período */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="w-full">
                            <label className="block text-sm text-gray-700 font-medium mb-2">
                                Seleccionar Período Académico
                            </label>
                            <Select
                                options={opcionesPeriodos}
                                value={opcionesPeriodos.find((opt) => opt.value === periodoSeleccionado)}
                                onChange={(selected) => {
                                    if (selected) {
                                        setPeriodoSeleccionado(selected.value);
                                        limpiarFormulario();
                                    }
                                }}
                                placeholder="Seleccionar período..."
                                isSearchable
                                styles={customStyles}
                                isDisabled={loading}
                                noOptionsMessage={() => "No hay períodos disponibles"}
                            />
                        </div>
                    </div>

                    {/* Columna 2: Información del período */}
                    {periodoSeleccionado && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                            <div className="flex items-center justify-between h-full">
                                {/* Información del período */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-[#189cbf] rounded-full"></div>
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                            Período Seleccionado
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium">
                                        <strong>Período:</strong>{" "}
                                        {opcionesPeriodos.find((p) => p.value === periodoSeleccionado)?.label}
                                    </p>
                                    <p className="text-sm text-[#189cbf] mt-1">
                                        <strong>Docentes para evaluar:</strong> {evaluados.length}
                                    </p>
                                </div>

                                {/* Separador visual */}
                                <div className="w-px h-12 bg-gray-200 mx-4"></div>

                                {/* Botón de notificación */}
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-600 mb-2 font-medium">
                                        Acciones
                                    </span>
                                    <div className="flex gap-2 w-full">
                                        <button
                                            onClick={() => {
                                                limpiarFormulario();
                                                setModoEdicion(false);
                                                setAsignacionEdit(null);
                                                setMostrarModalAsignacion(true);
                                            }}
                                            disabled={loading}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 justify-center shadow-sm ${loading
                                                ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                                                : "bg-green-600 text-white hover:bg-green-700 border border-green-600 hover:border-green-700"
                                                }`}
                                            title="Crear nueva asignación de coevaluación"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="hidden sm:inline">Nueva Asignación</span>
                                        </button>

                                        <button
                                            onClick={handleNotificarDocentes}
                                            disabled={loadingNotificacion || loading}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 justify-center shadow-sm min-w-[60px] xl:min-w-[160px] ${loadingNotificacion || loading
                                                ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                                                : "bg-[#189cbf] text-white hover:bg-[#157a99] border border-[#189cbf] hover:border-[#157a99]"
                                                }`}
                                            title="Envía notificaciones por correo electrónico a todos los docentes del período seleccionado"
                                        >
                                            {loadingNotificacion ? (
                                                <RotateCcw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Bell className="w-4 h-4" />
                                            )}
                                            <span className="hidden sm:inline">
                                                {loadingNotificacion ? "Enviando..." : "Notificar"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabla de asignaciones con DataTable */}
                <div className="bg-white p-3 sm:p-6 rounded-md sm:rounded-lg shadow border border-gray-200" data-aos="fade-up">
                    {/* Buscador y controles compactos en móvil */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-0">
                        <h3 className="text-base sm:text-lg font-medium">
                            Asignaciones del período actual
                            {asignacionesFiltradas.length > 0 && (
                                <span className="ml-2 text-xs sm:text-sm font-normal text-gray-600">
                                    ({asignacionesFiltradas.length} de {asignaciones.length} asignación{asignaciones.length !== 1 ? 'es' : ''})
                                </span>
                            )}
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs sm:text-sm text-gray-600">Mostrar:</label>
                                <select
                                    value={elementosPorPagina}
                                    onChange={(e) => {
                                        setElementosPorPagina(Number(e.target.value));
                                        setPaginaActual(1);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-xs sm:text-sm text-gray-600">registros</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs sm:text-sm text-gray-600">Buscar:</label>
                                <input
                                    type="text"
                                    value={filtroTexto}
                                    onChange={(e) => setFiltroTexto(e.target.value)}
                                    placeholder="Filtrar por nombre o asignatura..."
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Tarjetas en móvil */}
                    <div className="block sm:hidden space-y-3">
                        {asignacionesPaginadas.map((asig) => (
                            <div key={asig.id_asignacion} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-xs text-gray-700">{asig.nombre_evaluador}</span>
                                    <span className="font-semibold text-xs text-gray-700">→ {asig.nombre_evaluado}</span>
                                </div>
                                <div className="text-xs text-gray-600 mb-1">{asig.nombre_asignatura || '—'}</div>
                                <div className="flex flex-wrap gap-2 text-xs mb-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        {asig.fecha ? formatearFecha(asig.fecha) : '—'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {(asig.hora_inicio || asig.hora_fin) ? `${formatearHora(asig.hora_inicio)} - ${formatearHora(asig.hora_fin)}` : '—'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {asig.dia ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{asig.dia}</span>
                                        ) : '—'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {(() => {
                                            const estadoInfo = formatearEstado(asig.estado_evaluacion || 'sin_evaluacion');
                                            return (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.clase}`}>
                                                    <span className="mr-1">{estadoInfo.icono}</span>
                                                    {estadoInfo.texto}
                                                </span>
                                            );
                                        })()}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleEditarAsignacion(asig)}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-[#189cbf] px-2 py-1 rounded hover:bg-blue-200 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Editar asignación"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => mostrarConfirmacionEliminar(asig.id_asignacion)}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Eliminar asignación"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Tabla en escritorio */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Evaluador</th>
                                    <th className="px-4 py-3 text-left font-medium">Evaluado</th>
                                    <th className="px-4 py-3 text-left font-medium">Período</th>
                                    <th className="px-4 py-3 text-left font-medium">Asignatura</th>
                                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                                    <th className="px-4 py-3 text-left font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {asignacionesPaginadas.map((asig, index) => (
                                    <tr key={asig.id_asignacion} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="px-4 py-3 font-medium">
                                            {asig.nombre_evaluador}
                                        </td>
                                        <td className="px-4 py-3">
                                            {asig.nombre_evaluado}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {asig.descripcion_periodo || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {asig.nombre_asignatura || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {(() => {
                                                const estadoInfo = formatearEstado(asig.estado_evaluacion || 'sin_evaluacion');
                                                return (
                                                    <div className="flex flex-col gap-1 min-h-[40px] justify-center">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.clase}`}>
                                                            <span className="mr-1">{estadoInfo.icono}</span>
                                                            {estadoInfo.texto}
                                                        </span>
                                                        <span className="text-xs text-gray-500 min-h-[16px] block">
                                                            {asig.fecha_completada ? formatearFecha(asig.fecha_completada) : <span className="opacity-0">00/00/0000</span>}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button
                                                onClick={() => { setAsignacionDetalle(asig); setShowDetalle(true); }}
                                                className="inline-flex items-center justify-center w-8 h-8 bg-[#189cbf] text-white rounded-full hover:bg-[#157c9f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:ring-offset-2"
                                                title="Ver detalles"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditarAsignacion(asig)}
                                                disabled={loading}
                                                className="flex items-center gap-1 bg-blue-100 text-[#189cbf] px-3 py-1 rounded hover:bg-blue-200 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Editar asignación"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => mostrarConfirmacionEliminar(asig.id_asignacion)}
                                                disabled={loading}
                                                className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Eliminar asignación"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-2 sm:gap-0">
                            {/* Texto arriba en móvil */}
                            <div className="block sm:hidden text-xs text-gray-600 mb-1">
                                Mostrando {indiceInicio + 1} a {Math.min(indiceFin, asignacionesFiltradas.length)} de {asignacionesFiltradas.length} registros
                            </div>
                            {/* Texto a la izquierda en desktop */}
                            <div className="hidden sm:block text-sm text-gray-600">
                                Mostrando {indiceInicio + 1} a {Math.min(indiceFin, asignacionesFiltradas.length)} de {asignacionesFiltradas.length} registros
                            </div>
                            {/* Botones de paginación */}
                            <div className="flex flex-row flex-wrap gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
                                <button
                                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                    disabled={paginaActual === 1}
                                    className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                                        .filter(num => {
                                            return num === 1 || num === totalPaginas || (num >= paginaActual - 2 && num <= paginaActual + 2);
                                        })
                                        .map((num, index, array) => (
                                            <div key={num} className="flex items-center">
                                                {index > 0 && array[index - 1] !== num - 1 && (
                                                    <span className="px-1 sm:px-2 text-gray-400">...</span>
                                                )}
                                                <button
                                                    onClick={() => setPaginaActual(num)}
                                                    className={`px-2 py-1 text-xs sm:text-sm border rounded ${paginaActual === num
                                                        ? 'bg-[#189cbf] text-white border-[#189cbf]'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {num}
                                                </button>
                                            </div>
                                        ))}
                                </div>
                                <button
                                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                    disabled={paginaActual === totalPaginas}
                                    className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal renderizado al final del documento usando React Portal-like approach */}
            {mostrarInfo && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop que cubre toda la pantalla */}
                    <div
                        className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm"
                        aria-hidden="true"
                        data-aos="fade"
                        data-aos-duration="200"
                        onClick={() => setMostrarInfo(false)}
                    />
                    {/* Contenido del modal */}
                    <div
                        className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto z-10 mx-4"
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
                                        Información sobre Asignación de Coevaluaciones
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
                                    Esta herramienta permite al coordinador gestionar completamente las asignaciones de coevaluación entre docentes:
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <Plus className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 mb-1">Crear Nueva Asignación</h4>
                                            <p className="text-green-800 text-sm">
                                                Asigna un docente evaluador y selecciona al docente a evaluar junto con su asignatura específica. Puedes agregar campos adicionales como fecha, hora de inicio, hora final y día para programar la evaluación.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <CheckCircle className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900 mb-1">Seguimiento de Estados</h4>
                                            <p className="text-purple-800 text-sm">
                                                La tabla muestra todas las asignaciones con su estado actual: <strong>Completada</strong> (evaluación finalizada), <strong>Pendiente</strong> (en proceso) o <strong>Sin evaluación</strong> (no iniciada), incluyendo fechas de completado cuando corresponda.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                                        <Bell className="w-6 h-6 text-cyan-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-cyan-900 mb-1">Sistema de Notificaciones</h4>
                                            <p className="text-cyan-800 text-sm">
                                                Una vez creadas las asignaciones, puedes notificar a los docentes evaluadores por correo electrónico. Es posible reenviar notificaciones múltiples veces como recordatorios.
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

            {/* Modal de Nueva Asignación */}
            {mostrarModalAsignacion && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ margin: 0 }}>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            margin: 0,
                            padding: 0
                        }}
                        data-aos="fade"
                        data-aos-duration="200"
                        aria-hidden="true"
                        onClick={() => setMostrarModalAsignacion(false)}
                    />

                    {/* Contenido del modal */}
                    <div
                        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10 mx-4"
                        data-aos="zoom-in"
                        data-aos-duration="300"
                    >
                        <div className="p-6">
                            {/* Encabezado del modal adaptado con azul institucional */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${modoEdicion ? 'bg-[#189cbf]/10' : 'bg-green-100'}`}>
                                        {modoEdicion ? (
                                            <Pencil className="w-6 h-6 text-[#189cbf]" />
                                        ) : (
                                            <Plus className="w-6 h-6 text-green-600" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {modoEdicion ? "Editar Asignación de Coevaluación" : "Nueva Asignación de Coevaluación"}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setMostrarModalAsignacion(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Campos principales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm text-gray-700 font-medium mb-1">
                                        Docente Evaluador *
                                    </label>
                                    <Select
                                        options={opcionesEvaluadores}
                                        value={opcionesEvaluadores.find((opt) => opt.value === evaluador)}
                                        onChange={(selected) => selected && setEvaluador(selected.value)}
                                        placeholder="Buscar evaluador..."
                                        isSearchable
                                        styles={customStyles}
                                        isDisabled={loading}
                                        noOptionsMessage={() => "No hay docentes evaluadores disponibles"}
                                        menuPortalTarget={document.body} // Añadir esta línea
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 font-medium mb-1">
                                        Docente a Evaluar *
                                    </label>
                                    <Select
                                        options={opcionesEvaluados}
                                        value={opcionesEvaluados.find((opt) => opt.value === evaluado)}
                                        onChange={(selected) => selected && setEvaluado(selected.value)}
                                        placeholder="Buscar docente..."
                                        isSearchable
                                        styles={customStyles}
                                        isDisabled={loading}
                                        noOptionsMessage={() => "No hay docentes con materias disponibles"}
                                        menuPortalTarget={document.body} // Añadir esta línea
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 font-medium mb-1">
                                        Asignatura del Docente
                                    </label>
                                    <Select
                                        options={opcionesAsignaturas}
                                        value={opcionesAsignaturas.find((opt) => opt.value === asignaturaSeleccionada)}
                                        onChange={(selected) => setAsignaturaSeleccionada(selected ? selected.value : null)}
                                        placeholder={evaluado ? "Seleccionar asignatura..." : "Elige primero al docente"}
                                        isSearchable
                                        isClearable
                                        styles={customStyles}
                                        isDisabled={loading || !evaluado}
                                        noOptionsMessage={() => evaluado ? "Este docente no tiene asignaturas" : "Selecciona un docente primero"}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                            </div>

                            {/* Campos de programación */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm text-gray-700 font-medium mb-1">
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        disabled={loading}
                                        required
                                    />
                                    {fecha && (
                                        <p className="text-xs text-gray-500 mt-1 min-h-[18px]">
                                            Día: {obtenerDiaSemana(fecha) ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ml-1">
                                                    {obtenerDiaSemana(fecha)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 ml-1">
                                                    —
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 font-medium mb-1">
                                        Hora Inicio *
                                    </label>
                                    <input
                                        type="time"
                                        value={horaInicio}
                                        onChange={(e) => setHoraInicio(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 font-medium mb-1">
                                        Hora Fin *
                                    </label>
                                    <input
                                        type="time"
                                        value={horaFin}
                                        onChange={(e) => setHoraFin(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Botones del modal */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setMostrarModalAsignacion(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        if (modoEdicion) {
                                            await handleGuardarEdicion();
                                        } else {
                                            await handleAsignar();
                                        }
                                        if (!loading) setMostrarModalAsignacion(false);
                                    }}
                                    disabled={loading || !evaluador || !evaluado || !fecha || !horaInicio || !horaFin}
                                    className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium text-sm ${
                                        loading || !evaluador || !evaluado || !fecha || !horaInicio || !horaFin
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : modoEdicion
                                                ? "bg-[#189cbf] text-white hover:bg-[#157a99] hover:shadow-lg"
                                                : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg"
                                    }`}
                                >
                                    {modoEdicion ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    {loading ? "Procesando..." : modoEdicion ? "Guardar Cambios" : "Crear Asignación"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de detalles */}
            {showDetalle && asignacionDetalle && (
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
                                <h3 className="text-lg font-semibold text-gray-800">Detalles de la Asignación</h3>
                            </div>
                            <div className="space-y-3">
                                <div data-aos="fade-up" data-aos-delay="50">
                                    <label className="block text-sm font-medium text-gray-600">Evaluador:</label>
                                    <p className="text-sm text-gray-800">{asignacionDetalle.nombre_evaluador}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="100">
                                    <label className="block text-sm font-medium text-gray-600">Evaluado:</label>
                                    <p className="text-sm text-gray-800">{asignacionDetalle.nombre_evaluado}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="150">
                                    <label className="block text-sm font-medium text-gray-600">Período:</label>
                                    <p className="text-sm text-gray-800">{asignacionDetalle.descripcion_periodo}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="200">
                                    <label className="block text-sm font-medium text-gray-600">Asignatura:</label>
                                    <p className="text-sm text-gray-800">{asignacionDetalle.nombre_asignatura}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="250">
                                    <label className="block text-sm font-medium text-gray-600">Estado:</label>
                                    <div className="flex items-center mt-1">
                                        {(() => {
                                            const estadoInfo = formatearEstado(asignacionDetalle.estado_evaluacion || 'sin_evaluacion');
                                            return (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.clase}`}>
                                                    <span className="mr-1">{estadoInfo.icono}</span>
                                                    {estadoInfo.texto}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="300">
                                    <label className="block text-sm font-medium text-gray-600">Fecha:</label>
                                    <p className="text-sm text-gray-800">{asignacionDetalle.fecha ? formatearFecha(asignacionDetalle.fecha) : '—'}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="350">
                                    <label className="block text-sm font-medium text-gray-600">Horario:</label>
                                    <p className="text-sm text-gray-800">{(asignacionDetalle.hora_inicio || asignacionDetalle.hora_fin) ? `${formatearHora(asignacionDetalle.hora_inicio)} - ${formatearHora(asignacionDetalle.hora_fin)}` : '—'}</p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="400">
                                    <label className="block text-sm font-medium text-gray-600">Día:</label>
                                    <p className="text-sm text-gray-800">
                                        {asignacionDetalle.dia ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                {asignacionDetalle.dia}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                                —
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div data-aos="fade-up" data-aos-delay="450">
                                    <label className="block text-sm font-medium text-gray-600">Fecha completada:</label>
                                    <p className="text-sm text-gray-800">{asignacionDetalle.fecha_completada ? formatearFecha(asignacionDetalle.fecha_completada) : '—'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end" data-aos="fade-up" data-aos-delay="500">
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

export default AsignarCoevaluaciones;