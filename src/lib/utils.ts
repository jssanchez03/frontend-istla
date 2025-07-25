import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Capitaliza nombres completos correctamente con tildes: "gomez villar eiter" => "Gomez Villar Eiter"
export function capitalizarNombreCompleto(nombre: string) {
  return nombre
    .toLowerCase()
    .replace(/([a-záéíóúüñ])([a-záéíóúüñ]*)/gi, (_match, p1, p2) => p1.toLocaleUpperCase('es-EC') + p2);
}
