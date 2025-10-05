import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface PerformanceChartProps {
  data: PortfolioData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Sample data points to show full range with better distribution
  const totalPoints = data.length;
  const maxPoints = 150; // Maximum points to display for performance
  const step = Math.max(1, Math.floor(totalPoints / maxPoints));
  
  const chartData = data
    .filter((_, index) => index % step === 0 || index === totalPoints - 1)
    .map(row => {
      const date = new Date(row.date);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      
      return {
        date: formattedDate,
        fullDate: row.date,
        Fund: Number(row.shareValue.toFixed(2)),
        "Shanghai Composite": Number(row.sha.toFixed(2)),
        "Shenzhen Component": Number(row.she.toFixed(2)),
        "CSI 300": Number(row.csi300.toFixed(2)),
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
              label={{ value: 'Index Value', angle: -90, position: 'insideLeft' }} 
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
