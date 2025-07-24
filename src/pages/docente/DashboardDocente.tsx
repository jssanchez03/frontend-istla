import DocenteLayout from "../../layouts/DocenteLayout";
import AutoevaluacionCard from "../../components/docente/AutoevaluacionCard";
import CoevaluacionCard from "../../components/docente/CoevaluacionCard";

const DashboardDocente = () => {
  return (
    <DocenteLayout>
      <div className="grid gap-8 md:grid-cols-2">
        <AutoevaluacionCard />
        <CoevaluacionCard />
      </div>
    </DocenteLayout>
  );
};

export default DashboardDocente;
