import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface DrawdownChartProps {
  data: PortfolioData[];
}

interface DrawdownDataPoint {
  date: string;
  drawdown: number;
  value: number;
  peak: number;
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  const { chartData, maxDrawdown, currentDrawdown, avgDrawdown, timeInDrawdown } = useMemo(() => {
    if (data.length < 2) {
      return { 
        chartData: [], 
        maxDrawdown: { value: 0, date: '' }, 
        currentDrawdown: 0,
        avgDrawdown: 0,
        timeInDrawdown: 0
      };
    }

    const drawdownData: DrawdownDataPoint[] = [];
    let peak = data[0].shareValue;
    let peakDate = data[0].date;
    let maxDD = { value: 0, date: '', peakDate: '' };
    let drawdownSum = 0;
    let drawdownDays = 0;

    for (let i = 0; i < data.length; i++) {
      const value = data[i].shareValue;
      
      if (value > peak) {
        peak = value;
        peakDate = data[i].date;
      }

      const drawdown = ((peak - value) / peak) * 100;
      
      if (drawdown > 0) {
        drawdownSum += drawdown;
        drawdownDays++;
      }

      if (drawdown > maxDD.value) {
        maxDD = { value: drawdown, date: data[i].date, peakDate };
      }

      // Sample every 7 days for performance
      if (i % 7 === 0 || i === data.length - 1) {
        drawdownData.push({
          date: new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          drawdown: -drawdown,
          value,
          peak,
        });
      }
    }

    const lastDrawdown = ((peak - data[data.length - 1].shareValue) / peak) * 100;
    const avgDD = drawdownDays > 0 ? drawdownSum / drawdownDays : 0;
    const timeInDD = (drawdownDays / data.length) * 100;

    return {
      chartData: drawdownData,
      maxDrawdown: maxDD,
      currentDrawdown: lastDrawdown,
      avgDrawdown: avgDD,
      timeInDrawdown: timeInDD,
    };
  }, [data]);

  type RechartsTooltipPayload<T> = Array<{ payload: T }>;
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: RechartsTooltipPayload<DrawdownDataPoint> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{point.date}</p>
          <p className="text-red-600">
            Drawdown: {point.drawdown.toFixed(2)}%
          </p>
          <p className="text-muted-foreground text-sm">
            Value: ¥{point.value.toFixed(4)}
          </p>
          <p className="text-muted-foreground text-sm">
            Peak: ¥{point.peak.toFixed(4)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Drawdown Analysis</CardTitle>
            <CardDescription>Peak-to-trough declines over time</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive">
              Max: -{maxDrawdown.value.toFixed(1)}%
            </Badge>
            <Badge variant={currentDrawdown > 5 ? "destructive" : "secondary"}>
              Current: -{currentDrawdown.toFixed(1)}%
            </Badge>
            <Badge variant="outline">
              Avg: -{avgDrawdown.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Maximum Drawdown</p>
            <p className="text-xl font-bold text-red-600">-{maxDrawdown.value.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">
              {maxDrawdown.date && new Date(maxDrawdown.date).toLocaleDateString()}
            </p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Current Drawdown</p>
            <p className="text-xl font-bold text-orange-600">-{currentDrawdown.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">From recent peak</p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Average Drawdown</p>
            <p className="text-xl font-bold text-yellow-600">-{avgDrawdown.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">When in drawdown</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Time in Drawdown</p>
            <p className="text-xl font-bold text-blue-600">{timeInDrawdown.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Of total period</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
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
              domain={['auto', 0]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={-10} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '-10%', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={-20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '-20%', position: 'right', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="drawdown" 
              stroke="#ef4444" 
              fill="#fee2e2"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <strong>Interpretation:</strong> The chart shows how far the fund fell from its previous peak at any point. 
          {maxDrawdown.value > 30 
            ? " This fund experienced significant drawdowns (>30%), indicating high volatility. Investors should be prepared for substantial temporary losses."
            : maxDrawdown.value > 20
              ? " Moderate drawdowns (20-30%) suggest typical equity-like risk. Suitable for investors with medium-term horizons."
              : " Relatively contained drawdowns (<20%) indicate good downside protection."}
        </div>
      </CardContent>
    </Card>
  );
}
