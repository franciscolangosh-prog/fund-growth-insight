import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface PerformanceChartProps {
  data: PortfolioData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    // Extract actual values from payload datapoint
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">{dataPoint.date}</p>
        <p style={{ color: payload[0].color }}>
          Fund Value: {dataPoint.actualFund.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p style={{ color: payload[1]?.color }}>
          Shanghai Composite: {dataPoint.actualSHA.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p style={{ color: payload[2]?.color }}>
          Shenzhen Component: {dataPoint.actualSHE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p style={{ color: payload[3]?.color }}>
          CSI 300: {dataPoint.actualCSI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Use consistent sampling every 30 points to show full data range
  const chartData = data
    .filter((_, index) => index % 30 === 0 || index === data.length - 1)
    .map(row => {
      const baseShare = data[0].shareValue;
      const baseSHA = data[0].sha;
      const baseSHE = data[0].she;
      const baseCSI = data[0].csi300;

      return {
        date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        Fund: Number(((row.shareValue / baseShare - 1) * 100).toFixed(2)),
        "Shanghai Composite": Number(((row.sha / baseSHA - 1) * 100).toFixed(2)),
        "Shenzhen Component": Number(((row.she / baseSHE - 1) * 100).toFixed(2)),
        "CSI 300": Number(((row.csi300 / baseCSI - 1) * 100).toFixed(2)),
        // Store actual values for tooltip
        actualFund: row.shareValue,
        actualSHA: row.sha,
        actualSHE: row.she,
        actualCSI: row.csi300,
      };
    });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Historical Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
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
            <Line type="monotone" dataKey="Fund" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="Shanghai Composite" stroke="hsl(var(--chart-1))" strokeWidth={1.5} />
            <Line type="monotone" dataKey="Shenzhen Component" stroke="hsl(var(--chart-2))" strokeWidth={1.5} />
            <Line type="monotone" dataKey="CSI 300" stroke="hsl(var(--chart-3))" strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
