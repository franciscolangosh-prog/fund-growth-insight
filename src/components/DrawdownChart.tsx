import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { PortfolioData } from "@/utils/portfolioAnalysis";
import { TrendingDown } from "lucide-react";

interface DrawdownChartProps {
  data: PortfolioData[];
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  const calculateDrawdownData = () => {
    if (data.length === 0) return [];
    
    let peak = data[0].shareValue;
    const drawdownData = data.map((item, index) => {
      if (item.shareValue > peak) {
        peak = item.shareValue;
      }
      const drawdown = ((item.shareValue - peak) / peak) * 100;
      return {
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        fullDate: item.date,
        shareValue: item.shareValue,
        peak: peak,
        drawdown: drawdown,
        runningMax: peak
      };
    });
    
    return drawdownData;
  };

  const chartData = calculateDrawdownData();
  const maxDrawdown = Math.min(...chartData.map(d => d.drawdown));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Drawdown Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-2xl font-bold text-red-600">
            {maxDrawdown.toFixed(2)}%
          </div>
          <div className="text-sm text-muted-foreground">
            Maximum Drawdown
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              label={{ value: 'Drawdown (%)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              domain={['dataMin', 0]}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'drawdown') return [`${value.toFixed(2)}%`, 'Drawdown'];
                if (name === 'shareValue') return [`¥${value.toFixed(4)}`, 'Share Value'];
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
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              fill="#fecaca"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Drawdown shows the peak-to-trough decline in portfolio value. Lower (more negative) values indicate larger losses from peak values.</p>
        </div>
      </CardContent>
    </Card>
  );
}