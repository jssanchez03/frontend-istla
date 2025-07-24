import { useNavigate } from "react-router-dom";
import { UserCheck } from "lucide-react";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const AutoevaluacionCard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        AOS.refresh();
    }, []);

    const handleClick = () => {
        navigate("/docente/autoevaluacion");
    };

    return (
        <div
            className="bg-white shadow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="bg-[#e0f5fa] p-4 rounded-full w-16 h-16 flex items-center justify-center">
                        <UserCheck className="w-8 h-8" style={{ color: "#189cbf" }} />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-800">Autoevaluación</h2>
                        <p className="text-sm text-gray-500 mt-1">Evaluación realizada por el docente sobre su propio desempeño</p>

                        <div className="mt-4">
                            <p className="text-sm text-gray-700">
                                Complete el formulario de autoevaluación para reflexionar sobre su práctica docente.
                            </p>

                            <button
                                onClick={handleClick}
                                className="mt-4 bg-[#189cbf] hover:bg-[#157a99] text-white text-sm px-6 py-2 rounded-md transition-colors"
                            >
                                Acceder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoevaluacionCard;
