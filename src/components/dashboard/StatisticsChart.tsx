import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
}

interface StatisticsChartProps {
  data: ChartDataPoint[];
  title: string;
}

export const StatisticsChart = ({ data, title }: StatisticsChartProps) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.percentage)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{item.name}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{item.value.toFixed(1)} ha</span>
                  <span>{item.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
                <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all" 
                    style={{ width: `${(item.percentage / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-4 pt-2 border-t text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-muted-foreground">Área (ha)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-secondary" />
              <span className="text-muted-foreground">Porcentagem (%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
