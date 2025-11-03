import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectorList, Sector } from "./SectorList";
import { toast } from "sonner";

// Mock data para setores
const mockWeedSectors: Sector[] = [
  { id: "w1", name: "Setor A-1", area: 12.5, infestationLevel: "high", percentage: 32.5, coordinates: { lat: -23.5505, lng: -46.6333 } },
  { id: "w2", name: "Setor A-2", area: 8.3, infestationLevel: "medium", percentage: 18.2, coordinates: { lat: -23.5515, lng: -46.6343 } },
  { id: "w3", name: "Setor B-1", area: 15.7, infestationLevel: "high", percentage: 28.9, coordinates: { lat: -23.5525, lng: -46.6353 } },
  { id: "w4", name: "Setor B-2", area: 6.2, infestationLevel: "low", percentage: 12.1, coordinates: { lat: -23.5535, lng: -46.6363 } },
  { id: "w5", name: "Setor C-1", area: 9.8, infestationLevel: "medium", percentage: 22.3, coordinates: { lat: -23.5545, lng: -46.6373 } },
  { id: "w6", name: "Setor C-2", area: 11.2, infestationLevel: "high", percentage: 35.7, coordinates: { lat: -23.5555, lng: -46.6383 } },
];

const mockFailureSectors: Sector[] = [
  { id: "f1", name: "Setor D-1", area: 5.2, infestationLevel: "medium", percentage: 15.3, coordinates: { lat: -23.5505, lng: -46.6333 } },
  { id: "f2", name: "Setor D-2", area: 7.8, infestationLevel: "high", percentage: 24.8, coordinates: { lat: -23.5515, lng: -46.6343 } },
  { id: "f3", name: "Setor E-1", area: 4.5, infestationLevel: "low", percentage: 9.2, coordinates: { lat: -23.5525, lng: -46.6353 } },
  { id: "f4", name: "Setor E-2", area: 6.9, infestationLevel: "medium", percentage: 18.7, coordinates: { lat: -23.5535, lng: -46.6363 } },
];

const mockVigorSectors: Sector[] = [
  { id: "v1", name: "Setor F-1", area: 18.3, infestationLevel: "high", percentage: 82.5, coordinates: { lat: -23.5505, lng: -46.6333 } },
  { id: "v2", name: "Setor F-2", area: 14.7, infestationLevel: "medium", percentage: 65.3, coordinates: { lat: -23.5515, lng: -46.6343 } },
  { id: "v3", name: "Setor G-1", area: 9.2, infestationLevel: "low", percentage: 42.8, coordinates: { lat: -23.5525, lng: -46.6353 } },
  { id: "v4", name: "Setor G-2", area: 16.5, infestationLevel: "high", percentage: 78.9, coordinates: { lat: -23.5535, lng: -46.6363 } },
  { id: "v5", name: "Setor H-1", area: 12.1, infestationLevel: "medium", percentage: 58.4, coordinates: { lat: -23.5545, lng: -46.6373 } },
];

export const MapVisualization = () => {
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [activeTab, setActiveTab] = useState("weeds");

  const handleSectorClick = (sector: Sector) => {
    setSelectedSector(sector);
    toast.success(`Focando no ${sector.name}`, {
      description: `Área: ${sector.area.toFixed(2)} ha | Nível: ${sector.infestationLevel}`,
    });
  };

  const getSectorsForTab = () => {
    switch (activeTab) {
      case "weeds":
        return mockWeedSectors;
      case "failures":
        return mockFailureSectors;
      case "vigor":
        return mockVigorSectors;
      default:
        return [];
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Visualização Georreferenciada</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weeds" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weeds">Plantas Daninhas</TabsTrigger>
            <TabsTrigger value="failures">Falhas de Plantio</TabsTrigger>
            <TabsTrigger value="vigor">Mapa de Vigor</TabsTrigger>
          </TabsList>

          <TabsContent value="weeds" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground font-semibold">
                        Mapa de Plantas Daninhas
                      </p>
                      {selectedSector && (
                        <div className="mt-4 p-4 bg-card rounded-lg border border-primary">
                          <p className="text-xs text-primary font-semibold">
                            📍 Focado em: {selectedSector.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lat: {selectedSector.coordinates.lat.toFixed(4)}, Lng: {selectedSector.coordinates.lng.toFixed(4)}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Visualização georreferenciada com setores clicáveis
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <SectorList
                  sectors={mockWeedSectors}
                  onSectorClick={handleSectorClick}
                  selectedSectorId={selectedSector?.id}
                  type="weeds"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="failures" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground font-semibold">
                        Mapa de Falhas de Plantio
                      </p>
                      {selectedSector && (
                        <div className="mt-4 p-4 bg-card rounded-lg border border-primary">
                          <p className="text-xs text-primary font-semibold">
                            📍 Focado em: {selectedSector.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lat: {selectedSector.coordinates.lat.toFixed(4)}, Lng: {selectedSector.coordinates.lng.toFixed(4)}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Áreas identificadas com falhas georreferenciadas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <SectorList
                  sectors={mockFailureSectors}
                  onSectorClick={handleSectorClick}
                  selectedSectorId={selectedSector?.id}
                  type="failures"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vigor" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground font-semibold">
                        Mapa de Vigor da Cultura
                      </p>
                      {selectedSector && (
                        <div className="mt-4 p-4 bg-card rounded-lg border border-primary">
                          <p className="text-xs text-primary font-semibold">
                            📍 Focado em: {selectedSector.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lat: {selectedSector.coordinates.lat.toFixed(4)}, Lng: {selectedSector.coordinates.lng.toFixed(4)}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Análise de vigor: alto, médio e baixo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <SectorList
                  sectors={mockVigorSectors}
                  onSectorClick={handleSectorClick}
                  selectedSectorId={selectedSector?.id}
                  type="vigor"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
