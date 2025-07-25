import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Edit,
    Trash2,
    Save,
    ChevronUp,
    ChevronDown,
    Loader2,
    UserCheck,
    FileSignature,
    User,
    PenTool,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react';
import reporteCoevaluacionService, { AutoridadFirma } from '../../../services/reporteCoevaluacionService';
import { toast, Toaster } from "react-hot-toast";

interface ModalConfiguracionFirmasProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
    maxAutoridades?: number; // Nuevo: máximo de autoridades permitidas
    autoridadesExternas?: any[]; // Nuevo: autoridades a mostrar (opcional)
}

const ModalConfiguracionFirmas: React.FC<ModalConfiguracionFirmasProps> = ({
    isOpen,
    onClose,
    onSuccess,
    onError,
    maxAutoridades = 2, // Default: 2 (para coevaluaciones)
    autoridadesExternas
}) => {
    const [autoridadesFirmas, setAutoridadesFirmas] = useState<any[]>([]);
    const [cargandoAutoridades, setCargandoAutoridades] = useState(false);
    const [editandoAutoridad, setEditandoAutoridad] = useState<AutoridadFirma | null>(null);
    const [nuevaAutoridad, setNuevaAutoridad] = useState({
        nombre_autoridad: '',
        cargo_autoridad: '',
        orden_firma: 1
    });

    // Estados para alertas internas del modal
    const [modalError, setModalError] = useState<string>('');
    const [modalSuccess, setModalSuccess] = useState<string>('');
    const [error, setError] = useState<string>("");

    // Cargar autoridades cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            if (autoridadesExternas) {
                setAutoridadesFirmas(autoridadesExternas);
            } else {
                cargarAutoridadesFirmas();
            }
            // Limpiar alertas internas al abrir
            setModalError('');
            setModalSuccess('');
            setError("");
        }
    }, [isOpen, autoridadesExternas]);

    // Limpiar alertas internas después de un tiempo
    useEffect(() => {
        if (modalError || modalSuccess) {
            const timer = setTimeout(() => {
                setModalError('');
                setModalSuccess('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [modalError, modalSuccess]);

    const cargarAutoridadesFirmas = async () => {
        setCargandoAutoridades(true);
        try {
            const autoridades = await reporteCoevaluacionService.obtenerAutoridadesParaFirmas();
            setAutoridadesFirmas(autoridades.sort((a, b) => a.orden_firma - b.orden_firma));
        } catch (err) {
            console.error('Error al cargar autoridades:', err);
            setModalError('Error al cargar autoridades para firmas');
        } finally {
            setCargandoAutoridades(false);
        }
    };

    const handleCrearAutoridad = async () => {
        const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}$/.test(nuevaAutoridad.nombre_autoridad.trim());
        const cargoValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}$/.test(nuevaAutoridad.cargo_autoridad.trim());
        if (!nuevaAutoridad.nombre_autoridad.trim() || !nuevaAutoridad.cargo_autoridad.trim()) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        if (!nombreValido) {
            setError("El nombre solo puede contener letras, espacios, puntos y comas (mínimo 3, máximo 50 caracteres).");
            return;
        }
        if (!cargoValido) {
            setError("El cargo solo puede contener letras, espacios, puntos y comas (mínimo 3, máximo 50 caracteres).");
            return;
        }
        setError("");

        // Validar límite de autoridades
        if (autoridadesFirmas.length >= maxAutoridades) {
            setModalError(`Solo se pueden configurar un máximo de ${maxAutoridades} autoridad${maxAutoridades > 1 ? 'es' : ''} para firmas`);
            return;
        }

        try {
            const datosAutoridad = {
                nombre_autoridad: nuevaAutoridad.nombre_autoridad.trim(),
                cargo_autoridad: nuevaAutoridad.cargo_autoridad.trim(),
                orden_firma: nuevaAutoridad.orden_firma || 1,
            };

            // Crear la autoridad
            await reporteCoevaluacionService.crearAutoridadFirma(datosAutoridad);

            // ✅ SOLUCIÓN: Recargar todas las autoridades desde el backend
            await cargarAutoridadesFirmas();

            // Reiniciar el formulario
            setNuevaAutoridad({
                nombre_autoridad: '',
                cargo_autoridad: '',
                orden_firma: Math.max(...autoridadesFirmas.map(a => a.orden_firma), 0) + 1,
            });

            setModalSuccess('Autoridad creada exitosamente');
            onSuccess('Autoridad creada exitosamente');

        } catch (err) {
            console.error('Error al crear autoridad:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error al crear autoridad';
            setModalError(errorMessage);
            onError(errorMessage);
        }
    };

    const handleActualizarAutoridad = async () => {
        if (!editandoAutoridad) return;

        const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}$/.test(editandoAutoridad.nombre_autoridad);
        const cargoValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}$/.test(editandoAutoridad.cargo_autoridad);

        if (!editandoAutoridad.nombre_autoridad || !editandoAutoridad.cargo_autoridad) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        if (!nombreValido) {
            setError("El nombre solo puede contener letras, espacios, puntos y comas (mínimo 3, máximo 50 caracteres).");
            return;
        }
        if (!cargoValido) {
            setError("El cargo solo puede contener letras, espacios, puntos y comas (mínimo 3, máximo 50 caracteres).");
            return;
        }
        setError("");

        try {
            const autoridadActualizada = await reporteCoevaluacionService.actualizarAutoridadFirma(
                editandoAutoridad.id_autoridad,
                {
                    nombre_autoridad: editandoAutoridad.nombre_autoridad,
                    cargo_autoridad: editandoAutoridad.cargo_autoridad,
                    orden_firma: editandoAutoridad.orden_firma,
                }
            );

            setAutoridadesFirmas(prev =>
                prev.map(a =>
                    a.id_autoridad === autoridadActualizada.id_autoridad
                        ? autoridadActualizada
                        : a
                ).sort((a, b) => a.orden_firma - b.orden_firma)
            );

            setEditandoAutoridad(null);

            // ✅ Solo alerta interna del modal
            setModalSuccess('Autoridad actualizada exitosamente');
            // ✅ Llamar onSuccess para la alerta externa (opcional)
            onSuccess('Autoridad actualizada exitosamente');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al actualizar autoridad';

            // ✅ Solo alerta interna del modal para errores
            setModalError(errorMessage);
            // ✅ Llamar onError para la alerta externa
            onError(errorMessage);
        }
    };

    const handleEliminarAutoridad = async (id: number) => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-2" data-aos="fade-up" data-aos-duration="300">
                <div className="flex items-start gap-2">
                    <Trash2 className="text-red-500 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-gray-800">
                        ¿Estás seguro de que deseas eliminar esta autoridad?
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
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await reporteCoevaluacionService.eliminarAutoridadFirma(id);
                                setAutoridadesFirmas(prev => prev.filter(a => a.id_autoridad !== id));
                                setModalSuccess('Autoridad eliminada exitosamente');
                                onSuccess('Autoridad eliminada exitosamente');
                            } catch (err) {
                                const errorMessage = err instanceof Error ? err.message : 'Error al eliminar autoridad';
                                setModalError(errorMessage);
                                onError(errorMessage);
                            }
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

    // Reemplazar la función cambiarOrdenAutoridad existente
    const cambiarOrdenAutoridad = async (id: number, direccion: 'up' | 'down') => {
        const index = autoridadesFirmas.findIndex(a => a.id_autoridad === id);
        if (index === -1) return;

        const nuevasAutoridades = [...autoridadesFirmas];
        const autoridad = nuevasAutoridades[index];

        if (direccion === 'up' && index > 0) {
            const autoridadAnterior = nuevasAutoridades[index - 1];
            const tempOrden = autoridad.orden_firma;
            autoridad.orden_firma = autoridadAnterior.orden_firma;
            autoridadAnterior.orden_firma = tempOrden;
        } else if (direccion === 'down' && index < nuevasAutoridades.length - 1) {
            const autoridadSiguiente = nuevasAutoridades[index + 1];
            const tempOrden = autoridad.orden_firma;
            autoridad.orden_firma = autoridadSiguiente.orden_firma;
            autoridadSiguiente.orden_firma = tempOrden;
        } else {
            return; // No hay cambios que hacer
        }

        // Actualizar el estado local inmediatamente
        setAutoridadesFirmas(nuevasAutoridades.sort((a, b) => a.orden_firma - b.orden_firma));

        try {
            // Persistir los cambios en el backend
            const actualizaciones = nuevasAutoridades.map(a => ({
                id_autoridad: a.id_autoridad,
                orden_firma: a.orden_firma
            }));

            await reporteCoevaluacionService.actualizarOrdenesAutoridadesFirmas(actualizaciones);

            setModalSuccess('Orden actualizado exitosamente');

        } catch (error) {
            console.error('Error al actualizar orden:', error);

            // Revertir cambios si hay error
            await cargarAutoridadesFirmas();

            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar orden';
            setModalError(errorMessage);
            onError(errorMessage);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Toaster position="bottom-right" />
            <div className="bg-white w-full h-full max-w-full rounded-none sm:w-auto sm:h-auto sm:max-w-2xl sm:rounded-lg p-0 shadow-xl max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col" data-aos="zoom-in" data-aos-duration="500">

                {/* Header */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-[#e6f6fb] rounded-lg">
                                <PenTool className="h-5 w-5 text-[#189cbf]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Configuración de Firmas</h2>
                                <p className="text-sm text-gray-600">Administra las autoridades que firmarán los reportes</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-[#e6f6fb] rounded-lg transition-colors fixed top-2 right-2 sm:static sm:top-auto sm:right-auto z-20 bg-white sm:bg-transparent"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 max-h-[calc(100vh-60px)] sm:max-h-[calc(90vh-120px)]">

                    {/* Alertas internas del modal */}
                    {modalError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md" data-aos="fade-up">
                            <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                                <p className="text-sm text-red-800">{modalError}</p>
                            </div>
                        </div>
                    )}

                    {modalSuccess && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md" data-aos="fade-up">
                            <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                <p className="text-sm text-green-800">{modalSuccess}</p>
                            </div>
                        </div>
                    )}

                    {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}

                    {/* Formulario nueva autoridad */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6" data-aos="fade-up" data-aos-delay="100">
                        <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                            <Plus className="h-4 w-4 mr-2 text-[#189cbf]" />
                            Nueva Autoridad
                        </h3>

                        {/* Advertencia si ya hay maxAutoridades */}
                        {autoridadesFirmas.length >= maxAutoridades && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-center">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                                    <p className="text-sm text-yellow-800">
                                        Ya tienes el máximo de {maxAutoridades} autoridad{maxAutoridades > 1 ? 'es' : ''} configurada{maxAutoridades > 1 ? 's' : ''}. Elimina una para agregar otra.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    value={nuevaAutoridad.nombre_autoridad}
                                    onChange={(e) => { setNuevaAutoridad(prev => ({ ...prev, nombre_autoridad: e.target.value })); setError(""); }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf]"
                                    placeholder="Ej: Mg. Juan Pérez"
                                    minLength={3}
                                    maxLength={50}
                                    required
                                    pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}"
                                    disabled={autoridadesFirmas.length >= maxAutoridades}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cargo *
                                </label>
                                <input
                                    type="text"
                                    value={nuevaAutoridad.cargo_autoridad}
                                    onChange={(e) => { setNuevaAutoridad(prev => ({ ...prev, cargo_autoridad: e.target.value })); setError(""); }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf]"
                                    placeholder="Ej: COORDINADOR"
                                    minLength={3}
                                    maxLength={50}
                                    required
                                    pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}"
                                    disabled={autoridadesFirmas.length >= maxAutoridades}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Orden de Firma
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={nuevaAutoridad.orden_firma}
                                    onChange={(e) => setNuevaAutoridad(prev => ({ ...prev, orden_firma: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#189cbf] focus:border-[#189cbf]"
                                    disabled={autoridadesFirmas.length >= maxAutoridades}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleCrearAutoridad}
                                    disabled={autoridadesFirmas.length >= maxAutoridades}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-[#189cbf] text-white rounded-md hover:bg-[#147a99] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de autoridades */}
                    <div className="space-y-4" data-aos="fade-up" data-aos-delay="200">
                        <h3 className="text-md font-medium text-gray-900 flex items-center">
                            <FileSignature className="h-4 w-4 mr-2 text-gray-600" />
                            {maxAutoridades === 1 ? 'Autoridad Configurada' : `Autoridades Configuradas (${autoridadesFirmas.length}/${maxAutoridades})`}
                        </h3>

                        {cargandoAutoridades ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-[#189cbf]" />
                            </div>
                        ) : autoridadesFirmas.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-600">No hay autoridades configuradas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {autoridadesFirmas.map((autoridad, index) => (
                                    <div
                                        key={autoridad.id_autoridad}
                                        className={`rounded-lg border p-4 transition-all ${editandoAutoridad?.id_autoridad === autoridad.id_autoridad
                                            ? 'border-[#189cbf] bg-[#e6f6fb]'
                                            : 'border-gray-200 bg-white hover:border-[#189cbf]'}
                                        `}
                                    >
                                        {editandoAutoridad?.id_autoridad === autoridad.id_autoridad ? (
                                            // Modo edición
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <input
                                                        type="text"
                                                        value={editandoAutoridad?.nombre_autoridad ?? ''}
                                                        onChange={(e) => {
                                                            setEditandoAutoridad(prev => prev ? { ...prev, nombre_autoridad: e.target.value } : null);
                                                            setError("");
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#189cbf]"
                                                        placeholder="Nombre completo"
                                                        minLength={3}
                                                        maxLength={50}
                                                        required
                                                        pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editandoAutoridad?.cargo_autoridad ?? ''}
                                                        onChange={(e) => {
                                                            setEditandoAutoridad(prev => prev ? { ...prev, cargo_autoridad: e.target.value } : null);
                                                            setError("");
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#189cbf]"
                                                        placeholder="Cargo"
                                                        minLength={3}
                                                        maxLength={50}
                                                        required
                                                        pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ .,;]{3,50}"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={editandoAutoridad?.orden_firma ?? 1}
                                                        onChange={(e) => setEditandoAutoridad(prev =>
                                                            prev ? { ...prev, orden_firma: parseInt(e.target.value) || 1 } : null
                                                        )}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#189cbf]"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={handleActualizarAutoridad}
                                                            className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm transition-colors"
                                                        >
                                                            <Save className="h-4 w-4 mr-1" />
                                                            Guardar
                                                        </button>
                                                        <button
                                                            onClick={() => setEditandoAutoridad(null)}
                                                            className="flex items-center px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm transition-colors"
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Modo vista
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex flex-col">
                                                        <button
                                                            onClick={() => cambiarOrdenAutoridad(autoridad.id_autoridad, 'up')}
                                                            disabled={index === 0}
                                                            className="p-1 text-gray-400 hover:text-[#189cbf] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <ChevronUp className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => cambiarOrdenAutoridad(autoridad.id_autoridad, 'down')}
                                                            disabled={index === autoridadesFirmas.length - 1}
                                                            className="p-1 text-gray-400 hover:text-[#189cbf] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-center w-8 h-8 bg-[#e6f6fb] text-[#189cbf] rounded-lg font-semibold text-sm">
                                                        {autoridad.orden_firma}
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{autoridad.nombre_autoridad}</p>
                                                            <p className="text-sm text-gray-600">{autoridad.cargo_autoridad}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => setEditandoAutoridad(autoridad)}
                                                        className="p-2 text-[#189cbf] hover:text-[#147a99] hover:bg-[#e6f6fb] rounded-lg transition-colors"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminarAutoridad(autoridad.id_autoridad)}
                                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mensaje informativo */}
                    <div className="mt-6 p-4 bg-[#e6f6fb] border border-[#189cbf] rounded-md flex items-start gap-3">
                        <Info className="h-5 w-5 text-[#189cbf] mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-[#147a99] mb-1">Información importante</h4>
                            {maxAutoridades === 1 ? (
                                <p className="text-[#147a99] text-sm">
                                    Solo la autoridad configurada aquí aparecerá como firma en los reportes PDF y Excel generados por el perfil administrador. Si hay más autoridades en la lista, solo se mostrará al(la) Vicerrector(a) en los reportes. Puedes modificar el nombre o cargo en cualquier momento.
                                </p>
                            ) : (
                                <p className="text-[#147a99] text-sm">
                                    Las autoridades configuradas aparecerán en los reportes PDF y Excel generados para las firmas correspondientes. Puedes modificar o eliminar estas autoridades en cualquier momento desde esta sección.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50" data-aos="fade-up" data-aos-delay="400">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalConfiguracionFirmas;