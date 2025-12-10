import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, BarChart3, Clock, Zap } from "lucide-react";
import { PortfolioData, AnnualReturn } from "@/utils/portfolioAnalysis";

interface QuickInsightsCardProps {
  data: PortfolioData[];
  annualReturns: AnnualReturn[];
}

interface DrawdownPeriod {
  startDate: string;
  troughDate: string;
  endDate: string | null;
  drawdown: number;
  recoveryDays: number | null;
}

export function QuickInsightsCard({ data, annualReturns }: QuickInsightsCardProps) {
  // Calculate Win/Loss Ratio (positive vs negative years)
  const calculateWinLossRatio = () => {
    const wins = annualReturns.filter(r => r.fundReturn > 0).length;
    const losses = annualReturns.filter(r => r.fundReturn < 0).length;
    const total = annualReturns.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    
    return { wins, losses, total, winRate };
  };

  // Calculate Beta vs CSI300 (market sensitivity)
  const calculateBeta = () => {
    if (data.length < 30) return { beta: 0, interpretation: "Insufficient data" };

    // Calculate daily returns
    const fundReturns: number[] = [];
    const marketReturns: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const fundReturn = (data[i].shareValue - data[i-1].shareValue) / data[i-1].shareValue;
      const marketReturn = (data[i].csi300 - data[i-1].csi300) / data[i-1].csi300;
      
      if (isFinite(fundReturn) && isFinite(marketReturn)) {
        fundReturns.push(fundReturn);
        marketReturns.push(marketReturn);
      }
    }

    // Calculate covariance and variance
    const n = fundReturns.length;
    if (n === 0) return { beta: 0, interpretation: "No data" };

    const meanFund = fundReturns.reduce((a, b) => a + b, 0) / n;
    const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < n; i++) {
      covariance += (fundReturns[i] - meanFund) * (marketReturns[i] - meanMarket);
      marketVariance += Math.pow(marketReturns[i] - meanMarket, 2);
    }

    covariance /= n;
    marketVariance /= n;

    const beta = marketVariance !== 0 ? covariance / marketVariance : 0;

    let interpretation = "";
    if (beta < 0.5) interpretation = "Low volatility, defensive";
    else if (beta < 0.8) interpretation = "Below market volatility";
    else if (beta < 1.2) interpretation = "Market-like volatility";
    else if (beta < 1.5) interpretation = "Above market volatility";
    else interpretation = "High volatility, aggressive";

    return { beta, interpretation };
  };

  // Calculate consecutive wins/losses streaks
  const calculateStreaks = () => {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentStreak = 0;
    let isWinning = true;

    annualReturns.forEach((r, i) => {
      if (r.fundReturn > 0) {
        if (isWinning) {
          currentStreak++;
        } else {
          currentStreak = 1;
          isWinning = true;
        }
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else if (r.fundReturn < 0) {
        if (!isWinning) {
          currentStreak++;
        } else {
          currentStreak = 1;
          isWinning = false;
        }
        maxLossStreak = Math.max(maxLossStreak, currentStreak);
      }
    });

    // Current streak
    if (annualReturns.length > 0) {
      const lastReturn = annualReturns[annualReturns.length - 1].fundReturn;
      for (let i = annualReturns.length - 1; i >= 0; i--) {
        if ((lastReturn > 0 && annualReturns[i].fundReturn > 0) ||
            (lastReturn < 0 && annualReturns[i].fundReturn < 0)) {
          if (lastReturn > 0) currentWinStreak++;
          else currentLossStreak++;
        } else {
          break;
        }
      }
    }

    return { maxWinStreak, maxLossStreak, currentWinStreak, currentLossStreak };
  };

  // Calculate drawdown recovery analysis
  const calculateRecoveryAnalysis = () => {
    if (data.length < 2) return { avgRecoveryDays: 0, maxDrawdown: 0, drawdownPeriods: [] };

    const drawdownPeriods: DrawdownPeriod[] = [];
    let peak = data[0].shareValue;
    let peakDate = data[0].date;
    let trough = data[0].shareValue;
    let troughDate = data[0].date;
    let inDrawdown = false;
    let maxDrawdown = 0;

    for (let i = 1; i < data.length; i++) {
      const value = data[i].shareValue;
      const date = data[i].date;

      if (value >= peak) {
        // New peak - if we were in a drawdown, record recovery
        if (inDrawdown && drawdownPeriods.length > 0) {
          const lastPeriod = drawdownPeriods[drawdownPeriods.length - 1];
          if (lastPeriod.endDate === null) {
            lastPeriod.endDate = date;
            lastPeriod.recoveryDays = Math.round(
              (new Date(date).getTime() - new Date(lastPeriod.troughDate).getTime()) / (1000 * 60 * 60 * 24)
            );
          }
        }
        peak = value;
        peakDate = date;
        trough = value;
        troughDate = date;
        inDrawdown = false;
      } else {
        // Below peak - in drawdown
        const drawdown = ((peak - value) / peak) * 100;
        
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }

        if (value < trough) {
          trough = value;
          troughDate = date;
        }

        // Start new drawdown period if significant (> 5%)
        if (!inDrawdown && drawdown > 5) {
          inDrawdown = true;
          drawdownPeriods.push({
            startDate: peakDate,
            troughDate: troughDate,
            endDate: null,
            drawdown: drawdown,
            recoveryDays: null
          });
        } else if (inDrawdown && drawdownPeriods.length > 0) {
          // Update current drawdown
          const lastPeriod = drawdownPeriods[drawdownPeriods.length - 1];
          if (drawdown > lastPeriod.drawdown) {
            lastPeriod.drawdown = drawdown;
            lastPeriod.troughDate = troughDate;
          }
        }
      }
    }

    // Calculate average recovery days (only for recovered periods)
    const recoveredPeriods = drawdownPeriods.filter(p => p.recoveryDays !== null);
    const avgRecoveryDays = recoveredPeriods.length > 0
      ? recoveredPeriods.reduce((sum, p) => sum + (p.recoveryDays || 0), 0) / recoveredPeriods.length
      : 0;

    return { avgRecoveryDays, maxDrawdown, drawdownPeriods };
  };

  const winLoss = calculateWinLossRatio();
  const beta = calculateBeta();
  const streaks = calculateStreaks();
  const recovery = calculateRecoveryAnalysis();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Insights
        </CardTitle>
        <CardDescription>
          Key performance indicators at a glance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Win/Loss Ratio */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Win/Loss Ratio</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{winLoss.wins}</p>
              <p className="text-xs text-muted-foreground">Winning Years</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{winLoss.losses}</p>
              <p className="text-xs text-muted-foreground">Losing Years</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{winLoss.winRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Beta vs Market */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Beta (vs CSI300)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-2xl font-bold">{beta.beta.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{beta.interpretation}</p>
            </div>
            <Badge variant={beta.beta < 1 ? "secondary" : "destructive"}>
              {beta.beta < 1 ? "Lower Risk" : "Higher Risk"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Beta &lt; 1 means less volatile than market; Beta &gt; 1 means more volatile
          </p>
        </div>

        {/* Consecutive Streaks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Performance Streaks</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded">
                <span className="text-xs">Longest Win Streak</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                  {streaks.maxWinStreak} years
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded">
                <span className="text-xs">Current Win Streak</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                  {streaks.currentWinStreak} years
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded">
                <span className="text-xs">Longest Loss Streak</span>
                <Badge variant="outline" className="bg-red-100 dark:bg-red-900">
                  {streaks.maxLossStreak} years
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded">
                <span className="text-xs">Current Loss Streak</span>
                <Badge variant="outline" className="bg-red-100 dark:bg-red-900">
                  {streaks.currentLossStreak} years
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Recovery Analysis */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Drawdown Recovery</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                -{recovery.maxDrawdown.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Maximum Drawdown</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {recovery.avgRecoveryDays > 0 ? Math.round(recovery.avgRecoveryDays) : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Recovery (days)</p>
            </div>
          </div>
          {recovery.drawdownPeriods.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1">Significant Drawdown Periods ({recovery.drawdownPeriods.length})</p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {[...recovery.drawdownPeriods]
                  .sort((a, b) => b.drawdown - a.drawdown)
                  .slice(0, 15)
                  .map((period, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">
                      {new Date(period.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', ', ')}
                    </span>
                    <span className="text-red-600 font-medium">-{period.drawdown.toFixed(1)}%</span>
                    <span className={period.recoveryDays ? "text-green-600" : "text-yellow-600"}>
                      {period.recoveryDays ? `${period.recoveryDays}d recovery` : "Not recovered"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
