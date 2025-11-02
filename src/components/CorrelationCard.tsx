import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CorrelationData } from "@/utils/portfolioAnalysis";

interface CorrelationCardProps {
  correlations: CorrelationData;
}

export function CorrelationCard({ correlations }: CorrelationCardProps) {
  const correlationGroups = [
    {
      region: "China Markets",
      items: [
        { name: "Shanghai Composite (SHA)", value: correlations.sha },
        { name: "Shenzhen Component (SHE)", value: correlations.she },
        { name: "CSI 300", value: correlations.csi300 },
      ]
    },
    {
      region: "US Markets",
      items: [
        { name: "S&P 500", value: correlations.sp500 },
        { name: "Nasdaq Composite", value: correlations.nasdaq },
      ]
    },
    {
      region: "International Markets",
      items: [
        { name: "FTSE 100 (UK)", value: correlations.ftse100 },
        { name: "Hang Seng (HK)", value: correlations.hangseng },
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correlation with Global Market Indices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {correlationGroups.map((group) => (
          <div key={group.region} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{group.region}</h3>
            {group.items.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm font-bold">{item.value.toFixed(3)}</span>
                </div>
                <Progress value={(item.value + 1) * 50} className="h-2" />
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
