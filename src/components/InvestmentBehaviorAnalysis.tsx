import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { PortfolioData } from "@/utils/portfolioAnalysis";

interface InvestmentBehaviorAnalysisProps {
  data: PortfolioData[];
}

interface InvestmentAction {
  date: string;
  principleChange: number;
  marketTrend: number;
  isContrarian: boolean;
}

export function InvestmentBehaviorAnalysis({ data }: InvestmentBehaviorAnalysisProps) {
  const analyzeInvestmentBehavior = () => {
    const actions: InvestmentAction[] = [];
    let contrarianActions = 0;
    let totalActions = 0;

    for (let i = 1; i < data.length; i++) {
      const principleChange = data[i].principle - data[i - 1].principle;
      
      // Lower threshold to capture more actions (> 50 instead of 100)
      if (Math.abs(principleChange) > 50) {
        // Calculate market trend over the past 30 days
        const lookbackPeriod = 30;
        const startIdx = Math.max(0, i - lookbackPeriod);
        const marketTrend = ((data[i].csi300 - data[startIdx].csi300) / data[startIdx].csi300) * 100;

        // Contrarian behavior:
        // - Investing (positive principleChange) when market is down (negative marketTrend)
        // - Withdrawing (negative principleChange) when market is up (positive marketTrend)
        const isContrarian = 
          (principleChange > 0 && marketTrend < 0) || 
          (principleChange < 0 && marketTrend > 0);

        if (isContrarian) {
          contrarianActions++;
        }
        totalActions++;

        actions.push({
          date: data[i].date,
          principleChange,
          marketTrend,
          isContrarian,
        });
      }
    }

    return { actions, contrarianActions, totalActions };
  };

  const analyzeMarketDownturns = () => {
    const downturns: Array<{
      period: string;
      marketDrop: number;
      investorAction: string;
      actionAmount: number;
      wasContrarian: boolean;
    }> = [];

    // Find periods where market dropped significantly (> 10%)
    for (let i = 30; i < data.length; i++) {
      const lookbackPeriod = 30;
      const startIdx = i - lookbackPeriod;
      const marketChange = ((data[i].csi300 - data[startIdx].csi300) / data[startIdx].csi300) * 100;

      if (marketChange < -10) {
        // Check investor action during this period
        const principleChange = data[i].principle - data[startIdx].principle;
        
        if (Math.abs(principleChange) > 50) {
          const action = principleChange > 0 ? 'Invested' : 'Withdrew';
          const wasContrarian = principleChange > 0; // Investing during downturn is contrarian
          
          downturns.push({
            period: `${new Date(data[startIdx].date).toLocaleDateString()} - ${new Date(data[i].date).toLocaleDateString()}`,
            marketDrop: marketChange,
            investorAction: action,
            actionAmount: Math.abs(principleChange),
            wasContrarian,
          });
        }
      }
    }

    return downturns;
  };

  const { actions, contrarianActions, totalActions } = analyzeInvestmentBehavior();
  const marketDownturns = analyzeMarketDownturns();
  const contrarianRatio = totalActions > 0 ? (contrarianActions / totalActions) * 100 : 0;

  const getInvestorType = () => {
    if (contrarianRatio >= 60) {
      return {
        type: "Strong Contrarian",
        color: "bg-green-500",
        icon: TrendingDown,
        description: "Frequently invests when market is down and withdraws when market is up. This strategy can capture value opportunities."
      };
    } else if (contrarianRatio >= 40) {
      return {
        type: "Moderate Contrarian",
        color: "bg-blue-500",
        icon: Activity,
        description: "Shows balanced investment behavior with some contrarian tendencies. Moderately counter-cyclical."
      };
    } else {
      return {
        type: "Trend Follower",
        color: "bg-orange-500",
        icon: TrendingUp,
        description: "Tends to invest when market is rising and withdraw when falling. Follows market momentum."
      };
    }
  };

  const investorProfile = getInvestorType();
  const Icon = investorProfile.icon;

  const recentActions = actions.slice(-10).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          Investment Behavior Analysis
        </CardTitle>
        <CardDescription>
          Analysis of investment timing relative to market movements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Investor Profile</span>
            <Badge className={investorProfile.color}>{investorProfile.type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{investorProfile.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Contrarian Actions</p>
            <p className="text-2xl font-bold">{contrarianActions}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Contrarian Ratio</p>
            <p className="text-2xl font-bold">{contrarianRatio.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Actions</p>
            <p className="text-2xl font-bold">{totalActions}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Trend Following</p>
            <p className="text-2xl font-bold">{totalActions - contrarianActions}</p>
          </div>
        </div>

        {marketDownturns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Behavior During Major Market Downturns</h4>
            <p className="text-xs text-muted-foreground">Periods when CSI300 dropped more than 10%</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {marketDownturns.map((downturn, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-l-2 pl-3 py-2 bg-muted/30 rounded-r" 
                     style={{ borderColor: downturn.wasContrarian ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-5))' }}>
                  <div className="flex-1">
                    <p className="font-medium text-xs">{downturn.period}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {downturn.investorAction} ¥{downturn.actionAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-red-600 font-semibold">
                      Market {downturn.marketDrop.toFixed(1)}%
                    </p>
                    <Badge variant={downturn.wasContrarian ? "default" : "destructive"} className="text-xs mt-1">
                      {downturn.wasContrarian ? 'Contrarian ✓' : 'Trend Following'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Investment Actions (Last 10)</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentActions.map((action, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-l-2 pl-3 py-1" 
                     style={{ borderColor: action.isContrarian ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-3))' }}>
                  <div>
                    <p className="font-medium">{new Date(action.date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.principleChange > 0 ? 'Invested' : 'Withdrew'} ¥{Math.abs(action.principleChange).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={action.marketTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                      Market {action.marketTrend > 0 ? '+' : ''}{action.marketTrend.toFixed(1)}%
                    </p>
                    <Badge variant={action.isContrarian ? "default" : "secondary"} className="text-xs">
                      {action.isContrarian ? 'Contrarian' : 'Trend'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
