import DocenteLayout from "../../layouts/DocenteLayout";
import EvaluacionesCoDocente from "../../components/docente/CoevaluacionesDocente";

const DashboardDocente = () => {
    return (
        <DocenteLayout>
            <EvaluacionesCoDocente />
        </DocenteLayout>
    );
};

export default DashboardDocente;
