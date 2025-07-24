import React, { useState } from 'react';
import { X, FileText, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalConfiguracionOficioProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (numeroInicio: number) => void;
}

const ModalConfiguracionOficio: React.FC<ModalConfiguracionOficioProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    const [numeroInicio, setNumeroInicio] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleConfirm = () => {
        const numero = parseInt(numeroInicio);
        if (isNaN(numero) || numero < 1) {
            setError('Por favor ingrese un número válido mayor a 0');
            return;
        }
        onConfirm(numero);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm"
                aria-hidden="true"
                data-aos="fade"
                data-aos-duration="200"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-xl shadow-xl max-w-md w-full"
                data-aos="zoom-in"
                data-aos-duration="300"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Configuración de Número de Oficio</h2>
                                <p className="text-sm text-gray-600">Establece el número inicial para los oficios</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Info box */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p>El número que ingreses será el punto de partida para la numeración de oficios.</p>
                            <p className="mt-1">Por ejemplo, si ingresas el número 5:</p>
                            <ul className="list-disc list-inside mt-1 ml-2">
                                <li>Primer docente: Oficio N° 5</li>
                                <li>Segundo docente: Oficio N° 6</li>
                                <li>Y así sucesivamente...</li>
                            </ul>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-800">{error}</span>
                        </div>
                    )}

                    {/* Input field */}
                    <div className="mb-6">
                        <label htmlFor="numeroInicio" className="block text-sm font-medium text-gray-700 mb-2">
                            Número Inicial del Oficio
                        </label>
                        <input
                            type="number"
                            id="numeroInicio"
                            value={numeroInicio}
                            onChange={(e) => {
                                setNumeroInicio(e.target.value);
                                setError('');
                            }}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#189cbf] focus:border-[#189cbf] text-gray-900"
                            placeholder="Ingrese el número inicial"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#189cbf]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#189cbf] border border-transparent rounded-md hover:bg-[#147a99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#189cbf]"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModalConfiguracionOficio; 