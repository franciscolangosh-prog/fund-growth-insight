import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from "lucide-react";
import { RiskMetrics } from "@/utils/portfolioAnalysis";

interface RiskMetricsCardProps {
  riskMetrics: RiskMetrics;
}

export function RiskMetricsCard({ riskMetrics }: RiskMetricsCardProps) {
  const getVolatilityColor = (volatility: number) => {
    if (volatility < 15) return "text-green-600";
    if (volatility < 25) return "text-yellow-600";
    return "text-red-600";
  };

  const getSharpeColor = (sharpe: number) => {
    if (sharpe > 1) return "text-green-600";
    if (sharpe > 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getDrawdownColor = (drawdown: number) => {
    if (drawdown < 10) return "text-green-600";
    if (drawdown < 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getBetaColor = (beta: number) => {
    if (beta < 0.8) return "text-blue-600";
    if (beta > 1.2) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volatility and Risk-Adjusted Returns */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volatility (Annualized)</span>
              <Badge variant="outline" className={getVolatilityColor(riskMetrics.volatility)}>
                {riskMetrics.volatility.toFixed(2)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sharpe Ratio</span>
              <Badge variant="outline" className={getSharpeColor(riskMetrics.sharpeRatio)}>
                {riskMetrics.sharpeRatio.toFixed(3)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sortino Ratio</span>
              <Badge variant="outline" className={getSharpeColor(riskMetrics.sortinoRatio)}>
                {riskMetrics.sortinoRatio.toFixed(3)}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Max Drawdown</span>
              <Badge variant="outline" className={getDrawdownColor(riskMetrics.maxDrawdown)}>
                {riskMetrics.maxDrawdown.toFixed(2)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Calmar Ratio</span>
              <Badge variant="outline">
                {riskMetrics.calmarRatio === Infinity ? "∞" : riskMetrics.calmarRatio.toFixed(3)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Information Ratio</span>
              <Badge variant="outline">
                {riskMetrics.informationRatio.toFixed(3)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Beta Analysis */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Beta (Market Sensitivity)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">vs SHA</div>
              <Badge variant="outline" className={getBetaColor(riskMetrics.beta.sha)}>
                {riskMetrics.beta.sha.toFixed(3)}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">vs SHE</div>
              <Badge variant="outline" className={getBetaColor(riskMetrics.beta.she)}>
                {riskMetrics.beta.she.toFixed(3)}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">vs CSI 300</div>
              <Badge variant="outline" className={getBetaColor(riskMetrics.beta.csi300)}>
                {riskMetrics.beta.csi300.toFixed(3)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Alpha Analysis */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Alpha (Excess Return)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">vs SHA</div>
              <Badge 
                variant="outline" 
                className={riskMetrics.alpha.sha >= 0 ? "text-green-600" : "text-red-600"}
              >
                {riskMetrics.alpha.sha >= 0 ? "+" : ""}{riskMetrics.alpha.sha.toFixed(2)}%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">vs SHE</div>
              <Badge 
                variant="outline" 
                className={riskMetrics.alpha.she >= 0 ? "text-green-600" : "text-red-600"}
              >
                {riskMetrics.alpha.she >= 0 ? "+" : ""}{riskMetrics.alpha.she.toFixed(2)}%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">vs CSI 300</div>
              <Badge 
                variant="outline" 
                className={riskMetrics.alpha.csi300 >= 0 ? "text-green-600" : "text-red-600"}
              >
                {riskMetrics.alpha.csi300 >= 0 ? "+" : ""}{riskMetrics.alpha.csi300.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Risk Interpretation */}
        <div className="pt-4 border-t">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p><strong>Volatility:</strong> {riskMetrics.volatility < 15 ? "Low" : riskMetrics.volatility < 25 ? "Moderate" : "High"} risk</p>
              <p><strong>Sharpe:</strong> {riskMetrics.sharpeRatio > 1 ? "Excellent" : riskMetrics.sharpeRatio > 0.5 ? "Good" : "Poor"} risk-adjusted returns</p>
              <p><strong>Beta:</strong> {riskMetrics.beta.csi300 < 0.8 ? "Defensive" : riskMetrics.beta.csi300 > 1.2 ? "Aggressive" : "Market-like"} sensitivity</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}