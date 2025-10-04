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
    // Funds that consistently beat the market may have lower correlation
    // Focus more on absolute returns rather than correlation
    if (annualizedReturn > 12) {
      return {
        verdict: "Highly Recommended",
        color: "bg-green-600",
        icon: TrendingUp,
        description: "Excellent performance with strong annualized returns. Suitable for long-term investment."
      };
    } else if (annualizedReturn > 6 && annualizedReturn <= 12) {
      return {
        verdict: "Moderately Recommended",
        color: "bg-blue-600",
        icon: AlertCircle,
        description: "Solid returns that outperform typical savings rates. Consider as part of diversified portfolio."
      };
    } else if (annualizedReturn > 0) {
      return {
        verdict: "Low Returns",
        color: "bg-yellow-600",
        icon: AlertCircle,
        description: "Positive but modest returns. May be suitable for conservative investors."
      };
    } else {
      return {
        verdict: "Not Recommended",
        color: "bg-red-600",
        icon: TrendingDown,
        description: "Negative returns. Consider alternative investment options."
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
