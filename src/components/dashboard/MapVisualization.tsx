import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const MapVisualization = () => {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Visualização Georreferenciada</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weeds" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weeds">Plantas Daninhas</TabsTrigger>
            <TabsTrigger value="failures">Falhas de Plantio</TabsTrigger>
            <TabsTrigger value="vigor">Mapa de Vigor</TabsTrigger>
          </TabsList>

          <TabsContent value="weeds" className="mt-4">
            <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Mapa de Plantas Daninhas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visualização georreferenciada com pontos de infestação
                  </p>
                </div>
              </div>
              {/* Map component will be integrated here */}
            </div>
          </TabsContent>

          <TabsContent value="failures" className="mt-4">
            <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Mapa de Falhas de Plantio
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Áreas identificadas com falhas georreferenciadas
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vigor" className="mt-4">
            <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Mapa de Vigor da Cultura
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Análise de vigor: alto, médio e baixo
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
