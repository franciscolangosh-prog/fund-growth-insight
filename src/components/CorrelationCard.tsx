import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CorrelationData } from "@/utils/portfolioAnalysis";

interface CorrelationCardProps {
  correlations: CorrelationData;
}

export function CorrelationCard({ correlations }: CorrelationCardProps) {
  const correlationItems = [
    { name: "Shanghai Composite (SHA)", value: correlations.sha },
    { name: "Shenzhen Component (SHE)", value: correlations.she },
    { name: "CSI 300", value: correlations.csi300 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correlation with Market Indices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {correlationItems.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm font-bold">{item.value.toFixed(3)}</span>
            </div>
            <Progress value={(item.value + 1) * 50} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
