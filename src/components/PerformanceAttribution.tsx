import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PortfolioData, RiskMetrics } from "@/utils/portfolioAnalysis";
import { Target, TrendingUp } from "lucide-react";

interface PerformanceAttributionProps {
  data: PortfolioData[];
  riskMetrics: RiskMetrics;
  annualizedReturn: number;
  benchmarkReturns: {
    sha: number;
    she: number;
    csi300: number;
    avgBenchmark: number;
  };
}

export function PerformanceAttribution({ 
  data, 
  riskMetrics, 
  annualizedReturn, 
  benchmarkReturns 
}: PerformanceAttributionProps) {
  // Calculate performance attribution
  const calculateAttribution = () => {
    const totalReturn = annualizedReturn;
    const avgBenchmark = benchmarkReturns.avgBenchmark;
    
    // Risk-free rate assumption (2% annual)
    const riskFreeRate = 2;
    
    // Market return component (Beta * Market Return)
    const marketReturnComponent = riskMetrics.beta.csi300 * (benchmarkReturns.csi300 - riskFreeRate);
    
    // Alpha component (excess return after adjusting for market risk)
    const alphaComponent = riskMetrics.alpha.csi300;
    
    // Risk-free component
    const riskFreeComponent = riskFreeRate;
    
    // Unexplained component (residual)
    const unexplainedComponent = totalReturn - marketReturnComponent - alphaComponent - riskFreeComponent;
    
    return {
      totalReturn,
      riskFreeComponent,
      marketReturnComponent,
      alphaComponent,
      unexplainedComponent,
      benchmarkReturn: avgBenchmark
    };
  };

  const attribution = calculateAttribution();

  // Calculate rolling performance vs benchmark
  const calculateRollingPerformance = () => {
    const window = 90; // 90-day rolling window
    const results = [];
    
    for (let i = window; i < data.length; i++) {
      const portfolioReturn = ((data[i].shareValue - data[i - window].shareValue) / data[i - window].shareValue) * 100;
      const benchmarkReturn = ((data[i].csi300 - data[i - window].csi300) / data[i - window].csi300) * 100;
      
      results.push({
        date: new Date(data[i].date).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric'
        }),
        fullDate: data[i].date,
        portfolio: portfolioReturn,
        benchmark: benchmarkReturn,
        excess: portfolioReturn - benchmarkReturn
      });
    }
    
    return results;
  };

  const rollingData = calculateRollingPerformance();
  
  // Sample data more aggressively for cleaner visualization (every 20th point or monthly)
  const sampledRollingData = rollingData.filter((_, index) => 
    index % 20 === 0 || index === rollingData.length - 1
  );

  // Calculate conclusion for rolling performance
  const getRollingConclusion = () => {
    if (rollingData.length === 0) return '';
    
    const excessReturns = rollingData.map(d => d.excess);
    const avgExcess = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
    const latestExcess = excessReturns[excessReturns.length - 1];
    const positiveMonths = excessReturns.filter(r => r > 0).length;
    const winRate = (positiveMonths / excessReturns.length) * 100;
    
    const performance = avgExcess > 0 ? 'outperformed' : 'underperformed';
    const consistency = winRate > 60 ? 'consistently' : winRate > 40 ? 'moderately' : 'inconsistently';
    
    return `Over the rolling 90-day periods, the portfolio has ${performance} the CSI 300 benchmark by an average of ${Math.abs(avgExcess).toFixed(2)}% ${consistency} (win rate: ${winRate.toFixed(1)}%). Latest excess return: ${latestExcess >= 0 ? '+' : ''}${latestExcess.toFixed(2)}%.`;
  };

  // Performance attribution data for pie chart
  const attributionData = [
    { name: 'Risk-Free Rate', value: Math.abs(attribution.riskFreeComponent), color: '#10b981' },
    { name: 'Market Return', value: Math.abs(attribution.marketReturnComponent), color: '#3b82f6' },
    { name: 'Alpha (Skill)', value: Math.abs(attribution.alphaComponent), color: '#f59e0b' },
    { name: 'Unexplained', value: Math.abs(attribution.unexplainedComponent), color: '#6b7280' }
  ].filter(item => item.value > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Performance Attribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Attribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-2xl font-bold">
              {attribution.totalReturn.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Total Annualized Return
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={attributionData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              >
                {attributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Risk-Free Rate:</span>
              <span className={attribution.riskFreeComponent >= 0 ? "text-green-600" : "text-red-600"}>
                {attribution.riskFreeComponent >= 0 ? "+" : ""}{attribution.riskFreeComponent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Market Return (β×Market):</span>
              <span className={attribution.marketReturnComponent >= 0 ? "text-green-600" : "text-red-600"}>
                {attribution.marketReturnComponent >= 0 ? "+" : ""}{attribution.marketReturnComponent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Alpha (Skill):</span>
              <span className={attribution.alphaComponent >= 0 ? "text-green-600" : "text-red-600"}>
                {attribution.alphaComponent >= 0 ? "+" : ""}{attribution.alphaComponent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Unexplained:</span>
              <span className={attribution.unexplainedComponent >= 0 ? "text-green-600" : "text-red-600"}>
                {attribution.unexplainedComponent >= 0 ? "+" : ""}{attribution.unexplainedComponent.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rolling Performance vs Benchmark */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            90-Day Rolling Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-2xl font-bold">
              <span className={attribution.totalReturn - attribution.benchmarkReturn >= 0 ? "text-green-600" : "text-red-600"}>
                {attribution.totalReturn - attribution.benchmarkReturn >= 0 ? "+" : ""}
                {(attribution.totalReturn - attribution.benchmarkReturn).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Excess Return vs Benchmark
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sampledRollingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${(value as number).toFixed(2)}%`,
                  name === 'portfolio' ? 'Portfolio' : name === 'benchmark' ? 'CSI 300' : 'Excess'
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0] && payload[0].payload) {
                    const fullDate = new Date(payload[0].payload.fullDate);
                    return `Date: ${fullDate.toLocaleDateString('en-US', { 
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
                dataKey="portfolio" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                name="Portfolio"
              />
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                stroke="#6b7280" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="CSI 300"
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Conclusion Remarks */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Analysis</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getRollingConclusion()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}