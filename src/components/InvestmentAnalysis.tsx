import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface InvestmentAnalysisProps {
  annualizedReturn: number;
  totalReturn: number;
  correlations: { sha: number; she: number; csi300: number };
  benchmarkReturns: {
    sha: number;
    she: number;
    csi300: number;
    avgBenchmark: number;
  };
  globalIndices?: {
    sp500?: number;
    nasdaq?: number;
    ftse100?: number;
    hangseng?: number;
  };
  outperformance: number;
}

export function InvestmentAnalysis({ 
  annualizedReturn, 
  totalReturn, 
  correlations,
  benchmarkReturns,
  globalIndices,
  outperformance 
}: InvestmentAnalysisProps) {
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
          <h4 className="font-semibold text-sm">Fund Performance:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Annualized Return: <span className="font-semibold text-foreground">{annualizedReturn.toFixed(2)}%</span></li>
            <li>• Total Return: <span className="font-semibold text-foreground">{totalReturn.toFixed(2)}%</span></li>
            <li>• Average Market Correlation: <span className="font-semibold text-foreground">{avgCorrelation.toFixed(3)}</span></li>
          </ul>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-semibold text-sm">China Market Benchmark Comparison (Annualized):</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Shanghai Composite (SHA): <span className="font-semibold text-foreground">{benchmarkReturns.sha.toFixed(2)}%</span></li>
            <li>• Shenzhen Component (SHE): <span className="font-semibold text-foreground">{benchmarkReturns.she.toFixed(2)}%</span></li>
            <li>• CSI 300: <span className="font-semibold text-foreground">{benchmarkReturns.csi300.toFixed(2)}%</span></li>
            <li>• Average China Benchmark: <span className="font-semibold text-foreground">{benchmarkReturns.avgBenchmark.toFixed(2)}%</span></li>
            <li>• <strong>Outperformance vs China Markets: <span className={`font-semibold ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {outperformance > 0 ? '+' : ''}{outperformance.toFixed(2)}%
            </span></strong></li>
          </ul>
        </div>

        {globalIndices && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm">Global Market Indices Comparison (Annualized):</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {globalIndices.sp500 !== undefined && globalIndices.sp500 !== 0 && (
                <li>• S&P 500 (US): <span className="font-semibold text-foreground">{globalIndices.sp500.toFixed(2)}%</span>
                  <span className={`ml-2 font-semibold ${annualizedReturn > globalIndices.sp500 ? 'text-green-600' : 'text-red-600'}`}>
                    ({annualizedReturn > globalIndices.sp500 ? '+' : ''}{(annualizedReturn - globalIndices.sp500).toFixed(2)}% vs fund)
                  </span>
                </li>
              )}
              {globalIndices.nasdaq !== undefined && globalIndices.nasdaq !== 0 && (
                <li>• Nasdaq Composite (US): <span className="font-semibold text-foreground">{globalIndices.nasdaq.toFixed(2)}%</span>
                  <span className={`ml-2 font-semibold ${annualizedReturn > globalIndices.nasdaq ? 'text-green-600' : 'text-red-600'}`}>
                    ({annualizedReturn > globalIndices.nasdaq ? '+' : ''}{(annualizedReturn - globalIndices.nasdaq).toFixed(2)}% vs fund)
                  </span>
                </li>
              )}
              {globalIndices.ftse100 !== undefined && globalIndices.ftse100 !== 0 && (
                <li>• FTSE 100 (UK): <span className="font-semibold text-foreground">{globalIndices.ftse100.toFixed(2)}%</span>
                  <span className={`ml-2 font-semibold ${annualizedReturn > globalIndices.ftse100 ? 'text-green-600' : 'text-red-600'}`}>
                    ({annualizedReturn > globalIndices.ftse100 ? '+' : ''}{(annualizedReturn - globalIndices.ftse100).toFixed(2)}% vs fund)
                  </span>
                </li>
              )}
              {globalIndices.hangseng !== undefined && globalIndices.hangseng !== 0 && (
                <li>• Hang Seng (HK): <span className="font-semibold text-foreground">{globalIndices.hangseng.toFixed(2)}%</span>
                  <span className={`ml-2 font-semibold ${annualizedReturn > globalIndices.hangseng ? 'text-green-600' : 'text-red-600'}`}>
                    ({annualizedReturn > globalIndices.hangseng ? '+' : ''}{(annualizedReturn - globalIndices.hangseng).toFixed(2)}% vs fund)
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
