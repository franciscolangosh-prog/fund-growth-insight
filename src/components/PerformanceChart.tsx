import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface PerformanceChartProps {
  data: PortfolioData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data
    .filter((_, index) => index % 30 === 0)
    .map(row => {
      const baseShare = data[0].shareValue;
      const baseSHA = data[0].sha;
      const baseSHE = data[0].she;
      const baseCSI = data[0].csi300;

      return {
        date: new Date(row.date).toLocaleDateString(),
        Fund: ((row.shareValue / baseShare - 1) * 100).toFixed(2),
        SHA: ((row.sha / baseSHA - 1) * 100).toFixed(2),
        SHE: ((row.she / baseSHE - 1) * 100).toFixed(2),
        CSI300: ((row.csi300 / baseCSI - 1) * 100).toFixed(2),
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
            <XAxis dataKey="date" />
            <YAxis 
              label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} 
              domain={['auto', 'auto']}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Fund" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="SHA" stroke="hsl(var(--chart-1))" strokeWidth={1.5} />
            <Line type="monotone" dataKey="SHE" stroke="hsl(var(--chart-2))" strokeWidth={1.5} />
            <Line type="monotone" dataKey="CSI300" stroke="hsl(var(--chart-3))" strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
