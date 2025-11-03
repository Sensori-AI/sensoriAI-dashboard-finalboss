import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
}

const mockRecommendations: Recommendation[] = [
  {
    id: "1",
    title: "Controle de Plantas Daninhas Urgente",
    description: "Foi detectada uma infestação de 15.8% de plantas daninhas na área nordeste. Recomenda-se aplicação localizada de herbicida nas zonas marcadas em vermelho no mapa.",
    priority: "high",
    category: "Plantas Daninhas",
  },
  {
    id: "2",
    title: "Replantio em Áreas de Falha",
    description: "Identificadas falhas de plantio em 8.3% da área total. As zonas georreferenciadas devem ser replantadas para maximizar a produtividade.",
    priority: "medium",
    category: "Falhas de Plantio",
  },
  {
    id: "3",
    title: "Aplicação de Fertilizante em Zonas de Baixo Vigor",
    description: "23.4% da área apresenta vigor baixo a médio. Recomenda-se análise de solo e aplicação variada de fertilizantes nas zonas identificadas.",
    priority: "medium",
    category: "Vigor",
  },
];

export const RecommendationsPanel = () => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "medium":
        return <Info className="h-4 w-4 text-warning" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Recomendações e Observações</CardTitle>
        <CardDescription>
          Análises e sugestões baseadas nos dados coletados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockRecommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getPriorityIcon(rec.priority)}</div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{rec.title}</h4>
                  <Badge variant={getPriorityColor(rec.priority) as any}>
                    {rec.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
