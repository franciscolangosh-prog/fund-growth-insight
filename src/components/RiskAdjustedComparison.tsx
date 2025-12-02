import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Scale, TrendingUp, Shield } from "lucide-react";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface RiskAdjustedComparisonProps {
  data: PortfolioData[];
}

interface RiskMetrics {
  name: string;
  sharpeRatio: number;
  sortinoRatio: number;
  annualizedReturn: number;
  volatility: number;
  color: string;
}

export function RiskAdjustedComparison({ data }: RiskAdjustedComparisonProps) {
  const metrics = useMemo(() => {
    if (data.length < 252) {
      return [];
    }

    const riskFreeRate = 3; // 3% annual risk-free rate
    const dailyRiskFreeRate = riskFreeRate / 100 / 252;

    const calculateMetrics = (
      values: number[], 
      name: string, 
      color: string
    ): RiskMetrics | null => {
      if (values.length < 252 || values[0] === 0) return null;

      // Calculate daily returns
      const dailyReturns: number[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i] > 0 && values[i-1] > 0) {
          dailyReturns.push((values[i] - values[i-1]) / values[i-1]);
        }
      }

      if (dailyReturns.length < 100) return null;

      const n = dailyReturns.length;
      const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / n;

      // Volatility
      const squaredDiffs = dailyReturns.map(r => Math.pow(r - meanReturn, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
      const dailyVolatility = Math.sqrt(variance);
      const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100;

      // Annualized return
      const totalReturn = values[values.length - 1] / values[0];
      const years = n / 252;
      const annualizedReturn = (Math.pow(totalReturn, 1 / years) - 1) * 100;

      // Sharpe Ratio
      const excessReturn = annualizedReturn - riskFreeRate;
      const sharpeRatio = annualizedVolatility !== 0 ? excessReturn / annualizedVolatility : 0;

      // Sortino Ratio (downside deviation)
      const negativeReturns = dailyReturns.filter(r => r < dailyRiskFreeRate);
      const downsideSquaredDiffs = negativeReturns.map(r => Math.pow(r - dailyRiskFreeRate, 2));
      const downsideVariance = downsideSquaredDiffs.length > 0 
        ? downsideSquaredDiffs.reduce((a, b) => a + b, 0) / downsideSquaredDiffs.length 
        : 0;
      const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252) * 100;
      const sortinoRatio = downsideDeviation !== 0 ? excessReturn / downsideDeviation : 0;

      return {
        name,
        sharpeRatio,
        sortinoRatio,
        annualizedReturn,
        volatility: annualizedVolatility,
        color,
      };
    };

    const results: RiskMetrics[] = [];

    // Fund
    const fundMetrics = calculateMetrics(data.map(d => d.shareValue), 'Fund', '#4338ca');
    if (fundMetrics) results.push(fundMetrics);

    // CSI300
    const csi300Metrics = calculateMetrics(data.map(d => d.csi300), 'CSI300', '#10b981');
    if (csi300Metrics) results.push(csi300Metrics);

    // SHA
    const shaMetrics = calculateMetrics(data.map(d => d.sha), 'SHA', '#34d399');
    if (shaMetrics) results.push(shaMetrics);

    // S&P500
    const sp500Metrics = calculateMetrics(data.map(d => d.sp500), 'S&P500', '#ef4444');
    if (sp500Metrics) results.push(sp500Metrics);

    // Nasdaq
    const nasdaqMetrics = calculateMetrics(data.map(d => d.nasdaq), 'Nasdaq', '#f59e0b');
    if (nasdaqMetrics) results.push(nasdaqMetrics);

    return results;
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p>Sharpe Ratio: <strong>{data.sharpeRatio.toFixed(2)}</strong></p>
            <p>Sortino Ratio: <strong>{data.sortinoRatio.toFixed(2)}</strong></p>
            <p>Return: <strong>{data.annualizedReturn.toFixed(1)}%</strong></p>
            <p>Volatility: <strong>{data.volatility.toFixed(1)}%</strong></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const fundMetrics = metrics.find(m => m.name === 'Fund');
  const bestSharpe = metrics.reduce((best, m) => m.sharpeRatio > best.sharpeRatio ? m : best, metrics[0]);
  const fundRank = [...metrics].sort((a, b) => b.sharpeRatio - a.sharpeRatio).findIndex(m => m.name === 'Fund') + 1;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              Risk-Adjusted Performance Comparison
            </CardTitle>
            <CardDescription>
              Compare Sharpe ratios across indices - the true measure of risk-adjusted returns
            </CardDescription>
          </div>
          {fundMetrics && (
            <div className="flex gap-2">
              <Badge variant={fundRank === 1 ? "default" : "secondary"}>
                Fund Rank: #{fundRank} of {metrics.length}
              </Badge>
              <Badge variant={fundMetrics.sharpeRatio >= 1 ? "default" : "destructive"}>
                Sharpe: {fundMetrics.sharpeRatio.toFixed(2)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Not enough data for risk-adjusted comparison. Need at least 1 year of data.
          </div>
        ) : (
          <>
            {/* Sharpe Ratio Chart */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sharpe Ratio Comparison
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={['auto', 'auto']} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={1} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Good (1.0)', position: 'top', fontSize: 10 }} />
                  <Bar dataKey="sharpeRatio" radius={[0, 4, 4, 0]}>
                    {metrics.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'Fund' ? '#4338ca' : entry.color}
                        opacity={entry.name === 'Fund' ? 1 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sortino Ratio Chart */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sortino Ratio Comparison (Downside Risk Only)
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={['auto', 'auto']} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={1} stroke="#22c55e" strokeDasharray="3 3" />
                  <Bar dataKey="sortinoRatio" radius={[0, 4, 4, 0]}>
                    {metrics.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'Fund' ? '#4338ca' : entry.color}
                        opacity={entry.name === 'Fund' ? 1 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Index</th>
                    <th className="p-2 text-right">Sharpe</th>
                    <th className="p-2 text-right">Sortino</th>
                    <th className="p-2 text-right">Return</th>
                    <th className="p-2 text-right">Volatility</th>
                    <th className="p-2 text-right">Return/Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].sort((a, b) => b.sharpeRatio - a.sharpeRatio).map((m, idx) => (
                    <tr 
                      key={m.name} 
                      className={`border-b ${m.name === 'Fund' ? 'bg-indigo-50 dark:bg-indigo-950/30 font-semibold' : ''}`}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                          {m.name}
                          {idx === 0 && <Badge className="text-xs">Best</Badge>}
                        </div>
                      </td>
                      <td className={`p-2 text-right ${m.sharpeRatio >= 1 ? 'text-green-600' : m.sharpeRatio >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {m.sharpeRatio.toFixed(2)}
                      </td>
                      <td className={`p-2 text-right ${m.sortinoRatio >= 1 ? 'text-green-600' : m.sortinoRatio >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {m.sortinoRatio.toFixed(2)}
                      </td>
                      <td className={`p-2 text-right ${m.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.annualizedReturn >= 0 ? '+' : ''}{m.annualizedReturn.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right">{m.volatility.toFixed(1)}%</td>
                      <td className="p-2 text-right">
                        {(m.annualizedReturn / m.volatility).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interpretation */}
            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              <strong>Understanding Risk-Adjusted Returns:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>Sharpe Ratio</strong>: Measures excess return per unit of total risk. &gt;1 is good, &gt;2 is excellent.</li>
                <li><strong>Sortino Ratio</strong>: Like Sharpe but only considers downside volatility. Better for asymmetric returns.</li>
                <li>
                  {fundMetrics && bestSharpe && (
                    fundMetrics.name === bestSharpe.name 
                      ? "The fund has the best risk-adjusted return among all compared indices!"
                      : `The fund ranks #${fundRank} in risk-adjusted returns. ${bestSharpe.name} has the highest Sharpe ratio.`
                  )}
                </li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
