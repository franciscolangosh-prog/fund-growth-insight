import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RollingMetrics, PortfolioData } from "@/utils/portfolioAnalysis";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface RollingMetricsChartProps {
  rollingMetrics: RollingMetrics[];
  portfolioData: PortfolioData[];
}

export function RollingMetricsChart({ rollingMetrics, portfolioData }: RollingMetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'volatility' | 'sharpe' | 'correlation'>('volatility');
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '60d' | '90d'>('30d');

  const formatData = () => {
    return rollingMetrics.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      fullDate: item.date,
      // Portfolio metrics
      volatility30d: item.volatility30d,
      volatility60d: item.volatility60d,
      volatility90d: item.volatility90d,
      sharpe30d: item.sharpe30d,
      sharpe60d: item.sharpe60d,
      sharpe90d: item.sharpe90d,
      return30d: item.return30d,
      return60d: item.return60d,
      return90d: item.return90d,
      correlation30d: item.correlation30d.csi300,
      correlation60d: item.correlation60d.csi300,
      correlation90d: item.correlation90d.csi300,
    }));
  };

  // Calculate benchmark rolling returns for comparison
  const calculateBenchmarkReturns = (period: '30d' | '60d' | '90d') => {
    const days = period === '30d' ? 30 : period === '60d' ? 60 : 90;
    return rollingMetrics.map((metric, idx) => {
      const dataIdx = portfolioData.findIndex(d => d.date === metric.date);
      if (dataIdx < days) return { sha: 0, she: 0, csi300: 0 };
      
      const current = portfolioData[dataIdx];
      const previous = portfolioData[dataIdx - days];
      
      return {
        sha: ((current.sha - previous.sha) / previous.sha) * 100,
        she: ((current.she - previous.she) / previous.she) * 100,
        csi300: ((current.csi300 - previous.csi300) / previous.csi300) * 100,
      };
    });
  };

  const getChartData = () => {
    const data = formatData();
    const benchmarkReturns = calculateBenchmarkReturns(selectedPeriod);
    
    return data.map((item, idx) => ({
      ...item,
      portfolioValue: selectedMetric === 'volatility' 
        ? item[`volatility${selectedPeriod}` as keyof typeof item] as number
        : selectedMetric === 'sharpe'
        ? item[`sharpe${selectedPeriod}` as keyof typeof item] as number
        : item[`correlation${selectedPeriod}` as keyof typeof item] as number,
      // For return comparison, add benchmark data
      portfolioReturn: item[`return${selectedPeriod}` as keyof typeof item] as number,
      csi300Return: benchmarkReturns[idx]?.csi300 || 0,
    }));
  };

  const getYAxisLabel = () => {
    switch (selectedMetric) {
      case 'volatility': return 'Volatility (%)';
      case 'sharpe': return 'Sharpe Ratio';
      case 'correlation': return 'Correlation';
      default: return '';
    }
  };

  const getTitle = () => {
    const period = selectedPeriod === '30d' ? '30-Day' : selectedPeriod === '60d' ? '60-Day' : '90-Day';
    switch (selectedMetric) {
      case 'volatility': return `${period} Rolling Volatility`;
      case 'sharpe': return `${period} Rolling Sharpe Ratio`;
      case 'correlation': return `${period} Rolling Correlation vs CSI 300`;
      default: return '';
    }
  };

  // Generate conclusion based on the metric and data
  const getConclusion = useMemo(() => {
    const data = formatData();
    const benchmarkReturns = calculateBenchmarkReturns(selectedPeriod);
    
    const chartData = data.map((item, idx) => ({
      ...item,
      portfolioValue: selectedMetric === 'volatility' 
        ? item[`volatility${selectedPeriod}` as keyof typeof item] as number
        : selectedMetric === 'sharpe'
        ? item[`sharpe${selectedPeriod}` as keyof typeof item] as number
        : item[`correlation${selectedPeriod}` as keyof typeof item] as number,
      portfolioReturn: item[`return${selectedPeriod}` as keyof typeof item] as number,
      csi300Return: benchmarkReturns[idx]?.csi300 || 0,
    }));

    if (chartData.length === 0) return '';

    const values = chartData.map(d => d.portfolioValue).filter(v => !isNaN(v) && v !== 0);
    if (values.length === 0) return '';

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const period = selectedPeriod === '30d' ? '30-day' : selectedPeriod === '60d' ? '60-day' : '90-day';

    if (selectedMetric === 'volatility') {
      const trend = latest > avg ? 'increased' : 'decreased';
      const level = latest > 25 ? 'high' : latest > 15 ? 'moderate' : 'low';
      return `The portfolio's ${period} rolling volatility has ${trend} to ${latest.toFixed(2)}% (avg: ${avg.toFixed(2)}%), indicating ${level} risk levels. The volatility ranged from ${min.toFixed(2)}% to ${max.toFixed(2)}% during this period.`;
    } else if (selectedMetric === 'sharpe') {
      const trend = latest > avg ? 'improved' : 'declined';
      const quality = latest > 1.5 ? 'excellent' : latest > 1.0 ? 'good' : latest > 0.5 ? 'acceptable' : 'poor';
      const portfolioReturns = chartData.map(d => d.portfolioReturn).filter(v => !isNaN(v));
      const benchmarkReturns = chartData.map(d => d.csi300Return).filter(v => !isNaN(v));
      const avgPortfolioReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
      const avgBenchmarkReturn = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
      const outperformance = avgPortfolioReturn > avgBenchmarkReturn ? 'outperforming' : 'underperforming';
      return `The ${period} rolling Sharpe ratio has ${trend} to ${latest.toFixed(3)} (avg: ${avg.toFixed(3)}), indicating ${quality} risk-adjusted returns. The portfolio is ${outperformance} the CSI 300 index with an average ${period} return of ${avgPortfolioReturn.toFixed(2)}% vs ${avgBenchmarkReturn.toFixed(2)}%.`;
    } else {
      const trend = latest > avg ? 'increased' : 'decreased';
      const strength = Math.abs(latest) > 0.8 ? 'very strong' : Math.abs(latest) > 0.6 ? 'strong' : Math.abs(latest) > 0.4 ? 'moderate' : 'weak';
      return `The ${period} rolling correlation with CSI 300 has ${trend} to ${latest.toFixed(3)} (avg: ${avg.toFixed(3)}), showing ${strength} correlation with the market index. This suggests the portfolio's ${Math.abs(latest) > 0.6 ? 'high' : 'moderate'} sensitivity to market movements.`;
    }
  }, [selectedMetric, selectedPeriod, rollingMetrics, portfolioData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            <Button
              variant={selectedMetric === 'volatility' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('volatility')}
            >
              Volatility
            </Button>
            <Button
              variant={selectedMetric === 'sharpe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('sharpe')}
            >
              Sharpe Ratio
            </Button>
            <Button
              variant={selectedMetric === 'correlation' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('correlation')}
            >
              Correlation
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant={selectedPeriod === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('30d')}
            >
              30D
            </Button>
            <Button
              variant={selectedPeriod === '60d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('60d')}
            >
              60D
            </Button>
            <Button
              variant={selectedPeriod === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('90d')}
            >
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Portfolio') {
                  return [
                    selectedMetric === 'volatility' ? `${value.toFixed(2)}%` : value.toFixed(3),
                    'Portfolio'
                  ];
                } else if (name === 'CSI 300') {
                  return [`${value.toFixed(2)}%`, 'CSI 300'];
                }
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0] && payload[0].payload) {
                  const fullDate = new Date(payload[0].payload.fullDate);
                  return `Date: ${fullDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}`;
                }
                return `Date: ${label}`;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="portfolioValue" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Portfolio"
            />
            {selectedMetric === 'sharpe' && (
              <Line 
                type="monotone" 
                dataKey="csi300Return" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="CSI 300"
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Conclusion Remarks */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Analysis</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getConclusion}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}