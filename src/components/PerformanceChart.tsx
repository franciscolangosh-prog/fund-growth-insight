import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface PerformanceChartProps {
  data: PortfolioData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg max-h-96 overflow-y-auto">
        <p className="font-semibold mb-2">{dataPoint.date}</p>
        <div className="space-y-1">
          <p style={{ color: payload.find((p: any) => p.dataKey === 'Fund')?.color }}>
            Fund: {dataPoint.actualFund.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">China Markets</p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'SHA')?.color }}>
            SHA: {dataPoint.actualSHA.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'SHE')?.color }}>
            SHE: {dataPoint.actualSHE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'CSI300')?.color }}>
            CSI300: {dataPoint.actualCSI.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">US Markets</p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'SP500')?.color }}>
            S&P500: {dataPoint.actualSP500.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'Nasdaq')?.color }}>
            Nasdaq: {dataPoint.actualNasdaq.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">International</p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'FTSE100')?.color }}>
            FTSE100: {dataPoint.actualFTSE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'HangSeng')?.color }}>
            HangSeng: {dataPoint.actualHangSeng.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data
    .filter((_, index) => index % 30 === 0 || index === data.length - 1)
    .map(row => {
      const base = data[0];

      return {
        date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        Fund: Number(((row.shareValue / base.shareValue - 1) * 100).toFixed(2)),
        SHA: Number(((row.sha / base.sha - 1) * 100).toFixed(2)),
        SHE: Number(((row.she / base.she - 1) * 100).toFixed(2)),
        CSI300: Number(((row.csi300 / base.csi300 - 1) * 100).toFixed(2)),
        SP500: base.sp500 > 0 ? Number(((row.sp500 / base.sp500 - 1) * 100).toFixed(2)) : 0,
        Nasdaq: base.nasdaq > 0 ? Number(((row.nasdaq / base.nasdaq - 1) * 100).toFixed(2)) : 0,
        FTSE100: base.ftse100 > 0 ? Number(((row.ftse100 / base.ftse100 - 1) * 100).toFixed(2)) : 0,
        HangSeng: base.hangseng > 0 ? Number(((row.hangseng / base.hangseng - 1) * 100).toFixed(2)) : 0,
        // Actual values for tooltip
        actualFund: row.shareValue,
        actualSHA: row.sha,
        actualSHE: row.she,
        actualCSI: row.csi300,
        actualSP500: row.sp500,
        actualNasdaq: row.nasdaq,
        actualFTSE: row.ftse100,
        actualHangSeng: row.hangseng,
      };
    });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Global Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} 
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Fund - Primary color, bold */}
            <Line type="monotone" dataKey="Fund" stroke="hsl(var(--primary))" strokeWidth={3} name="Fund" />
            
            {/* China Markets - Green shades */}
            <Line type="monotone" dataKey="SHA" stroke="#10b981" strokeWidth={1.5} name="SHA" />
            <Line type="monotone" dataKey="SHE" stroke="#34d399" strokeWidth={1.5} name="SHE" />
            <Line type="monotone" dataKey="CSI300" stroke="#6ee7b7" strokeWidth={1.5} name="CSI300" />
            
            {/* US Markets - Blue shades */}
            <Line type="monotone" dataKey="SP500" stroke="#3b82f6" strokeWidth={1.5} name="S&P500" />
            <Line type="monotone" dataKey="Nasdaq" stroke="#60a5fa" strokeWidth={1.5} name="Nasdaq" />
            
            {/* International - Orange/Purple shades */}
            <Line type="monotone" dataKey="FTSE100" stroke="#f97316" strokeWidth={1.5} name="FTSE100" />
            <Line type="monotone" dataKey="HangSeng" stroke="#a855f7" strokeWidth={1.5} name="HangSeng" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
