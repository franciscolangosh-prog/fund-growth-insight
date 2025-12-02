import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { PortfolioData } from "@/utils/portfolioAnalysis";

interface RiskMetricsCardProps {
  data: PortfolioData[];
}

export function RiskMetricsCard({ data }: RiskMetricsCardProps) {
  const calculateRiskMetrics = () => {
    if (data.length < 30) {
      return {
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
        annualizedVolatility: 0,
      };
    }

    // Calculate daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const dailyReturn = (data[i].shareValue - data[i - 1].shareValue) / data[i - 1].shareValue;
      if (isFinite(dailyReturn)) {
        dailyReturns.push(dailyReturn);
      }
    }

    const n = dailyReturns.length;
    if (n === 0) {
      return { sharpeRatio: 0, sortinoRatio: 0, maxDrawdown: 0, volatility: 0, annualizedVolatility: 0 };
    }

    // Mean daily return
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / n;

    // Standard deviation (volatility)
    const squaredDiffs = dailyReturns.map(r => Math.pow(r - meanReturn, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
    const dailyVolatility = Math.sqrt(variance);
    const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100; // 252 trading days

    // Annualized return
    const totalReturn = (data[data.length - 1].shareValue / data[0].shareValue) - 1;
    const years = (new Date(data[data.length - 1].date).getTime() - new Date(data[0].date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const annualizedReturn = (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;

    // Risk-free rate (assume 3% annual)
    const riskFreeRate = 3;
    const dailyRiskFreeRate = riskFreeRate / 100 / 252;

    // Sharpe Ratio = (Return - Risk Free Rate) / Volatility
    const excessReturn = annualizedReturn - riskFreeRate;
    const sharpeRatio = annualizedVolatility !== 0 ? excessReturn / annualizedVolatility : 0;

    // Sortino Ratio - only uses downside deviation
    const negativeReturns = dailyReturns.filter(r => r < dailyRiskFreeRate);
    const downsideSquaredDiffs = negativeReturns.map(r => Math.pow(r - dailyRiskFreeRate, 2));
    const downsideVariance = downsideSquaredDiffs.length > 0 
      ? downsideSquaredDiffs.reduce((a, b) => a + b, 0) / downsideSquaredDiffs.length 
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252) * 100;
    const sortinoRatio = downsideDeviation !== 0 ? excessReturn / downsideDeviation : 0;

    // Maximum Drawdown
    let peak = data[0].shareValue;
    let maxDrawdown = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].shareValue > peak) {
        peak = data[i].shareValue;
      }
      const drawdown = ((peak - data[i].shareValue) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return {
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      volatility: dailyVolatility * 100,
      annualizedVolatility,
    };
  };

  const metrics = calculateRiskMetrics();

  const getSharpeInterpretation = (ratio: number) => {
    if (ratio >= 2) return { label: "Excellent", color: "bg-green-500" };
    if (ratio >= 1) return { label: "Good", color: "bg-blue-500" };
    if (ratio >= 0.5) return { label: "Average", color: "bg-yellow-500" };
    if (ratio >= 0) return { label: "Below Average", color: "bg-orange-500" };
    return { label: "Poor", color: "bg-red-500" };
  };

  const getVolatilityInterpretation = (vol: number) => {
    if (vol < 10) return { label: "Low", color: "bg-green-500" };
    if (vol < 20) return { label: "Moderate", color: "bg-blue-500" };
    if (vol < 30) return { label: "High", color: "bg-orange-500" };
    return { label: "Very High", color: "bg-red-500" };
  };

  const getDrawdownInterpretation = (dd: number) => {
    if (dd < 10) return { label: "Minimal", color: "bg-green-500" };
    if (dd < 20) return { label: "Moderate", color: "bg-blue-500" };
    if (dd < 30) return { label: "Significant", color: "bg-orange-500" };
    return { label: "Severe", color: "bg-red-500" };
  };

  const sharpeInterp = getSharpeInterpretation(metrics.sharpeRatio);
  const sortinoInterp = getSharpeInterpretation(metrics.sortinoRatio);
  const volInterp = getVolatilityInterpretation(metrics.annualizedVolatility);
  const ddInterp = getDrawdownInterpretation(metrics.maxDrawdown);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Risk Metrics
        </CardTitle>
        <CardDescription>
          Risk-adjusted performance indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sharpe Ratio */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Sharpe Ratio</span>
            </div>
            <Badge className={sharpeInterp.color}>{sharpeInterp.label}</Badge>
          </div>
          <p className="text-3xl font-bold">{metrics.sharpeRatio.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            Risk-adjusted return (excess return per unit of risk). Higher is better. &gt;1 is good, &gt;2 is excellent.
          </p>
        </div>

        {/* Sortino Ratio */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Sortino Ratio</span>
            </div>
            <Badge className={sortinoInterp.color}>{sortinoInterp.label}</Badge>
          </div>
          <p className="text-3xl font-bold">{metrics.sortinoRatio.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            Like Sharpe but only penalizes downside volatility. Higher is better for asymmetric returns.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Volatility */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Volatility</span>
            </div>
            <p className="text-2xl font-bold">{metrics.annualizedVolatility.toFixed(1)}%</p>
            <Badge className={volInterp.color} variant="secondary">{volInterp.label}</Badge>
            <p className="text-xs text-muted-foreground">Annualized std dev</p>
          </div>

          {/* Max Drawdown */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold">Max Drawdown</span>
            </div>
            <p className="text-2xl font-bold text-red-600">-{metrics.maxDrawdown.toFixed(1)}%</p>
            <Badge className={ddInterp.color} variant="secondary">{ddInterp.label}</Badge>
            <p className="text-xs text-muted-foreground">Largest peak-to-trough</p>
          </div>
        </div>

        {/* Risk Assessment Summary */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Risk Assessment</h4>
          <p className="text-sm text-muted-foreground">
            {metrics.sharpeRatio >= 1 && metrics.maxDrawdown < 20 
              ? "This fund shows favorable risk-adjusted returns with manageable drawdowns. Suitable for moderate-risk investors."
              : metrics.sharpeRatio >= 0.5 
                ? "Moderate risk-adjusted performance. Consider as part of a diversified portfolio."
                : "Higher risk profile. May be suitable for aggressive investors with longer time horizons."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
