import { useState, useEffect } from "react";
import { obtenerFormularios, obtenerPeriodos } from "../../../services/evaluacionesService";
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css"; // Importar los estilos de AOS
import { Plus, X, Edit2 } from "lucide-react";
import Select from 'react-select';

interface Periodo {
    id_periodo: number;
    descripcion: string;
}

interface Formulario {
    id_formulario: number;
    nombre: string;
    tipo?: string;
}

interface ModalEvaluacionProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        id_formulario: number;
        id_periodo: number;
        tipo: string;
    }) => void;
    initialData?: any;
    modoEdicion?: boolean;
}

const ModalEvaluacion = ({ isOpen, onClose, onSubmit, initialData, modoEdicion }: ModalEvaluacionProps) => {
    const [formData, setFormData] = useState({
        id_formulario: 0,
        id_periodo: 0,
        tipo: "",
    });

    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [formularios, setFormularios] = useState<Formulario[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Inicializar AOS
        AOS.init({
            duration: 500, // duración más breve para animaciones más sutiles
            easing: 'ease-out', // tipo de aceleración más suave
            offset: 40, // menor desplazamiento
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchPeriodos();
            fetchFormularios();
            if (initialData) {
                setFormData({
                    id_formulario: initialData.id_formulario || initialData.id || 0,
                    id_periodo: initialData.id_periodo || 0,
                    tipo: initialData.tipo || ""
                });
            } else {
                setFormData({ id_formulario: 0, id_periodo: 0, tipo: "" });
            }
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (formData.id_formulario > 0) {
            const seleccionado = formularios.find(f => f.id_formulario === formData.id_formulario);
            setFormData(prev => ({
                ...prev,
                tipo: seleccionado?.tipo || ""
            }));
        }
    }, [formData.id_formulario, formularios]);

    const fetchPeriodos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerPeriodos();
            setPeriodos(data);
        } catch (err) {
            const errorMessage = "No se pudieron cargar los periodos.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormularios = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerFormularios();
            setFormularios(data);
        } catch (err) {
            const errorMessage = "No se pudieron cargar los formularios.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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

    const handlePeriodoSelect = (option: { value: string; label: string | undefined } | null) => {
        setFormData(prev => ({
            ...prev,
            id_periodo: option && option.value ? Number(option.value) : 0
        }));
    };
    const handleFormularioSelect = (option: { value: string; label: string | undefined } | null) => {
        setFormData(prev => ({
            ...prev,
            id_formulario: option && option.value ? Number(option.value) : 0
        }));
    };

    const handleSubmit = () => {
        if (!formData.id_periodo || !formData.id_formulario) {
            toast.error("Por favor complete todos los campos obligatorios.");
            return;
        }

        const dataToSubmit = {
            id_formulario: formData.id_formulario,
            id_periodo: formData.id_periodo,
            tipo: formData.tipo,
        };

        try {
            onSubmit(dataToSubmit);
            setFormData({ id_formulario: 0, id_periodo: 0, tipo: "" });
            onClose();
        } catch (err) {
            toast.error("Error al crear la evaluación");
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                {/* Fondo oscuro con animación */}
                <div
                    className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm"
                    aria-hidden="true"
                    data-aos="fade"
                    data-aos-duration="200"
                />

                {/* Contenido del modal con animación */}
                <div
                    className="bg-white rounded-lg max-w-md mx-auto p-6 z-50 shadow-lg w-full"
                    data-aos="fade-up"
                    data-aos-duration="350"
                >
                    {/* Encabezado con icono y botón cerrar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#189cbf]/10 rounded-lg">
                                {modoEdicion ? <Edit2 className="w-6 h-6 text-[#189cbf]" /> : <Plus className="w-6 h-6 text-[#189cbf]" />}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">
                                {modoEdicion ? "Editar Evaluación" : "Crear Evaluación"}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Cerrar"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {error && (
                        <div
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                            data-aos="fade-up"
                            data-aos-delay="80"
                        >
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div
                            data-aos="fade-up"
                            data-aos-delay="100"
                        >
                            <label className="block text-sm font-medium text-gray-700">Periodo</label>
                            <Select
                                value={periodos.find(p => p.id_periodo === formData.id_periodo)
                                    ? { value: formData.id_periodo.toString(), label: periodos.find(p => p.id_periodo === formData.id_periodo)?.descripcion }
                                    : null}
                                onChange={handlePeriodoSelect}
                                options={periodos.map(p => ({ value: p.id_periodo.toString(), label: p.descripcion }))}
                                styles={customStyles}
                                isSearchable={false}
                                menuPortalTarget={document.body}
                                isDisabled={loading}
                                placeholder="Seleccione un periodo"
                            />
                        </div>

                        <div
                            data-aos="fade-up"
                            data-aos-delay="150"
                        >
                            <label className="block text-sm font-medium text-gray-700">Formulario</label>
                            <Select
                                value={formularios.find(f => f.id_formulario === formData.id_formulario)
                                    ? { value: formData.id_formulario.toString(), label: formularios.find(f => f.id_formulario === formData.id_formulario)?.nombre }
                                    : null}
                                onChange={handleFormularioSelect}
                                options={formularios.map(f => ({ value: f.id_formulario.toString(), label: f.nombre }))}
                                styles={customStyles}
                                isSearchable={false}
                                menuPortalTarget={document.body}
                                isDisabled={loading}
                                placeholder="Seleccione un formulario"
                            />
                        </div>
                    </div>

                    <div
                        className="flex justify-end space-x-2 mt-6"
                        data-aos="fade-up"
                        data-aos-delay="200"
                    >
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm transition"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 rounded-md bg-[#189cbf] hover:bg-sky-600 text-white text-sm transition"
                            disabled={loading}
                        >
                            {loading ? "Cargando..." : modoEdicion ? "Guardar Cambios" : "Crear Evaluación"}
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ModalEvaluacion;