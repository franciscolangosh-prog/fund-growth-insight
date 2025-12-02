import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface BestWorstPeriodsCardProps {
  data: PortfolioData[];
}

interface PeriodReturn {
  startDate: string;
  endDate: string;
  return: number;
  type: 'month' | 'quarter';
  label: string;
}

export function BestWorstPeriodsCard({ data }: BestWorstPeriodsCardProps) {
  const { monthlyReturns, quarterlyReturns } = useMemo(() => {
    if (data.length < 20) {
      return { monthlyReturns: [], quarterlyReturns: [] };
    }

    // Calculate monthly returns
    const monthly: PeriodReturn[] = [];
    const monthlyData = new Map<string, { first: PortfolioData; last: PortfolioData }>();
    
    data.forEach(d => {
      const date = new Date(d.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { first: d, last: d });
      } else {
        const existing = monthlyData.get(key)!;
        monthlyData.set(key, { first: existing.first, last: d });
      }
    });

    monthlyData.forEach((value, key) => {
      const [year, month] = key.split('-');
      const monthReturn = ((value.last.shareValue - value.first.shareValue) / value.first.shareValue) * 100;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      monthly.push({
        startDate: value.first.date,
        endDate: value.last.date,
        return: monthReturn,
        type: 'month',
        label: `${monthNames[parseInt(month) - 1]} ${year}`,
      });
    });

    // Calculate quarterly returns
    const quarterly: PeriodReturn[] = [];
    const quarterlyData = new Map<string, { first: PortfolioData; last: PortfolioData }>();
    
    data.forEach(d => {
      const date = new Date(d.date);
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const key = `${date.getFullYear()}-Q${quarter}`;
      
      if (!quarterlyData.has(key)) {
        quarterlyData.set(key, { first: d, last: d });
      } else {
        const existing = quarterlyData.get(key)!;
        quarterlyData.set(key, { first: existing.first, last: d });
      }
    });

    quarterlyData.forEach((value, key) => {
      const quarterReturn = ((value.last.shareValue - value.first.shareValue) / value.first.shareValue) * 100;
      
      quarterly.push({
        startDate: value.first.date,
        endDate: value.last.date,
        return: quarterReturn,
        type: 'quarter',
        label: key,
      });
    });

    return { monthlyReturns: monthly, quarterlyReturns: quarterly };
  }, [data]);

  // Get top 5 best and worst for each period type
  const bestMonths = [...monthlyReturns].sort((a, b) => b.return - a.return).slice(0, 5);
  const worstMonths = [...monthlyReturns].sort((a, b) => a.return - b.return).slice(0, 5);
  const bestQuarters = [...quarterlyReturns].sort((a, b) => b.return - a.return).slice(0, 5);
  const worstQuarters = [...quarterlyReturns].sort((a, b) => a.return - b.return).slice(0, 5);

  const PeriodList = ({ periods, isBest }: { periods: PeriodReturn[]; isBest: boolean }) => (
    <div className="space-y-2">
      {periods.map((period, idx) => (
        <div 
          key={`${period.label}-${idx}`}
          className={`flex items-center justify-between p-2 rounded-lg ${
            isBest ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              #{idx + 1}
            </Badge>
            <span className="text-sm font-medium">{period.label}</span>
          </div>
          <span className={`text-sm font-bold ${isBest ? 'text-green-600' : 'text-red-600'}`}>
            {period.return >= 0 ? '+' : ''}{period.return.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          Best & Worst Periods
        </CardTitle>
        <CardDescription>
          Top 5 best and worst performing months and quarters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Section */}
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Monthly Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">Best Months</span>
              </div>
              <PeriodList periods={bestMonths} isBest={true} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-600">Worst Months</span>
              </div>
              <PeriodList periods={worstMonths} isBest={false} />
            </div>
          </div>
        </div>

        {/* Quarterly Section */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Quarterly Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">Best Quarters</span>
              </div>
              <PeriodList periods={bestQuarters} isBest={true} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-600">Worst Quarters</span>
              </div>
              <PeriodList periods={worstQuarters} isBest={false} />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Summary Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Best Month</p>
              <p className="text-lg font-bold text-green-600">
                +{bestMonths.length > 0 ? (bestMonths.reduce((s, m) => s + m.return, 0) / bestMonths.length).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Worst Month</p>
              <p className="text-lg font-bold text-red-600">
                {worstMonths.length > 0 ? (worstMonths.reduce((s, m) => s + m.return, 0) / worstMonths.length).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Best Quarter</p>
              <p className="text-lg font-bold text-green-600">
                +{bestQuarters.length > 0 ? (bestQuarters.reduce((s, q) => s + q.return, 0) / bestQuarters.length).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Worst Quarter</p>
              <p className="text-lg font-bold text-red-600">
                {worstQuarters.length > 0 ? (worstQuarters.reduce((s, q) => s + q.return, 0) / worstQuarters.length).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <strong>Insight:</strong>{' '}
          {bestMonths.length > 0 && worstMonths.length > 0 && (
            <>
              The fund's best month ({bestMonths[0]?.label}) returned {bestMonths[0]?.return.toFixed(1)}%, 
              while the worst month ({worstMonths[0]?.label}) saw a {worstMonths[0]?.return.toFixed(1)}% decline.
              {Math.abs(bestMonths[0]?.return) > Math.abs(worstMonths[0]?.return * 1.5)
                ? " Upside potential appears to exceed downside risk."
                : Math.abs(worstMonths[0]?.return) > Math.abs(bestMonths[0]?.return * 1.5)
                  ? " Downside moves tend to be larger than upside moves."
                  : " Upside and downside moves are relatively balanced."}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
