import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MapVisualization } from "@/components/dashboard/MapVisualization";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { FarmInfoHeader } from "@/components/dashboard/FarmInfoHeader";
import { Sprout, AlertTriangle, Activity, MapPin } from "lucide-react";

const Index = () => {
  // Dados mock
  const farmInfo = {
    consultant: "Dr. Carlos Silva",
    crop: "Soja",
    season: "2024/2025",
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Análise</h1>
          <p className="text-muted-foreground">
            Visão geral das análises da lavoura
          </p>
        </div>

        {/* Farm Info */}
        <FarmInfoHeader info={farmInfo} />

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Área Total Mapeada"
            value="245.3 ha"
            subtitle="100% da propriedade"
            icon={MapPin}
            variant="success"
          />
          <MetricCard
            title="Plantas Daninhas"
            value="15.8%"
            subtitle="38.7 ha infestados"
            icon={Sprout}
            variant="warning"
            trend={{ value: "2.3% vs. mês anterior", isPositive: false }}
          />
          <MetricCard
            title="Falhas de Plantio"
            value="8.3%"
            subtitle="20.4 ha com falhas"
            icon={AlertTriangle}
            variant="danger"
          />
          <MetricCard
            title="Vigor Médio"
            value="72%"
            subtitle="Alto: 45% | Médio: 31% | Baixo: 24%"
            icon={Activity}
            variant="success"
            trend={{ value: "5% vs. semana anterior", isPositive: true }}
          />
        </div>

        {/* Map Visualization */}
        <MapVisualization />

        {/* Recommendations */}
        <RecommendationsPanel />
      </div>
    </DashboardLayout>
  );
};

export default Index;
