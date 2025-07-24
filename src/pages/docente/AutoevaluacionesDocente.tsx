import DocenteLayout from "../../layouts/DocenteLayout";
import EvaluacionesAutoDocente from "../../components/docente/AutoevaluacionesDocente";

const DashboardDocente = () => {
    return (
        <DocenteLayout>
            <EvaluacionesAutoDocente />
        </DocenteLayout>
    );
};

export default DashboardDocente;
