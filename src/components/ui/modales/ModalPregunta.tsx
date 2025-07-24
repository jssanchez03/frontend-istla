import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import AOS from "aos";
import "aos/dist/aos.css"; // Importar los estilos de AOS
import { toast } from "react-hot-toast"; // Importar toast
import { Plus, Edit2, X } from "lucide-react";
import Select from 'react-select';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { texto: string; tipo_pregunta: string }) => void;
    initialData?: { texto: string; tipo_pregunta: string };
    idFormulario: number;
}

const ModalPregunta = ({ isOpen, onClose, onSubmit, initialData }: Props) => {
    const [texto, setTexto] = useState("");
    const [tipoPregunta, setTipoPregunta] = useState("actitudinal");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inicializar AOS
    useEffect(() => {
        AOS.init({
            duration: 500, // duración más breve para animaciones más sutiles
            easing: 'ease-out', // tipo de aceleración más suave
            offset: 40, // menor desplazamiento
        });
    }, []);

    // Reset form when modal opens/closes or when initialData changes
    useEffect(() => {
        if (initialData) {
            setTexto(initialData.texto);
            setTipoPregunta(initialData.tipo_pregunta);
        } else {
            setTexto("");
            setTipoPregunta("actitudinal");
        }
        // Reset submitting state when modal opens
        setIsSubmitting(false);
    }, [initialData, isOpen]);

    const handleSubmit = async () => {
        // Validar texto vacío
        if (!texto.trim()) {
            toast.error("El texto de la pregunta es obligatorio");
            return;
        }

        // Validar longitud mínima
        if (texto.trim().length < 10) {
            toast.error("La pregunta debe tener al menos 10 caracteres");
            return;
        }

        // Validar tipo de pregunta
        if (!tipoPregunta) {
            toast.error("Debe seleccionar un tipo de pregunta");
            return;
        }

        try {
            setIsSubmitting(true);

            // Llamar a la función onSubmit
            await onSubmit({ texto: texto.trim(), tipo_pregunta: tipoPregunta });

            // Cerrar el modal primero
            onClose();

            // Mostrar toast de éxito después de cerrar
            setTimeout(() => {
                toast.success(
                    initialData
                        ? "Pregunta actualizada exitosamente"
                        : "Pregunta creada exitosamente"
                );
            }, 100);

        } catch (error) {
            // Mostrar toast de error solo si hay un error real
            console.error("Error al guardar pregunta:", error);
            toast.error(
                initialData
                    ? "Error al actualizar la pregunta"
                    : "Error al crear la pregunta"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Verificar si hay cambios sin guardar
        const hasChanges = initialData
            ? (texto !== initialData.texto || tipoPregunta !== initialData.tipo_pregunta)
            : (texto.trim() !== "" || tipoPregunta !== "actitudinal");

        if (hasChanges && !isSubmitting) {
            toast("Tienes cambios sin guardar", {
                icon: "⚠️",
                duration: 3000,
            });
        }

        onClose();
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;

        // Validación en tiempo real para longitud máxima
        if (value.length > 500) {
            // Truncar el texto si excede el límite
            setTexto(value.substring(0, 500));
            toast("La pregunta no puede exceder los 500 caracteres", {
                icon: "⚠️",
                duration: 2000,
            });
        } else {
            setTexto(value);
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

    return (
        <Dialog open={isOpen} onClose={handleClose} className="fixed z-50 inset-0 overflow-y-auto">
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
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#189cbf]/10 rounded-lg">
                                {initialData ? (
                                    <Edit2 className="w-6 h-6 text-[#189cbf]" />
                                ) : (
                                    <Plus className="w-6 h-6 text-[#189cbf]" />
                                )}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">
                                {initialData ? "Editar Pregunta" : "Nueva Pregunta"}
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Cerrar"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="mb-3">
                        <textarea
                            value={texto}
                            onChange={handleTextareaChange}
                            placeholder="Texto de la pregunta"
                            className={`w-full border px-3 py-2 rounded-md resize-none h-32 transition-colors ${texto.trim() === "" && isSubmitting
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:border-blue-500"
                                }`}
                            maxLength={500}
                            data-aos="fade-up"
                            data-aos-delay="100"
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">
                                Mínimo 10 caracteres
                            </span>
                            <span className={`text-xs ${texto.length > 450 ? "text-red-500" : "text-gray-500"
                                }`}>
                                {texto.length}/500
                            </span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Pregunta
                        </label>
                        <Select
                            value={{ value: tipoPregunta, label: tipoPregunta.charAt(0).toUpperCase() + tipoPregunta.slice(1) }}
                            onChange={option => setTipoPregunta(option?.value || "actitudinal")}
                            options={[
                                { value: 'actitudinal', label: 'Actitudinal' },
                                { value: 'conceptual', label: 'Conceptual' },
                                { value: 'procedimental', label: 'Procedimental' },
                            ]}
                            styles={customStyles}
                            isSearchable={false}
                            menuPortalTarget={document.body}
                        />
                    </div>

                    <div
                        className="flex justify-end gap-2"
                        data-aos="fade-up"
                        data-aos-delay="200"
                    >
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                            disabled={isSubmitting}
                            data-aos="fade-up"
                            data-aos-delay="250"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 text-sm rounded transition-colors ${isSubmitting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-[#189cbf] hover:bg-sky-600"
                                } text-white`}
                            disabled={isSubmitting}
                            data-aos="fade-up"
                            data-aos-delay="300"
                        >
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ModalPregunta;