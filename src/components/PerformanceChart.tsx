import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface PerformanceChartProps {
  data: PortfolioData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PerformanceTooltipPoint }>;
  visibleIndices?: Set<string>;
}

type PerformanceTooltipPoint = {
  date: string;
  originalDate?: string;
  [key: string]: string | number | null | undefined;
};

interface IndexConfig {
  key: string;
  name: string;
  color: string;
  strokeWidth: number;
  region: 'fund' | 'china' | 'us' | 'europe' | 'asia' | 'americas';
}

const INDEX_CONFIG: IndexConfig[] = [
  { key: 'Fund', name: 'Fund', color: '#4338ca', strokeWidth: 3, region: 'fund' },
  { key: 'SHA', name: 'Shanghai (SHA)', color: '#10b981', strokeWidth: 1.5, region: 'china' },
  { key: 'SHE', name: 'Shenzhen (SHE)', color: '#34d399', strokeWidth: 1.5, region: 'china' },
  { key: 'CSI300', name: 'CSI 300', color: '#6ee7b7', strokeWidth: 1.5, region: 'china' },
  { key: 'SP500', name: 'S&P 500', color: '#ef4444', strokeWidth: 2, region: 'us' },
  { key: 'Nasdaq', name: 'Nasdaq', color: '#f59e0b', strokeWidth: 2, region: 'us' },
  { key: 'FTSE100', name: 'FTSE 100 (UK)', color: '#f97316', strokeWidth: 1.5, region: 'europe' },
  { key: 'HangSeng', name: 'Hang Seng (HK)', color: '#a855f7', strokeWidth: 1.5, region: 'asia' },
  { key: 'Nikkei225', name: 'Nikkei 225 (Japan)', color: '#f59e0b', strokeWidth: 1.5, region: 'asia' },
  { key: 'TSX', name: 'TSX (Canada)', color: '#ef4444', strokeWidth: 1.5, region: 'americas' },
  { key: 'KLSE', name: 'KLSE (Malaysia)', color: '#8b5cf6', strokeWidth: 1.5, region: 'asia' },
  { key: 'CAC40', name: 'CAC 40 (France)', color: '#3b82f6', strokeWidth: 1.5, region: 'europe' },
  { key: 'DAX', name: 'DAX (Germany)', color: '#10b981', strokeWidth: 1.5, region: 'europe' },
  { key: 'STI', name: 'STI (Singapore)', color: '#ec4899', strokeWidth: 1.5, region: 'asia' },
  { key: 'ASX200', name: 'ASX 200 (Australia)', color: '#06b6d4', strokeWidth: 1.5, region: 'asia' },
];

const REGION_LABELS: Record<string, string> = {
  china: 'China Markets',
  us: 'US Markets',
  europe: 'Europe',
  asia: 'Asia Pacific',
  americas: 'Americas',
};

const CustomTooltip = ({ active, payload, visibleIndices }: CustomTooltipProps) => {
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

    const actualValueMap: Record<string, number> = {
      Fund: Number(dataPoint.actualFund) || 0,
      SHA: Number(dataPoint.actualSHA) || 0,
      SHE: Number(dataPoint.actualSHE) || 0,
      CSI300: Number(dataPoint.actualCSI) || 0,
      SP500: Number(dataPoint.actualSP500) || 0,
      Nasdaq: Number(dataPoint.actualNasdaq) || 0,
      FTSE100: Number(dataPoint.actualFTSE) || 0,
      HangSeng: Number(dataPoint.actualHangSeng) || 0,
      Nikkei225: Number(dataPoint.actualNikkei225) || 0,
      TSX: Number(dataPoint.actualTSX) || 0,
      KLSE: Number(dataPoint.actualKLSE) || 0,
      CAC40: Number(dataPoint.actualCAC40) || 0,
      DAX: Number(dataPoint.actualDAX) || 0,
      STI: Number(dataPoint.actualSTI) || 0,
      ASX200: Number(dataPoint.actualASX200) || 0,
    };

    const percentValueMap: Record<string, number> = {
      Fund: dataPoint.Fund,
      SHA: dataPoint.SHA,
      SHE: dataPoint.SHE,
      CSI300: dataPoint.CSI300,
      SP500: dataPoint.SP500,
      Nasdaq: dataPoint.Nasdaq,
      FTSE100: dataPoint.FTSE100,
      HangSeng: dataPoint.HangSeng,
      Nikkei225: dataPoint.Nikkei225,
      TSX: dataPoint.TSX,
      KLSE: dataPoint.KLSE,
      CAC40: dataPoint.CAC40,
      DAX: dataPoint.DAX,
      STI: dataPoint.STI,
      ASX200: dataPoint.ASX200,
    };

    // Group visible indices by region
    const visibleByRegion: Record<string, IndexConfig[]> = {};
    INDEX_CONFIG.forEach(config => {
      if (visibleIndices?.has(config.key)) {
        if (!visibleByRegion[config.region]) {
          visibleByRegion[config.region] = [];
        }
        visibleByRegion[config.region].push(config);
      }
    });

    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg max-h-96 overflow-y-auto">
        <p className="font-semibold mb-2">{formattedDate}</p>
        <div className="space-y-1">
          {visibleByRegion['fund']?.map(config => (
            <p key={config.key} style={{ color: config.color }}>
              {config.name}: {actualValueMap[config.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-xs text-muted-foreground ml-2">
                ({percentValueMap[config.key] >= 0 ? '+' : ''}{percentValueMap[config.key].toFixed(2)}%)
              </span>
            </p>
          ))}

          {visibleByRegion['china']?.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mt-2">China Markets</p>
              {visibleByRegion['china'].map(config => (
                <p key={config.key} style={{ color: config.color }}>
                  {config.name}: {actualValueMap[config.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({percentValueMap[config.key] >= 0 ? '+' : ''}{percentValueMap[config.key].toFixed(2)}%)
                  </span>
                </p>
              ))}
            </>
          )}

          {visibleByRegion['us']?.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mt-2">US Markets</p>
              {visibleByRegion['us'].map(config => (
                <p key={config.key} style={{ color: config.color }}>
                  {config.name}: {actualValueMap[config.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {percentValueMap[config.key] !== 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({percentValueMap[config.key] >= 0 ? '+' : ''}{percentValueMap[config.key].toFixed(2)}%)
                    </span>
                  )}
                </p>
              ))}
            </>
          )}

          {visibleByRegion['europe']?.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mt-2">Europe</p>
              {visibleByRegion['europe'].map(config => (
                <p key={config.key} style={{ color: config.color }}>
                  {config.name}: {actualValueMap[config.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {percentValueMap[config.key] !== 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({percentValueMap[config.key] >= 0 ? '+' : ''}{percentValueMap[config.key].toFixed(2)}%)
                    </span>
                  )}
                </p>
              ))}
            </>
          )}

          {visibleByRegion['asia']?.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mt-2">Asia Pacific</p>
              {visibleByRegion['asia'].map(config => (
                <p key={config.key} style={{ color: config.color }}>
                  {config.name}: {actualValueMap[config.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {percentValueMap[config.key] !== 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({percentValueMap[config.key] >= 0 ? '+' : ''}{percentValueMap[config.key].toFixed(2)}%)
                    </span>
                  )}
                </p>
              ))}
            </>
          )}

          {visibleByRegion['americas']?.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mt-2">Americas</p>
              {visibleByRegion['americas'].map(config => (
                <p key={config.key} style={{ color: config.color }}>
                  {config.name}: {actualValueMap[config.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {percentValueMap[config.key] !== 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({percentValueMap[config.key] >= 0 ? '+' : ''}{percentValueMap[config.key].toFixed(2)}%)
                    </span>
                  )}
                </p>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Fund is always visible, start with China markets visible by default
  const [visibleIndices, setVisibleIndices] = useState<Set<string>>(
    new Set(['Fund', 'SHA', 'SHE', 'CSI300'])
  );

  const toggleIndex = (key: string) => {
    if (key === 'Fund') return; // Fund is always visible
    setVisibleIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleRegion = (region: string) => {
    const regionIndices = INDEX_CONFIG.filter(c => c.region === region).map(c => c.key);
    const allVisible = regionIndices.every(key => visibleIndices.has(key));

    setVisibleIndices(prev => {
      const newSet = new Set(prev);
      regionIndices.forEach(key => {
        if (allVisible) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
      });
      return newSet;
    });
  };

  const selectAll = () => {
    setVisibleIndices(new Set(INDEX_CONFIG.map(c => c.key)));
  };

  const selectNone = () => {
    setVisibleIndices(new Set(['Fund'])); // Keep Fund visible
  };

  // Find the first valid base value for each index (where value > 0)
  const findFirstValidBase = (key: keyof PortfolioData) => {
    const found = data.find(row => Number(row[key]) > 0);
    return found ? Number(found[key]) : 0;
  };

  const baseSP500 = findFirstValidBase('sp500');
  const baseNasdaq = findFirstValidBase('nasdaq');
  const baseFTSE100 = findFirstValidBase('ftse100');
  const baseHangSeng = findFirstValidBase('hangseng');
  const baseNikkei225 = findFirstValidBase('nikkei225');
  const baseTSX = findFirstValidBase('tsx');
  const baseKLSE = findFirstValidBase('klse');
  const baseCAC40 = findFirstValidBase('cac40');
  const baseDAX = findFirstValidBase('dax');
  const baseSTI = findFirstValidBase('sti');
  const baseASX200 = findFirstValidBase('asx200');

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
        SP500: baseSP500 > 0 && row.sp500 > 0 ? Number(((row.sp500 / baseSP500 - 1) * 100).toFixed(2)) : null,
        Nasdaq: baseNasdaq > 0 && row.nasdaq > 0 ? Number(((row.nasdaq / baseNasdaq - 1) * 100).toFixed(2)) : null,
        FTSE100: baseFTSE100 > 0 && row.ftse100 > 0 ? Number(((row.ftse100 / baseFTSE100 - 1) * 100).toFixed(2)) : null,
        HangSeng: baseHangSeng > 0 && row.hangseng > 0 ? Number(((row.hangseng / baseHangSeng - 1) * 100).toFixed(2)) : null,
        Nikkei225: baseNikkei225 > 0 && row.nikkei225 > 0 ? Number(((row.nikkei225 / baseNikkei225 - 1) * 100).toFixed(2)) : null,
        TSX: baseTSX > 0 && row.tsx > 0 ? Number(((row.tsx / baseTSX - 1) * 100).toFixed(2)) : null,
        KLSE: baseKLSE > 0 && row.klse > 0 ? Number(((row.klse / baseKLSE - 1) * 100).toFixed(2)) : null,
        CAC40: baseCAC40 > 0 && row.cac40 > 0 ? Number(((row.cac40 / baseCAC40 - 1) * 100).toFixed(2)) : null,
        DAX: baseDAX > 0 && row.dax > 0 ? Number(((row.dax / baseDAX - 1) * 100).toFixed(2)) : null,
        STI: baseSTI > 0 && row.sti > 0 ? Number(((row.sti / baseSTI - 1) * 100).toFixed(2)) : null,
        ASX200: baseASX200 > 0 && row.asx200 > 0 ? Number(((row.asx200 / baseASX200 - 1) * 100).toFixed(2)) : null,
        // Actual values for tooltip
        actualFund: row.shareValue,
        actualSHA: row.sha,
        actualSHE: row.she,
        actualCSI: row.csi300,
        actualSP500: row.sp500,
        actualNasdaq: row.nasdaq,
        actualFTSE: row.ftse100,
        actualHangSeng: row.hangseng,
        actualNikkei225: row.nikkei225,
        actualTSX: row.tsx,
        actualKLSE: row.klse,
        actualCAC40: row.cac40,
        actualDAX: row.dax,
        actualSTI: row.sti,
        actualASX200: row.asx200,
      };
    });

  const regions = ['china', 'us', 'europe', 'asia', 'americas'] as const;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Global Performance Comparison</CardTitle>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={selectAll}
            >
              Select All
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary transition-colors"
              onClick={selectNone}
            >
              Clear All
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Index Selector */}
        <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg">
          {/* Fund - Always visible */}
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: INDEX_CONFIG[0].color }}
            />
            <span className="text-sm font-semibold">Fund</span>
            <Badge variant="secondary" className="text-xs">Always On</Badge>
          </div>

          {/* Grouped by region */}
          {regions.map(region => {
            const regionIndices = INDEX_CONFIG.filter(c => c.region === region);
            const allVisible = regionIndices.every(c => visibleIndices.has(c.key));
            const someVisible = regionIndices.some(c => visibleIndices.has(c.key));

            return (
              <div key={region} className="flex flex-col gap-2">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleRegion(region)}
                >
                  <Checkbox
                    checked={allVisible}
                    className={someVisible && !allVisible ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {REGION_LABELS[region]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 ml-4">
                  {regionIndices.map(config => (
                    <label
                      key={config.key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                    >
                      <Checkbox
                        checked={visibleIndices.has(config.key)}
                        onCheckedChange={() => toggleIndex(config.key)}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm">{config.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart */}
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
            <Tooltip content={<CustomTooltip visibleIndices={visibleIndices} />} />
            <Legend />
            {INDEX_CONFIG.map(config => (
              visibleIndices.has(config.key) && (
                <Line
                  key={config.key}
                  type="monotone"
                  dataKey={config.key}
                  stroke={config.color}
                  strokeWidth={config.strokeWidth}
                  dot={false}
                  name={config.name}
                  connectNulls={false}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
