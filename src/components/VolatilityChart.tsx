import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface VolatilityChartProps {
  data: PortfolioData[];
}

type VolatilityWindow = '30D' | '60D' | '90D';

export function VolatilityChart({ data }: VolatilityChartProps) {
  const [window, setWindow] = useState<VolatilityWindow>('30D');

  const windowDays: Record<VolatilityWindow, number> = {
    '30D': 30,
    '60D': 60,
    '90D': 90,
  };

  type VolatilityPoint = {
    date: string;
    fund: number;
    csi300: number;
    sp500?: number;
  };

  const { chartData, stats } = useMemo(() => {
    const days = windowDays[window];
    
    if (data.length < days + 10) {
      return { chartData: [], stats: { fundAvg: 0, fundCurrent: 0, csi300Avg: 0, fundMax: 0, fundMin: 0 } };
    }

    const calculateRollingVolatility = (values: number[], windowSize: number): number[] => {
      const volatilities: number[] = [];
      
      for (let i = windowSize; i < values.length; i++) {
        const windowValues = values.slice(i - windowSize, i);
        const returns: number[] = [];
        
        for (let j = 1; j < windowValues.length; j++) {
          if (windowValues[j] > 0 && windowValues[j-1] > 0) {
            returns.push((windowValues[j] - windowValues[j-1]) / windowValues[j-1]);
          }
        }
        
        if (returns.length > 0) {
          const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
          const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
          const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
          const dailyVol = Math.sqrt(variance);
          const annualizedVol = dailyVol * Math.sqrt(252) * 100;
          volatilities.push(annualizedVol);
        } else {
          volatilities.push(0);
        }
      }
      
      return volatilities;
    };

    const fundValues = data.map(d => d.shareValue);
    const csi300Values = data.map(d => d.csi300);
    const sp500Values = data.map(d => d.sp500);

    const fundVol = calculateRollingVolatility(fundValues, days);
    const csi300Vol = calculateRollingVolatility(csi300Values, days);
    const sp500Vol = calculateRollingVolatility(sp500Values, days);

    const chartPoints: VolatilityPoint[] = [];

    for (let i = 0; i < fundVol.length; i += 7) {
      const dataIndex = i + days;
      if (dataIndex < data.length) {
        chartPoints.push({
          date: new Date(data[dataIndex].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          fund: Number(fundVol[i].toFixed(1)),
          csi300: Number(csi300Vol[i].toFixed(1)),
          sp500: sp500Vol[i] > 0 ? Number(sp500Vol[i].toFixed(1)) : undefined,
        });
      }
    }

    if (fundVol.length > 0) {
      const lastIdx = fundVol.length - 1;
      const dataIndex = lastIdx + days;
      if (dataIndex < data.length) {
        chartPoints.push({
          date: new Date(data[dataIndex].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          fund: Number(fundVol[lastIdx].toFixed(1)),
          csi300: Number(csi300Vol[lastIdx].toFixed(1)),
          sp500: sp500Vol[lastIdx] > 0 ? Number(sp500Vol[lastIdx].toFixed(1)) : undefined,
        });
      }
    }

    const fundVolFiltered = fundVol.filter(v => v > 0);
    const csi300VolFiltered = csi300Vol.filter(v => v > 0);

    return {
      chartData: chartPoints,
      stats: {
        fundAvg: fundVolFiltered.length > 0 ? fundVolFiltered.reduce((a, b) => a + b, 0) / fundVolFiltered.length : 0,
        fundCurrent: fundVol.length > 0 ? fundVol[fundVol.length - 1] : 0,
        csi300Avg: csi300VolFiltered.length > 0 ? csi300VolFiltered.reduce((a, b) => a + b, 0) / csi300VolFiltered.length : 0,
        fundMax: fundVolFiltered.length > 0 ? Math.max(...fundVolFiltered) : 0,
        fundMin: fundVolFiltered.length > 0 ? Math.min(...fundVolFiltered) : 0,
      },
    };
  }, [data, window]);

  type RechartsTooltipPayload<T> = Array<{ payload: T }>;
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: RechartsTooltipPayload<VolatilityPoint> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{point.date}</p>
          <div className="space-y-1 text-sm">
            <p style={{ color: '#4338ca' }}>Fund: {point.fund.toFixed(1)}%</p>
            <p style={{ color: '#10b981' }}>CSI300: {point.csi300.toFixed(1)}%</p>
            {point.sp500 !== undefined && (
              <p style={{ color: '#ef4444' }}>S&P500: {point.sp500.toFixed(1)}%</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasEnoughData = data.length >= windowDays[window] + 10;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Rolling Volatility
            </CardTitle>
            <CardDescription>Annualized volatility over time vs benchmarks</CardDescription>
          </div>
          <Tabs value={window} onValueChange={(v) => setWindow(v as VolatilityWindow)}>
            <TabsList>
              <TabsTrigger value="30D">30 Days</TabsTrigger>
              <TabsTrigger value="60D">60 Days</TabsTrigger>
              <TabsTrigger value="90D">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasEnoughData ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Not enough data for {window} rolling volatility analysis.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Current ({window})</p>
                <p className="text-xl font-bold text-blue-600">{stats.fundCurrent.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-xl font-bold text-purple-600">{stats.fundAvg.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Peak Volatility</p>
                <p className="text-xl font-bold text-red-600">{stats.fundMax.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Lowest Volatility</p>
                <p className="text-xl font-bold text-green-600">{stats.fundMin.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">vs CSI300 Avg</p>
                <p className={`text-xl font-bold ${stats.fundAvg < stats.csi300Avg ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.fundAvg < stats.csi300Avg ? 'Lower' : 'Higher'}
                </p>
                <p className="text-xs text-muted-foreground">{Math.abs(stats.fundAvg - stats.csi300Avg).toFixed(1)}%</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                  label={{ value: 'Annualized Volatility (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate (20%)', position: 'right', fontSize: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="fund" 
                  stroke="#4338ca" 
                  strokeWidth={2.5}
                  dot={false}
                  name="Fund"
                />
                <Line 
                  type="monotone" 
                  dataKey="csi300" 
                  stroke="#10b981" 
                  strokeWidth={1.5}
                  dot={false}
                  name="CSI300"
                />
                <Line 
                  type="monotone" 
                  dataKey="sp500" 
                  stroke="#ef4444" 
                  strokeWidth={1.5}
                  dot={false}
                  name="S&P500"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <strong>Understanding Volatility:</strong> Volatility measures how much returns fluctuate. 
              Lower volatility means more stable returns. {stats.fundCurrent < 15 
                ? "Current volatility is low - the fund is experiencing relatively stable performance."
                : stats.fundCurrent < 25
                  ? "Current volatility is moderate - typical for equity investments."
                  : "Current volatility is elevated - expect larger price swings."}
              {' '}The fund's average volatility is {stats.fundAvg < stats.csi300Avg ? 'lower' : 'higher'} than CSI300, 
              suggesting {stats.fundAvg < stats.csi300Avg ? 'more stable' : 'more variable'} returns.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
