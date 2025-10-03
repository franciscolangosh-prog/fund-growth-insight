import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface InvestmentAnalysisProps {
  annualizedReturn: number;
  totalReturn: number;
  correlations: { sha: number; she: number; csi300: number };
}

export function InvestmentAnalysis({ annualizedReturn, totalReturn, correlations }: InvestmentAnalysisProps) {
  const avgCorrelation = (correlations.sha + correlations.she + correlations.csi300) / 3;
  
  const getRecommendation = () => {
    if (annualizedReturn > 15 && avgCorrelation > 0.7) {
      return {
        verdict: "Highly Recommended",
        color: "bg-green-600",
        icon: TrendingUp,
        description: "Strong performance with good market correlation. Suitable for long-term investment."
      };
    } else if (annualizedReturn > 8 && annualizedReturn <= 15) {
      return {
        verdict: "Moderately Recommended",
        color: "bg-blue-600",
        icon: AlertCircle,
        description: "Decent returns with moderate risk. Consider as part of diversified portfolio."
      };
    } else {
      return {
        verdict: "Not Recommended",
        color: "bg-red-600",
        icon: TrendingDown,
        description: "Below-average performance. Consider alternative investment options."
      };
    }
  };

  const recommendation = getRecommendation();
  const Icon = recommendation.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Long-term Investment Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge className={recommendation.color}>
            <Icon className="h-4 w-4 mr-1" />
            {recommendation.verdict}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">{recommendation.description}</p>
        
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-semibold text-sm">Key Metrics:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Annualized Return: <span className="font-semibold text-foreground">{annualizedReturn.toFixed(2)}%</span></li>
            <li>• Total Return: <span className="font-semibold text-foreground">{totalReturn.toFixed(2)}%</span></li>
            <li>• Average Market Correlation: <span className="font-semibold text-foreground">{avgCorrelation.toFixed(3)}</span></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
