import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface RollingReturnsChartProps {
  data: PortfolioData[];
}

type RollingPeriod = '3Y' | '5Y' | '8Y';

export function RollingReturnsChart({ data }: RollingReturnsChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<RollingPeriod>('3Y');

  const periodDays: Record<RollingPeriod, number> = {
    '3Y': 252 * 3,
    '5Y': 252 * 5,
    '8Y': 252 * 8,
  };

  const { chartData, stats } = useMemo(() => {
    const days = periodDays[selectedPeriod];
    
    if (data.length < days) {
      return { 
        chartData: [], 
        stats: { min: 0, max: 0, avg: 0, current: 0, positivePercent: 0 } 
      };
    }

    const rollingData: Array<{
      date: string;
      fundReturn: number;
      csi300Return: number;
      sp500Return?: number;
    }> = [];

    let minReturn = Infinity;
    let maxReturn = -Infinity;
    let sumReturn = 0;
    let positiveCount = 0;
    let totalCount = 0;

    // Calculate rolling returns every 30 days for performance
    for (let i = days; i < data.length; i += 30) {
      const endDate = data[i].date;
      const startIdx = i - days;
      
      // Fund rolling return (annualized)
      const fundStartValue = data[startIdx].shareValue;
      const fundEndValue = data[i].shareValue;
      const years = days / 252;
      const fundReturn = (Math.pow(fundEndValue / fundStartValue, 1 / years) - 1) * 100;

      // CSI300 rolling return
      const csi300StartValue = data[startIdx].csi300;
      const csi300EndValue = data[i].csi300;
      const csi300Return = csi300StartValue > 0 
        ? (Math.pow(csi300EndValue / csi300StartValue, 1 / years) - 1) * 100 
        : 0;

      // S&P500 rolling return (if available)
      const sp500StartValue = data[startIdx].sp500;
      const sp500EndValue = data[i].sp500;
      const sp500Return = sp500StartValue > 0 && sp500EndValue > 0
        ? (Math.pow(sp500EndValue / sp500StartValue, 1 / years) - 1) * 100
        : undefined;

      rollingData.push({
        date: new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        fundReturn: Number(fundReturn.toFixed(2)),
        csi300Return: Number(csi300Return.toFixed(2)),
        sp500Return: sp500Return !== undefined ? Number(sp500Return.toFixed(2)) : undefined,
      });

      minReturn = Math.min(minReturn, fundReturn);
      maxReturn = Math.max(maxReturn, fundReturn);
      sumReturn += fundReturn;
      if (fundReturn > 0) positiveCount++;
      totalCount++;
    }

    // Add final data point
    if (data.length >= days) {
      const i = data.length - 1;
      const startIdx = i - days;
      const years = days / 252;
      
      const fundReturn = (Math.pow(data[i].shareValue / data[startIdx].shareValue, 1 / years) - 1) * 100;
      const csi300Return = data[startIdx].csi300 > 0 
        ? (Math.pow(data[i].csi300 / data[startIdx].csi300, 1 / years) - 1) * 100 
        : 0;

      if (rollingData.length === 0 || rollingData[rollingData.length - 1].date !== new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })) {
        const sp500Return = data[startIdx].sp500 > 0 && data[i].sp500 > 0
          ? (Math.pow(data[i].sp500 / data[startIdx].sp500, 1 / years) - 1) * 100
          : undefined;

        rollingData.push({
          date: new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          fundReturn: Number(fundReturn.toFixed(2)),
          csi300Return: Number(csi300Return.toFixed(2)),
          sp500Return: sp500Return !== undefined ? Number(sp500Return.toFixed(2)) : undefined,
        });

        minReturn = Math.min(minReturn, fundReturn);
        maxReturn = Math.max(maxReturn, fundReturn);
        sumReturn += fundReturn;
        if (fundReturn > 0) positiveCount++;
        totalCount++;
      }
    }

    return {
      chartData: rollingData,
      stats: {
        min: minReturn === Infinity ? 0 : minReturn,
        max: maxReturn === -Infinity ? 0 : maxReturn,
        avg: totalCount > 0 ? sumReturn / totalCount : 0,
        current: rollingData.length > 0 ? rollingData[rollingData.length - 1].fundReturn : 0,
        positivePercent: totalCount > 0 ? (positiveCount / totalCount) * 100 : 0,
      },
    };
  }, [data, selectedPeriod]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{point.date}</p>
          <p style={{ color: '#4338ca' }}>
            Fund: {point.fundReturn >= 0 ? '+' : ''}{point.fundReturn.toFixed(2)}%
          </p>
          <p style={{ color: '#10b981' }}>
            CSI300: {point.csi300Return >= 0 ? '+' : ''}{point.csi300Return.toFixed(2)}%
          </p>
          {point.sp500Return !== undefined && (
            <p style={{ color: '#ef4444' }}>
              S&P500: {point.sp500Return >= 0 ? '+' : ''}{point.sp500Return.toFixed(2)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const hasEnoughData = data.length >= periodDays[selectedPeriod];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Rolling Returns</CardTitle>
            <CardDescription>Annualized returns over rolling periods - evaluates consistency</CardDescription>
          </div>
          <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as RollingPeriod)}>
            <TabsList>
              <TabsTrigger value="3Y">3 Year</TabsTrigger>
              <TabsTrigger value="5Y">5 Year</TabsTrigger>
              <TabsTrigger value="8Y">8 Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasEnoughData ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Not enough data for {selectedPeriod} rolling returns. Need at least {Math.ceil(periodDays[selectedPeriod] / 252)} years of data.
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Current {selectedPeriod}</p>
                <p className={`text-xl font-bold ${stats.current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.current >= 0 ? '+' : ''}{stats.current.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Best {selectedPeriod}</p>
                <p className="text-xl font-bold text-green-600">+{stats.max.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Worst {selectedPeriod}</p>
                <p className="text-xl font-bold text-red-600">{stats.min.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Average {selectedPeriod}</p>
                <p className={`text-xl font-bold ${stats.avg >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {stats.avg >= 0 ? '+' : ''}{stats.avg.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Positive Periods</p>
                <p className="text-xl font-bold text-yellow-600">{stats.positivePercent.toFixed(0)}%</p>
              </div>
            </div>

            {/* Chart */}
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
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="fundReturn" 
                  stroke="#4338ca" 
                  strokeWidth={2.5}
                  dot={false}
                  name="Fund"
                />
                <Line 
                  type="monotone" 
                  dataKey="csi300Return" 
                  stroke="#10b981" 
                  strokeWidth={1.5}
                  dot={false}
                  name="CSI300"
                />
                <Line 
                  type="monotone" 
                  dataKey="sp500Return" 
                  stroke="#ef4444" 
                  strokeWidth={1.5}
                  dot={false}
                  name="S&P500"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Interpretation */}
            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <strong>What this shows:</strong> Rolling returns smooth out short-term noise and show how consistent 
              performance has been over time. A fund that maintains positive rolling returns across different market 
              conditions demonstrates resilience. {stats.positivePercent >= 80 
                ? "This fund has been positive in most rolling periods - excellent consistency!"
                : stats.positivePercent >= 60
                  ? "Good consistency with majority positive periods."
                  : "Performance varies significantly across different periods."}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
