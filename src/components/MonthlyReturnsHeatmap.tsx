import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface MonthlyReturnsHeatmapProps {
  data: PortfolioData[];
}

interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

interface QuarterlyReturn {
  year: number;
  quarter: number;
  return: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function MonthlyReturnsHeatmap({ data }: MonthlyReturnsHeatmapProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');

  const { heatmapData, years, monthlyStats, yearlyReturns } = useMemo(() => {
    if (data.length < 2) {
      return { heatmapData: new Map(), years: [], monthlyStats: [], yearlyReturns: new Map() };
    }

    // Group data by year-month
    const monthlyData = new Map<string, { first: PortfolioData; last: PortfolioData }>();
    // Group data by year for simple annual return calculation
    const yearlyData = new Map<number, { first: PortfolioData; last: PortfolioData }>();
    
    data.forEach(d => {
      const date = new Date(d.date);
      const year = date.getFullYear();
      const key = `${year}-${date.getMonth()}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { first: d, last: d });
      } else {
        const existing = monthlyData.get(key)!;
        monthlyData.set(key, { first: existing.first, last: d });
      }

      // Track yearly first/last for simple annual return
      if (!yearlyData.has(year)) {
        yearlyData.set(year, { first: d, last: d });
      } else {
        const existing = yearlyData.get(year)!;
        yearlyData.set(year, { first: existing.first, last: d });
      }
    });

    // Calculate monthly returns
    const returns: MonthlyReturn[] = [];
    monthlyData.forEach((value, key) => {
      const [year, month] = key.split('-').map(Number);
      const monthReturn = ((value.last.shareValue - value.first.shareValue) / value.first.shareValue) * 100;
      returns.push({ year, month, return: monthReturn });
    });

    // Calculate simple annual returns (same logic as Annual Table)
    const annualReturns = new Map<number, number>();
    yearlyData.forEach((value, year) => {
      const annualReturn = ((value.last.shareValue - value.first.shareValue) / value.first.shareValue) * 100;
      annualReturns.set(year, annualReturn);
    });

    // Get unique years
    const uniqueYears = [...new Set(returns.map(r => r.year))].sort();

    // Create heatmap data structure
    const heatmap = new Map<string, number>();
    returns.forEach(r => {
      heatmap.set(`${r.year}-${r.month}`, r.return);
    });

    // Calculate monthly averages across all years
    const monthStats = MONTHS.map((_, monthIdx) => {
      const monthReturns = returns.filter(r => r.month === monthIdx);
      const avg = monthReturns.length > 0 
        ? monthReturns.reduce((sum, r) => sum + r.return, 0) / monthReturns.length 
        : 0;
      const positiveCount = monthReturns.filter(r => r.return > 0).length;
      const winRate = monthReturns.length > 0 ? (positiveCount / monthReturns.length) * 100 : 0;
      return { month: MONTHS[monthIdx], avg, winRate, count: monthReturns.length };
    });

    return { heatmapData: heatmap, years: uniqueYears, monthlyStats: monthStats, yearlyReturns: annualReturns };
  }, [data]);

  // Calculate quarterly data
  const { quarterlyHeatmapData, quarterlyStats } = useMemo(() => {
    if (data.length < 2) {
      return { quarterlyHeatmapData: new Map(), quarterlyStats: [] };
    }

    // Group data by year-quarter
    const quarterlyData = new Map<string, { first: PortfolioData; last: PortfolioData }>();
    
    data.forEach(d => {
      const date = new Date(d.date);
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const key = `${date.getFullYear()}-${quarter}`;
      
      if (!quarterlyData.has(key)) {
        quarterlyData.set(key, { first: d, last: d });
      } else {
        const existing = quarterlyData.get(key)!;
        quarterlyData.set(key, { first: existing.first, last: d });
      }
    });

    // Calculate quarterly returns
    const returns: QuarterlyReturn[] = [];
    quarterlyData.forEach((value, key) => {
      const [year, quarter] = key.split('-').map(Number);
      const quarterReturn = ((value.last.shareValue - value.first.shareValue) / value.first.shareValue) * 100;
      returns.push({ year, quarter, return: quarterReturn });
    });

    // Create quarterly heatmap
    const qHeatmap = new Map<string, number>();
    returns.forEach(r => {
      qHeatmap.set(`${r.year}-${r.quarter}`, r.return);
    });

    // Calculate quarterly averages across all years
    const qStats = QUARTERS.map((_, quarterIdx) => {
      const quarterReturns = returns.filter(r => r.quarter === quarterIdx + 1);
      const avg = quarterReturns.length > 0 
        ? quarterReturns.reduce((sum, r) => sum + r.return, 0) / quarterReturns.length 
        : 0;
      const positiveCount = quarterReturns.filter(r => r.return > 0).length;
      const winRate = quarterReturns.length > 0 ? (positiveCount / quarterReturns.length) * 100 : 0;
      return { quarter: QUARTERS[quarterIdx], avg, winRate, count: quarterReturns.length };
    });

    return { quarterlyHeatmapData: qHeatmap, quarterlyStats: qStats };
  }, [data]);

  const getColorForReturn = (returnValue: number | undefined) => {
    if (returnValue === undefined) return 'bg-gray-100 dark:bg-gray-800';
    
    if (returnValue >= 10) return 'bg-green-600 text-white';
    if (returnValue >= 5) return 'bg-green-500 text-white';
    if (returnValue >= 2) return 'bg-green-400';
    if (returnValue >= 0) return 'bg-green-200';
    if (returnValue >= -2) return 'bg-red-200';
    if (returnValue >= -5) return 'bg-red-400';
    if (returnValue >= -10) return 'bg-red-500 text-white';
    return 'bg-red-600 text-white';
  };

  // Find best and worst months
  const allMonthlyReturns = Array.from(heatmapData.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
  
  const bestMonth = allMonthlyReturns[0];
  const worstMonth = allMonthlyReturns[allMonthlyReturns.length - 1];

  // Find best and worst quarters
  const allQuarterlyReturns = Array.from(quarterlyHeatmapData.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
  
  const bestQuarter = allQuarterlyReturns[0];
  const worstQuarter = allQuarterlyReturns[allQuarterlyReturns.length - 1];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Returns Heatmap</CardTitle>
            <CardDescription>Calendar view showing seasonal patterns and performance</CardDescription>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'monthly' | 'quarterly')}>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-600 rounded" />
            <span>&lt;-10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-400 rounded" />
            <span>-5 to -10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-200 rounded" />
            <span>-2 to -5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-200 rounded" />
            <span>0 to 2%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-400 rounded" />
            <span>2 to 5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>5 to 10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-600 rounded" />
            <span>&gt;10%</span>
          </div>
        </div>

        {/* Monthly Heatmap Table */}
        {viewMode === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold">Year</th>
                  {MONTHS.map(month => (
                    <th key={month} className="p-2 text-center font-semibold w-16">{month}</th>
                  ))}
                  <th className="p-2 text-center font-semibold">Annual</th>
                </tr>
              </thead>
              <tbody>
                {years.map(year => {
                  // Use simple annual return (same as Annual Table)
                  const annualReturnPercent = yearlyReturns.get(year) ?? 0;

                  return (
                    <tr key={year} className="border-t">
                      <td className="p-2 font-semibold">{year}</td>
                      {MONTHS.map((_, monthIdx) => {
                        const returnValue = heatmapData.get(`${year}-${monthIdx}`);
                        return (
                          <td 
                            key={monthIdx} 
                            className={`p-2 text-center text-xs font-medium rounded-sm ${getColorForReturn(returnValue)}`}
                            title={returnValue !== undefined ? `${MONTHS[monthIdx]} ${year}: ${returnValue.toFixed(2)}%` : 'No data'}
                          >
                            {returnValue !== undefined ? `${returnValue.toFixed(1)}%` : '-'}
                          </td>
                        );
                      })}
                      <td className={`p-2 text-center text-xs font-bold ${annualReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {annualReturnPercent >= 0 ? '+' : ''}{annualReturnPercent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Quarterly Heatmap Table */}
        {viewMode === 'quarterly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold">Year</th>
                  {QUARTERS.map(quarter => (
                    <th key={quarter} className="p-2 text-center font-semibold w-24">{quarter}</th>
                  ))}
                  <th className="p-2 text-center font-semibold">Annual</th>
                </tr>
              </thead>
              <tbody>
                {years.map(year => {
                  // Use simple annual return (same as Annual Table)
                  const annualReturnPercent = yearlyReturns.get(year) ?? 0;

                  return (
                    <tr key={year} className="border-t">
                      <td className="p-2 font-semibold">{year}</td>
                      {QUARTERS.map((quarter, quarterIdx) => {
                        const returnValue = quarterlyHeatmapData.get(`${year}-${quarterIdx + 1}`);
                        return (
                          <td 
                            key={quarterIdx} 
                            className={`p-2 text-center text-sm font-medium rounded-sm ${getColorForReturn(returnValue)}`}
                            title={returnValue !== undefined ? `${quarter} ${year}: ${returnValue.toFixed(2)}%` : 'No data'}
                          >
                            {returnValue !== undefined ? `${returnValue.toFixed(1)}%` : '-'}
                          </td>
                        );
                      })}
                      <td className={`p-2 text-center text-sm font-bold ${annualReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {annualReturnPercent >= 0 ? '+' : ''}{annualReturnPercent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Period Statistics */}
        {viewMode === 'monthly' && (
          <div>
            <h4 className="font-semibold mb-3">Monthly Averages (All Years)</h4>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyStats.map((stat, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg text-center ${stat.avg >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}
                >
                  <p className="text-xs font-semibold">{stat.month}</p>
                  <p className={`text-sm font-bold ${stat.avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.avg >= 0 ? '+' : ''}{stat.avg.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.winRate.toFixed(0)}% win</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'quarterly' && (
          <div>
            <h4 className="font-semibold mb-3">Quarterly Averages (All Years)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quarterlyStats.map((stat, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg text-center ${stat.avg >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}
                >
                  <p className="text-sm font-semibold">{stat.quarter}</p>
                  <p className={`text-2xl font-bold ${stat.avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.avg >= 0 ? '+' : ''}{stat.avg.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.winRate.toFixed(0)}% win rate</p>
                  <p className="text-xs text-muted-foreground">{stat.count} periods</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best/Worst Summary */}
        <div className="grid grid-cols-2 gap-4">
          {viewMode === 'monthly' && bestMonth && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Best Month</p>
              <p className="text-lg font-bold text-green-600">+{bestMonth.value.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground">
                {MONTHS[parseInt(bestMonth.key.split('-')[1])]} {bestMonth.key.split('-')[0]}
              </p>
            </div>
          )}
          {viewMode === 'monthly' && worstMonth && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Worst Month</p>
              <p className="text-lg font-bold text-red-600">{worstMonth.value.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground">
                {MONTHS[parseInt(worstMonth.key.split('-')[1])]} {worstMonth.key.split('-')[0]}
              </p>
            </div>
          )}
          {viewMode === 'quarterly' && bestQuarter && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Best Quarter</p>
              <p className="text-lg font-bold text-green-600">+{bestQuarter.value.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground">
                Q{bestQuarter.key.split('-')[1]} {bestQuarter.key.split('-')[0]}
              </p>
            </div>
          )}
          {viewMode === 'quarterly' && worstQuarter && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Worst Quarter</p>
              <p className="text-lg font-bold text-red-600">{worstQuarter.value.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground">
                Q{worstQuarter.key.split('-')[1]} {worstQuarter.key.split('-')[0]}
              </p>
            </div>
          )}
        </div>

        {/* Seasonal Insights */}
        <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          <strong>{viewMode === 'monthly' ? 'Seasonal' : 'Quarterly'} Insights:</strong>{' '}
          {viewMode === 'monthly' ? (
            (() => {
              const bestMonths = monthlyStats
                .map((s, i) => ({ ...s, idx: i }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 3);
              const worstMonths = monthlyStats
                .map((s, i) => ({ ...s, idx: i }))
                .sort((a, b) => a.avg - b.avg)
                .slice(0, 3);
              
              return `Historically strongest months: ${bestMonths.map(m => m.month).join(', ')}. 
                      Weakest months: ${worstMonths.map(m => m.month).join(', ')}.`;
            })()
          ) : (
            (() => {
              const bestQuarters = quarterlyStats
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 2);
              const worstQuarters = quarterlyStats
                .sort((a, b) => a.avg - b.avg)
                .slice(0, 2);
              
              return `Historically strongest quarters: ${bestQuarters.map(q => q.quarter).join(', ')} (avg ${bestQuarters[0]?.avg.toFixed(1)}%). 
                      Weakest quarters: ${worstQuarters.map(q => q.quarter).join(', ')} (avg ${worstQuarters[0]?.avg.toFixed(1)}%).`;
            })()
          )}
        </div>
      </CardContent>
    </Card>
  );
}
