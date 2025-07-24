import EstudianteLayout from "../../layouts/EstudianteLayout";
import EvaluacionesLista from "../../components/estudiante/HeteroevaluacionesEstudiante";

const DashboardEstudiante = () => {
  return (
    <EstudianteLayout>
      <EvaluacionesLista />
    </EstudianteLayout>
  );
};

export default DashboardEstudiante;
