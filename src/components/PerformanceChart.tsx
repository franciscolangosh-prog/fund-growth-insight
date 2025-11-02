import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface PerformanceChartProps {
  data: PortfolioData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  // Format date as "Jan. 1st, 2015"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Add ordinal suffix
    const getOrdinalSuffix = (n: number) => {
      const j = n % 10;
      const k = n % 100;
      if (j === 1 && k !== 11) return n + 'st';
      if (j === 2 && k !== 12) return n + 'nd';
      if (j === 3 && k !== 13) return n + 'rd';
      return n + 'th';
    };
    
    return `${month} ${getOrdinalSuffix(day)}, ${year}`;
  };

  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const formattedDate = dataPoint.originalDate ? formatDate(dataPoint.originalDate) : dataPoint.date;
    
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg max-h-96 overflow-y-auto">
        <p className="font-semibold mb-2">{formattedDate}</p>
        <div className="space-y-1">
          <p style={{ color: payload.find((p: any) => p.dataKey === 'Fund')?.color }}>
            Fund: {dataPoint.actualFund.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="text-xs text-muted-foreground ml-2">
              ({dataPoint.Fund >= 0 ? '+' : ''}{dataPoint.Fund.toFixed(2)}%)
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">China Markets</p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'SHA')?.color }}>
            SHA: {dataPoint.actualSHA.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="text-xs text-muted-foreground ml-2">
              ({dataPoint.SHA >= 0 ? '+' : ''}{dataPoint.SHA.toFixed(2)}%)
            </span>
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'SHE')?.color }}>
            SHE: {dataPoint.actualSHE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="text-xs text-muted-foreground ml-2">
              ({dataPoint.SHE >= 0 ? '+' : ''}{dataPoint.SHE.toFixed(2)}%)
            </span>
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'CSI300')?.color }}>
            CSI300: {dataPoint.actualCSI.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="text-xs text-muted-foreground ml-2">
              ({dataPoint.CSI300 >= 0 ? '+' : ''}{dataPoint.CSI300.toFixed(2)}%)
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">US Markets</p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'SP500')?.color }}>
            S&P500: {dataPoint.actualSP500.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {dataPoint.SP500 !== 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({dataPoint.SP500 >= 0 ? '+' : ''}{dataPoint.SP500.toFixed(2)}%)
              </span>
            )}
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'Nasdaq')?.color }}>
            Nasdaq: {dataPoint.actualNasdaq.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {dataPoint.Nasdaq !== 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({dataPoint.Nasdaq >= 0 ? '+' : ''}{dataPoint.Nasdaq.toFixed(2)}%)
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-2">International</p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'FTSE100')?.color }}>
            FTSE100: {dataPoint.actualFTSE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {dataPoint.FTSE100 !== 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({dataPoint.FTSE100 >= 0 ? '+' : ''}{dataPoint.FTSE100.toFixed(2)}%)
              </span>
            )}
          </p>
          <p style={{ color: payload.find((p: any) => p.dataKey === 'HangSeng')?.color }}>
            HangSeng: {dataPoint.actualHangSeng.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {dataPoint.HangSeng !== 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({dataPoint.HangSeng >= 0 ? '+' : ''}{dataPoint.HangSeng.toFixed(2)}%)
              </span>
            )}
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
        originalDate: row.date, // Store original date for tooltip formatting
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
            {/* Fund - Dark indigo, bold, prominent */}
            <Line type="monotone" dataKey="Fund" stroke="#4338ca" strokeWidth={3} dot={false} name="Fund" />
            
            {/* China Markets - Green shades */}
            <Line type="monotone" dataKey="SHA" stroke="#10b981" strokeWidth={1.5} dot={false} name="SHA" />
            <Line type="monotone" dataKey="SHE" stroke="#34d399" strokeWidth={1.5} dot={false} name="SHE" />
            <Line type="monotone" dataKey="CSI300" stroke="#6ee7b7" strokeWidth={1.5} dot={false} name="CSI300" />
            
            {/* US Markets - Red and Amber for high visibility */}
            <Line type="monotone" dataKey="SP500" stroke="#ef4444" strokeWidth={2} dot={false} name="S&P500" />
            <Line type="monotone" dataKey="Nasdaq" stroke="#f59e0b" strokeWidth={2} dot={false} name="Nasdaq" />
            
            {/* International - Orange/Purple shades */}
            <Line type="monotone" dataKey="FTSE100" stroke="#f97316" strokeWidth={1.5} dot={false} name="FTSE100" />
            <Line type="monotone" dataKey="HangSeng" stroke="#a855f7" strokeWidth={1.5} dot={false} name="HangSeng" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
