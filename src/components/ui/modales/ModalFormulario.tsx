import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import AOS from "aos";
import "aos/dist/aos.css"; // Importar los estilos de AOS
import { Plus, Edit2, X } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { nombre: string }) => void;
    initialData?: { nombre: string };
}

const ModalFormulario = ({ isOpen, onClose, onSubmit, initialData }: Props) => {
    const [nombre, setNombre] = useState("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        // Inicializar AOS
        AOS.init({
            duration: 500, // duración más breve para animaciones más sutiles
            easing: 'ease-out', // tipo de aceleración más suave
            offset: 40, // menor desplazamiento
        });
    }, []);

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre);
        } else {
            setNombre("");
        }
    }, [initialData, isOpen]);

    const handleSubmit = () => {
        const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,100}$/.test(nombre.trim());
        if (!nombre.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        if (!nombreValido) {
            setError("El nombre solo puede contener letras y espacios (mínimo 3, máximo 50 caracteres).");
            return;
        }
        setError("");
        onSubmit({ nombre: nombre.trim() });
        onClose();
    };

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
                                {initialData ? (
                                    <Edit2 className="w-6 h-6 text-[#189cbf]" />
                                ) : (
                                    <Plus className="w-6 h-6 text-[#189cbf]" />
                                )}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">
                                {initialData ? "Editar Formulario" : "Nuevo Formulario"}
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

                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => { setNombre(e.target.value); setError(""); }}
                        placeholder="Nombre del formulario"
                        className="w-full border px-3 py-2 rounded-md mb-2"
                        data-aos="fade-up"
                        data-aos-delay="100"
                        minLength={3}
                        maxLength={100}
                        required
                        pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,100}"
                    />
                    {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}

                    <div
                        className="flex justify-end gap-2"
                        data-aos="fade-up"
                        data-aos-delay="150"
                    >
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
                            data-aos="fade-up"
                            data-aos-delay="180"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm bg-[#189cbf] text-white rounded hover:bg-sky-600 transition"
                            data-aos="fade-up"
                            data-aos-delay="200"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ModalFormulario;