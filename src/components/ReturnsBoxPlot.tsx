import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface ReturnsBoxPlotProps {
  data: PortfolioData[];
}

type BenchmarkKey = 'fund' | 'csi300' | 'sp500' | 'nasdaq' | 'sha' | 'she' | 'ftse100' | 'hangseng';

interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  count: number;
}

const BENCHMARKS: { key: BenchmarkKey; label: string; color: string }[] = [
  { key: 'fund', label: 'My Fund', color: 'hsl(var(--primary))' },
  { key: 'csi300', label: 'CSI 300', color: '#10b981' },
  { key: 'sp500', label: 'S&P 500', color: '#ef4444' },
  { key: 'nasdaq', label: 'Nasdaq', color: '#8b5cf6' },
  { key: 'sha', label: 'Shanghai (SHA)', color: '#f59e0b' },
  { key: 'she', label: 'Shenzhen (SHE)', color: '#06b6d4' },
  { key: 'ftse100', label: 'FTSE 100', color: '#ec4899' },
  { key: 'hangseng', label: 'Hang Seng', color: '#84cc16' },
];

const PERIODS = [
  { key: '1Y', label: '1 Year', days: 252 },
  { key: '3Y', label: '3 Years', days: 252 * 3 },
  { key: '5Y', label: '5 Years', days: 252 * 5 },
  { key: '8Y', label: '8 Years', days: 252 * 8 },
];

function calculatePercentile(arr: number[], percentile: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function calculateBoxPlotStats(values: number[]): BoxPlotStats | null {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0],
    q1: calculatePercentile(sorted, 25),
    median: calculatePercentile(sorted, 50),
    q3: calculatePercentile(sorted, 75),
    max: sorted[sorted.length - 1],
    mean: sum / values.length,
    count: values.length,
  };
}

export function ReturnsBoxPlot({ data }: ReturnsBoxPlotProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkKey>('fund');

  const boxPlotData = useMemo(() => {
    const results: Record<string, BoxPlotStats | null> = {};

    for (const period of PERIODS) {
      const { days, key } = period;
      if (data.length < days) {
        results[key] = null;
        continue;
      }

      const returns: number[] = [];
      const years = days / 252;

      // Calculate rolling returns every 20 days for efficiency
      for (let i = days; i < data.length; i += 20) {
        const startIdx = i - days;
        let startValue: number, endValue: number;

        if (selectedBenchmark === 'fund') {
          startValue = data[startIdx].shareValue;
          endValue = data[i].shareValue;
        } else {
          startValue = data[startIdx][selectedBenchmark] as number;
          endValue = data[i][selectedBenchmark] as number;
        }

        if (startValue > 0 && endValue > 0) {
          const annualizedReturn = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
          returns.push(annualizedReturn);
        }
      }

      results[key] = calculateBoxPlotStats(returns);
    }

    return results;
  }, [data, selectedBenchmark]);

  const selectedBenchmarkInfo = BENCHMARKS.find(b => b.key === selectedBenchmark)!;

  // Calculate the scale for the box plots
  const allValues = Object.values(boxPlotData)
    .filter((stats): stats is BoxPlotStats => stats !== null)
    .flatMap(stats => [stats.min, stats.max]);
  
  const minValue = allValues.length > 0 ? Math.min(...allValues) : -20;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 30;
  const range = maxValue - minValue;
  const padding = range * 0.1;
  const scaleMin = minValue - padding;
  const scaleMax = maxValue + padding;
  const scaleRange = scaleMax - scaleMin;

  const getPosition = (value: number) => ((value - scaleMin) / scaleRange) * 100;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Return Distribution Box Plot</CardTitle>
            <CardDescription>Distribution of annualized rolling returns across different periods</CardDescription>
          </div>
          <Select value={selectedBenchmark} onValueChange={(v) => setSelectedBenchmark(v as BenchmarkKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BENCHMARKS.map(b => (
                <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Box Plot Visualization */}
        <div className="space-y-4">
          {PERIODS.map(period => {
            const stats = boxPlotData[period.key];
            
            return (
              <div key={period.key} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-muted-foreground">{period.label}</div>
                <div className="flex-1 relative h-12">
                  {stats ? (
                    <>
                      {/* Scale background */}
                      <div className="absolute inset-0 bg-muted/30 rounded" />
                      
                      {/* Zero reference line */}
                      {scaleMin < 0 && scaleMax > 0 && (
                        <div 
                          className="absolute top-0 bottom-0 w-px bg-muted-foreground/50"
                          style={{ left: `${getPosition(0)}%` }}
                        />
                      )}
                      
                      {/* Whisker line (min to max) */}
                      <div 
                        className="absolute top-1/2 h-0.5 -translate-y-1/2"
                        style={{ 
                          left: `${getPosition(stats.min)}%`,
                          width: `${getPosition(stats.max) - getPosition(stats.min)}%`,
                          backgroundColor: selectedBenchmarkInfo.color,
                          opacity: 0.5,
                        }}
                      />
                      
                      {/* Min whisker cap */}
                      <div 
                        className="absolute top-1/4 h-1/2 w-0.5"
                        style={{ 
                          left: `${getPosition(stats.min)}%`,
                          backgroundColor: selectedBenchmarkInfo.color,
                        }}
                      />
                      
                      {/* Max whisker cap */}
                      <div 
                        className="absolute top-1/4 h-1/2 w-0.5"
                        style={{ 
                          left: `${getPosition(stats.max)}%`,
                          backgroundColor: selectedBenchmarkInfo.color,
                        }}
                      />
                      
                      {/* Box (Q1 to Q3) */}
                      <div 
                        className="absolute top-1/4 h-1/2 rounded border-2"
                        style={{ 
                          left: `${getPosition(stats.q1)}%`,
                          width: `${getPosition(stats.q3) - getPosition(stats.q1)}%`,
                          backgroundColor: `${selectedBenchmarkInfo.color}20`,
                          borderColor: selectedBenchmarkInfo.color,
                        }}
                      />
                      
                      {/* Median line */}
                      <div 
                        className="absolute top-1/4 h-1/2 w-0.5"
                        style={{ 
                          left: `${getPosition(stats.median)}%`,
                          backgroundColor: selectedBenchmarkInfo.color,
                        }}
                      />
                      
                      {/* Mean marker (diamond) */}
                      <div 
                        className="absolute top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
                        style={{ 
                          left: `${getPosition(stats.mean)}%`,
                          backgroundColor: selectedBenchmarkInfo.color,
                        }}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded">
                      Insufficient data
                    </div>
                  )}
                </div>
                {stats && (
                  <div className="w-32 text-xs text-muted-foreground text-right">
                    <span className={stats.median >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Median: {stats.median >= 0 ? '+' : ''}{stats.median.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-xs text-muted-foreground px-24">
          <span>{scaleMin.toFixed(0)}%</span>
          {scaleMin < 0 && scaleMax > 0 && <span>0%</span>}
          <span>{scaleMax.toFixed(0)}%</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 justify-center text-xs text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded border-2" style={{ borderColor: selectedBenchmarkInfo.color, backgroundColor: `${selectedBenchmarkInfo.color}20` }} />
            <span>IQR (25th-75th)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4" style={{ backgroundColor: selectedBenchmarkInfo.color }} />
            <span>Median</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rotate-45" style={{ backgroundColor: selectedBenchmarkInfo.color }} />
            <span>Mean</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5" style={{ backgroundColor: selectedBenchmarkInfo.color, opacity: 0.5 }} />
            <span>Range (Min-Max)</span>
          </div>
        </div>

        {/* Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Period</th>
                <th className="text-right py-2 font-medium">Min</th>
                <th className="text-right py-2 font-medium">Q1</th>
                <th className="text-right py-2 font-medium">Median</th>
                <th className="text-right py-2 font-medium">Q3</th>
                <th className="text-right py-2 font-medium">Max</th>
                <th className="text-right py-2 font-medium">Mean</th>
                <th className="text-right py-2 font-medium">Samples</th>
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => {
                const stats = boxPlotData[period.key];
                return (
                  <tr key={period.key} className="border-b last:border-0">
                    <td className="py-2 font-medium">{period.label}</td>
                    {stats ? (
                      <>
                        <td className={`text-right py-2 ${stats.min >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.min.toFixed(1)}%
                        </td>
                        <td className={`text-right py-2 ${stats.q1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.q1.toFixed(1)}%
                        </td>
                        <td className={`text-right py-2 font-semibold ${stats.median >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.median.toFixed(1)}%
                        </td>
                        <td className={`text-right py-2 ${stats.q3 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.q3.toFixed(1)}%
                        </td>
                        <td className={`text-right py-2 ${stats.max >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.max.toFixed(1)}%
                        </td>
                        <td className={`text-right py-2 ${stats.mean >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.mean.toFixed(1)}%
                        </td>
                        <td className="text-right py-2 text-muted-foreground">{stats.count}</td>
                      </>
                    ) : (
                      <td colSpan={7} className="text-center py-2 text-muted-foreground">Insufficient data</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <strong>How to read:</strong> The box shows the interquartile range (middle 50% of returns). 
          A narrow box indicates consistent returns, while a wide box shows high variability. 
          The median line shows the typical return, and whiskers extend to the min/max values.
          Compare different benchmarks to see relative risk-return profiles.
        </div>
      </CardContent>
    </Card>
  );
}
