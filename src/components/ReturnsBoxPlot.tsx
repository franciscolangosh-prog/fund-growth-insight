import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface ReturnsBoxPlotProps {
  data: PortfolioData[];
}

type BenchmarkKey = 'csi300' | 'sp500' | 'nasdaq' | 'sha' | 'she' | 'ftse100' | 'hangseng' | 'nikkei225' | 'tsx' | 'klse' | 'cac40' | 'dax' | 'sti' | 'asx200';

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
  { key: 'csi300', label: 'CSI 300 (China)', color: '#10b981' },
  { key: 'sp500', label: 'S&P 500 (USA)', color: '#ef4444' },
  { key: 'nasdaq', label: 'Nasdaq (USA)', color: '#8b5cf6' },
  { key: 'sha', label: 'Shanghai (China)', color: '#f59e0b' },
  { key: 'she', label: 'Shenzhen (China)', color: '#06b6d4' },
  { key: 'ftse100', label: 'FTSE 100 (UK)', color: '#ec4899' },
  { key: 'hangseng', label: 'Hang Seng (Hong Kong)', color: '#84cc16' },
  { key: 'nikkei225', label: 'Nikkei 225 (Japan)', color: '#f59e0b' },
  { key: 'tsx', label: 'TSX (Canada)', color: '#ef4444' },
  { key: 'klse', label: 'KLSE (Malaysia)', color: '#8b5cf6' },
  { key: 'cac40', label: 'CAC 40 (France)', color: '#3b82f6' },
  { key: 'dax', label: 'DAX (Germany)', color: '#10b981' },
  { key: 'sti', label: 'STI (Singapore)', color: '#ec4899' },
  { key: 'asx200', label: 'ASX 200 (Australia)', color: '#06b6d4' },
];

const FUND_COLOR = '#4338ca';

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

function calculateReturnsForKey(data: PortfolioData[], days: number, key: 'fund' | BenchmarkKey): number[] {
  const returns: number[] = [];
  const years = days / 252;

  for (let i = days; i < data.length; i += 20) {
    const startIdx = i - days;
    let startValue: number, endValue: number;

    if (key === 'fund') {
      startValue = data[startIdx].shareValue;
      endValue = data[i].shareValue;
    } else {
      startValue = data[startIdx][key] as number;
      endValue = data[i][key] as number;
    }

    if (startValue > 0 && endValue > 0) {
      const annualizedReturn = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
      returns.push(annualizedReturn);
    }
  }

  return returns;
}

export function ReturnsBoxPlot({ data }: ReturnsBoxPlotProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkKey>('csi300');

  const { fundData, benchmarkData } = useMemo(() => {
    const fundResults: Record<string, BoxPlotStats | null> = {};
    const benchmarkResults: Record<string, BoxPlotStats | null> = {};

    for (const period of PERIODS) {
      const { days, key } = period;
      if (data.length < days) {
        fundResults[key] = null;
        benchmarkResults[key] = null;
        continue;
      }

      const fundReturns = calculateReturnsForKey(data, days, 'fund');
      const benchmarkReturns = calculateReturnsForKey(data, days, selectedBenchmark);

      fundResults[key] = calculateBoxPlotStats(fundReturns);
      benchmarkResults[key] = calculateBoxPlotStats(benchmarkReturns);
    }

    return { fundData: fundResults, benchmarkData: benchmarkResults };
  }, [data, selectedBenchmark]);

  const selectedBenchmarkInfo = BENCHMARKS.find(b => b.key === selectedBenchmark)!;

  // Calculate the scale for the box plots
  const allValues = [
    ...Object.values(fundData),
    ...Object.values(benchmarkData)
  ]
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

  const renderBoxPlot = (stats: BoxPlotStats | null, color: string, yOffset: number) => {
    if (!stats) return null;

    return (
      <>
        {/* Whisker line (min to max) */}
        <div
          className="absolute h-0.5"
          style={{
            left: `${getPosition(stats.min)}%`,
            width: `${getPosition(stats.max) - getPosition(stats.min)}%`,
            backgroundColor: color,
            opacity: 0.5,
            top: `${yOffset}%`,
            transform: 'translateY(-50%)',
          }}
        />

        {/* Min whisker cap */}
        <div
          className="absolute w-0.5"
          style={{
            left: `${getPosition(stats.min)}%`,
            backgroundColor: color,
            height: '30%',
            top: `${yOffset - 15}%`,
          }}
        />

        {/* Max whisker cap */}
        <div
          className="absolute w-0.5"
          style={{
            left: `${getPosition(stats.max)}%`,
            backgroundColor: color,
            height: '30%',
            top: `${yOffset - 15}%`,
          }}
        />

        {/* Box (Q1 to Q3) */}
        <div
          className="absolute rounded border-2"
          style={{
            left: `${getPosition(stats.q1)}%`,
            width: `${getPosition(stats.q3) - getPosition(stats.q1)}%`,
            backgroundColor: `${color}20`,
            borderColor: color,
            height: '30%',
            top: `${yOffset - 15}%`,
          }}
        />

        {/* Median line */}
        <div
          className="absolute w-0.5"
          style={{
            left: `${getPosition(stats.median)}%`,
            backgroundColor: color,
            height: '30%',
            top: `${yOffset - 15}%`,
          }}
        />

        {/* Mean marker (diamond) */}
        <div
          className="absolute w-2 h-2 -translate-x-1/2 rotate-45"
          style={{
            left: `${getPosition(stats.mean)}%`,
            backgroundColor: color,
            top: `${yOffset}%`,
            transform: 'translateX(-50%) translateY(-50%) rotate(45deg)',
          }}
        />
      </>
    );
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Return Distribution Box Plot</CardTitle>
            <CardDescription>Compare your portfolio vs benchmark across rolling periods</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Compare with:</span>
            <Select value={selectedBenchmark} onValueChange={(v) => setSelectedBenchmark(v as BenchmarkKey)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BENCHMARKS.map(b => (
                  <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legend at top */}
        <div className="flex gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: FUND_COLOR }} />
            <span className="font-medium">My Portfolio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedBenchmarkInfo.color }} />
            <span className="font-medium">{selectedBenchmarkInfo.label}</span>
          </div>
        </div>

        {/* Box Plot Visualization */}
        <div className="space-y-2">
          {PERIODS.map(period => {
            const fundStats = fundData[period.key];
            const benchmarkStats = benchmarkData[period.key];
            const hasData = fundStats || benchmarkStats;

            return (
              <div key={period.key} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-muted-foreground">{period.label}</div>
                <div className="flex-1 relative h-16">
                  {hasData ? (
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

                      {/* Fund box plot (top) */}
                      {renderBoxPlot(fundStats, FUND_COLOR, 30)}

                      {/* Benchmark box plot (bottom) */}
                      {renderBoxPlot(benchmarkStats, selectedBenchmarkInfo.color, 70)}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded">
                      Insufficient data
                    </div>
                  )}
                </div>
                <div className="w-40 text-xs space-y-1">
                  {fundStats && (
                    <div className="flex justify-between">
                      <span style={{ color: FUND_COLOR }}>Fund:</span>
                      <span className={fundStats.median >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {fundStats.median >= 0 ? '+' : ''}{fundStats.median.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {benchmarkStats && (
                    <div className="flex justify-between">
                      <span style={{ color: selectedBenchmarkInfo.color }}>{selectedBenchmarkInfo.label}:</span>
                      <span className={benchmarkStats.median >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {benchmarkStats.median >= 0 ? '+' : ''}{benchmarkStats.median.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
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

        {/* Box plot legend */}
        <div className="flex flex-wrap gap-6 justify-center text-xs text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded border-2 border-muted-foreground bg-muted-foreground/10" />
            <span>IQR (25th-75th)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-muted-foreground" />
            <span>Median</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rotate-45 bg-muted-foreground" />
            <span>Mean</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-muted-foreground/50" />
            <span>Range (Min-Max)</span>
          </div>
        </div>

        {/* Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Period</th>
                <th className="text-left py-2 font-medium">Asset</th>
                <th className="text-right py-2 font-medium">Min</th>
                <th className="text-right py-2 font-medium">Q1</th>
                <th className="text-right py-2 font-medium">Median</th>
                <th className="text-right py-2 font-medium">Q3</th>
                <th className="text-right py-2 font-medium">Max</th>
                <th className="text-right py-2 font-medium">Mean</th>
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => {
                const fundStats = fundData[period.key];
                const benchmarkStats = benchmarkData[period.key];

                return (
                  <>
                    <tr key={`${period.key}-fund`} className="border-b">
                      <td rowSpan={2} className="py-2 font-medium align-middle">{period.label}</td>
                      <td className="py-2" style={{ color: FUND_COLOR }}>My Portfolio</td>
                      {fundStats ? (
                        <>
                          <td className={`text-right py-2 ${fundStats.min >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fundStats.min.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${fundStats.q1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fundStats.q1.toFixed(1)}%</td>
                          <td className={`text-right py-2 font-semibold ${fundStats.median >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fundStats.median.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${fundStats.q3 >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fundStats.q3.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${fundStats.max >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fundStats.max.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${fundStats.mean >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fundStats.mean.toFixed(1)}%</td>
                        </>
                      ) : (
                        <td colSpan={6} className="text-center py-2 text-muted-foreground">Insufficient data</td>
                      )}
                    </tr>
                    <tr key={`${period.key}-benchmark`} className="border-b">
                      <td className="py-2" style={{ color: selectedBenchmarkInfo.color }}>{selectedBenchmarkInfo.label}</td>
                      {benchmarkStats ? (
                        <>
                          <td className={`text-right py-2 ${benchmarkStats.min >= 0 ? 'text-green-600' : 'text-red-600'}`}>{benchmarkStats.min.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${benchmarkStats.q1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>{benchmarkStats.q1.toFixed(1)}%</td>
                          <td className={`text-right py-2 font-semibold ${benchmarkStats.median >= 0 ? 'text-green-600' : 'text-red-600'}`}>{benchmarkStats.median.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${benchmarkStats.q3 >= 0 ? 'text-green-600' : 'text-red-600'}`}>{benchmarkStats.q3.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${benchmarkStats.max >= 0 ? 'text-green-600' : 'text-red-600'}`}>{benchmarkStats.max.toFixed(1)}%</td>
                          <td className={`text-right py-2 ${benchmarkStats.mean >= 0 ? 'text-green-600' : 'text-red-600'}`}>{benchmarkStats.mean.toFixed(1)}%</td>
                        </>
                      ) : (
                        <td colSpan={6} className="text-center py-2 text-muted-foreground">Insufficient data</td>
                      )}
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <strong>How to read:</strong> Each row shows your portfolio (top, blue) vs the selected benchmark (bottom, colored).
          The box represents the middle 50% of returns. A narrower box means more consistent performance.
          Compare medians to see which performs better on a typical basis.
        </div>
      </CardContent>
    </Card>
  );
}
