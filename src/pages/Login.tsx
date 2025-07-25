import { useState, FormEvent, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import AOS from "aos";
import "aos/dist/aos.css";
import logoISTLA from "../assets/logo_istla.jpg";

interface DecodedToken {
    id: number;
    correo: string;
    cedula: string;
    rol: number;
}

function Login() {
    const [correo, setCorreo] = useState<string>("");
    const [cedula, setCedula] = useState<string>("");
    const [error, setError] = useState<string>("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const iniciarSesion = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:3000/api/v1/login", {
                correo,
                cedula,
            });

            const token = res.data.token;
            login(token); // guarda en contexto
            const decoded = jwtDecode<DecodedToken>(token);

            // Redirige según rol
            switch (decoded.rol) {
                case 13:
                case 15:
                    navigate("/docente");
                    break;
                case 1:
                case 17:
                    navigate("/coordinador");
                    break;
                case 12:
                case 18:
                    navigate("/admin");
                    break;
                case 14:
                    navigate("/estudiante");
                    break;
                default:
                    navigate("/no-autorizado");
                    break;
            }
        } catch {
            setError("Credenciales inválidas o conexión fallida");
        }
    };

    useEffect(() => {
        AOS.init({ duration: 700, once: true, easing: "ease-out" });
    }, []);

    return (
        <div className="relative min-h-screen flex items-center justify-center px-2 sm:px-4 bg-gray-500 overflow-hidden">
            {/* Imagen de fondo desenfocada */}
            <img
                src="https://lh3.googleusercontent.com/p/AF1QipMCbidIFZUrlTMtljgp1qztn7bcfbQgaWPyQFyt=s680-w680-h510-rw"
                alt="Fondo desenfocado"
                className="absolute inset-0 w-full h-full object-cover blur-sm brightness-75 z-0"
            />

            {/* Capa de contenido del login */}
            <div className="relative w-full max-w-xs sm:max-w-sm z-10" data-aos="zoom-in">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-sky-500 rounded-2xl sm:rounded-3xl shadow-lg transform -rotate-6" />
                <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8" data-aos="fade-up" data-aos-delay="200">
                    <div className="text-center mb-8 sm:mb-10" data-aos="fade-down" data-aos-delay="300">
                        <img
                            src={logoISTLA}
                            alt="ISTLA Logo"
                            className="mx-auto w-60 sm:w-70 object-contain transition-transform duration-300 hover:scale-110"
                        />
                    </div>

                    <form onSubmit={iniciarSesion} className="space-y-4 sm:space-y-5" data-aos="fade-up" data-aos-delay="400">
                        <div className="relative mx-auto max-w-xs">
                            <input
                                type="email"
                                id="correo"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                className="peer placeholder-transparent w-full border-b-2 border-gray-300 text-gray-900 h-10 focus:outline-none focus:border-cyan-600 text-sm sm:text-base"
                                placeholder="Correo electrónico"
                                required
                            />
                            <label
                                htmlFor="correo"
                                className="absolute left-0 -top-3.5 text-gray-600 text-xs sm:text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all peer-focus:-top-3.5 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-gray-600"
                            >
                                Correo electrónico
                            </label>
                        </div>

                        <div className="relative mx-auto max-w-xs">
                            <input
                                type="password"
                                id="cedula"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                className="peer placeholder-transparent w-full border-b-2 border-gray-300 text-gray-900 h-10 focus:outline-none focus:border-cyan-600 text-sm sm:text-base"
                                placeholder="Contraseña"
                                required
                            />
                            <label
                                htmlFor="cedula"
                                className="absolute left-0 -top-3.5 text-gray-600 text-xs sm:text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all peer-focus:-top-3.5 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-gray-600"
                            >
                                Contraseña
                            </label>
                        </div>

                        <div className="mx-auto max-w-xs">
                            <button
                                type="submit"
                                className="bg-cyan-500 text-white rounded-md px-4 py-2 w-full hover:bg-cyan-600 transition-all text-sm sm:text-base"
                            >
                                Iniciar Sesión
                            </button>
                        </div>

                        {error && <p className="text-red-500 text-center text-xs sm:text-sm max-w-xs mx-auto">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;