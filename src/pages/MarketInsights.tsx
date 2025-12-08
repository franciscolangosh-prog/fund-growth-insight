import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  BarChart3,
  LineChart,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import {
  fetchAllMarketData,
  calculateRollingReturns,
  simulateDCA,
  calculateMissingDaysImpact,
  analyzeWorstEntryPoints,
  getMarketSummaryStats,
  calculateYearlyReturns,
  MarketDataPoint,
  RollingReturnStats,
} from "@/utils/marketInsightsAnalysis";

const INDEX_OPTIONS = [
  { value: 'sp500', label: 'S&P 500', color: '#2563eb' },
  { value: 'nasdaq', label: 'NASDAQ', color: '#7c3aed' },
  { value: 'sha', label: 'Shanghai Composite', color: '#dc2626' },
  { value: 'she', label: 'Shenzhen Composite', color: '#ea580c' },
  { value: 'csi300', label: 'CSI 300', color: '#ca8a04' },
  { value: 'hangseng', label: 'Hang Seng', color: '#16a34a' },
  { value: 'ftse100', label: 'FTSE 100', color: '#0891b2' },
];

const MarketInsights = () => {
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<string>('sp500');

  useEffect(() => {
    const loadData = async () => {
      const marketData = await fetchAllMarketData();
      setData(marketData);
      setLoading(false);
    };
    loadData();
  }, []);

  const summaryStats = useMemo(() => getMarketSummaryStats(data), [data]);
  const rollingReturns = useMemo(
    () => calculateRollingReturns(data, selectedIndex as keyof Omit<MarketDataPoint, 'date'>),
    [data, selectedIndex]
  );
  const dcaSimulation = useMemo(
    () => simulateDCA(data, selectedIndex as keyof Omit<MarketDataPoint, 'date'>, 1000),
    [data, selectedIndex]
  );
  const missingDaysImpact = useMemo(
    () => calculateMissingDaysImpact(data, selectedIndex as keyof Omit<MarketDataPoint, 'date'>),
    [data, selectedIndex]
  );
  const worstEntryPoints = useMemo(
    () => analyzeWorstEntryPoints(data, selectedIndex as keyof Omit<MarketDataPoint, 'date'>),
    [data, selectedIndex]
  );
  const yearlyReturns = useMemo(() => calculateYearlyReturns(data), [data]);

  const selectedIndexConfig = INDEX_OPTIONS.find(i => i.value === selectedIndex);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold">Loading 25 Years of Market Data...</h2>
            <p className="text-muted-foreground mt-2">Analyzing market history from 2000 to 2025</p>
          </div>
        </div>
      </>
    );
  }

  if (data.length === 0) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold text-destructive">No Market Data Available</h2>
            <p className="text-muted-foreground mt-2">
              Please import market data in the Data Management page first.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-3.5rem)] bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold">Market Insights</h1>
                <p className="text-muted-foreground text-lg">
                  Why Time in the Market Beats Timing the Market
                </p>
              </div>
            </div>
            
            <Alert className="bg-primary/5 border-primary/20">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>25 Years of Market Wisdom</AlertTitle>
              <AlertDescription>
                Analyzing data from {summaryStats.startDate} to {summaryStats.endDate} ({summaryStats.totalYears.toFixed(1)} years) 
                to help ordinary investors understand the power of patience and consistency.
              </AlertDescription>
            </Alert>
          </div>

          {/* Index Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Select Market Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDEX_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Key Insight Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InsightCard
              icon={Calendar}
              title="Data Span"
              value={`${summaryStats.totalYears.toFixed(0)} Years`}
              subtitle={`${summaryStats.startDate} to ${summaryStats.endDate}`}
              color="blue"
            />
            <InsightCard
              icon={TrendingUp}
              title="Total Return"
              value={`${summaryStats.indices.find(i => i.key === selectedIndex)?.totalReturn.toFixed(1)}%`}
              subtitle={`${selectedIndexConfig?.label}`}
              color="green"
            />
            <InsightCard
              icon={Target}
              title="Annualized Return"
              value={`${summaryStats.indices.find(i => i.key === selectedIndex)?.annualizedReturn.toFixed(2)}%`}
              subtitle="Compound annual growth"
              color="purple"
            />
            <InsightCard
              icon={TrendingDown}
              title="Max Drawdown"
              value={`${summaryStats.indices.find(i => i.key === selectedIndex)?.maxDrawdown.toFixed(1)}%`}
              subtitle="Worst peak-to-trough decline"
              color="red"
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="time-heals" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
              <TabsTrigger value="time-heals" className="py-3">
                <Clock className="h-4 w-4 mr-2" />
                Time Heals
              </TabsTrigger>
              <TabsTrigger value="dca" className="py-3">
                <DollarSign className="h-4 w-4 mr-2" />
                DCA Strategy
              </TabsTrigger>
              <TabsTrigger value="worst-timing" className="py-3">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Worst Timing
              </TabsTrigger>
              <TabsTrigger value="missing-days" className="py-3">
                <Calendar className="h-4 w-4 mr-2" />
                Missing Days
              </TabsTrigger>
              <TabsTrigger value="yearly" className="py-3">
                <BarChart3 className="h-4 w-4 mr-2" />
                Yearly Returns
              </TabsTrigger>
            </TabsList>

            {/* Time Heals All Wounds */}
            <TabsContent value="time-heals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Time Heals All Wounds: The Power of Holding Period
                  </CardTitle>
                  <CardDescription>
                    The longer you hold, the higher your probability of positive returns. 
                    Based on {data.length.toLocaleString()} trading days of historical data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rolling Returns Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rollingReturns} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="period" width={80} />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Positive Return Probability']}
                        />
                        <Bar dataKey="positivePercentage" name="Probability of Positive Return">
                          {rollingReturns.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.positivePercentage >= 90 ? '#22c55e' : 
                                    entry.positivePercentage >= 70 ? '#84cc16' :
                                    entry.positivePercentage >= 50 ? '#eab308' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Holding Period</th>
                          <th className="text-right py-3 px-4">Win Rate</th>
                          <th className="text-right py-3 px-4">Avg Return</th>
                          <th className="text-right py-3 px-4">Best</th>
                          <th className="text-right py-3 px-4">Worst</th>
                          <th className="text-right py-3 px-4">Observations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rollingReturns.map((stat) => (
                          <tr key={stat.period} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{stat.period}</td>
                            <td className="text-right py-3 px-4">
                              <Badge variant={stat.positivePercentage >= 70 ? "default" : "secondary"}>
                                {stat.positivePercentage.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className={`text-right py-3 px-4 ${stat.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stat.avgReturn >= 0 ? '+' : ''}{stat.avgReturn.toFixed(2)}%
                            </td>
                            <td className="text-right py-3 px-4 text-green-600">
                              +{stat.maxReturn.toFixed(2)}%
                            </td>
                            <td className="text-right py-3 px-4 text-red-600">
                              {stat.minReturn.toFixed(2)}%
                            </td>
                            <td className="text-right py-3 px-4 text-muted-foreground">
                              {stat.count.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Key Takeaway</AlertTitle>
                    <AlertDescription>
                      {rollingReturns.find(r => r.years === 10)?.positivePercentage 
                        ? `Historically, holding ${selectedIndexConfig?.label} for 10 years resulted in positive returns ${rollingReturns.find(r => r.years === 10)?.positivePercentage.toFixed(0)}% of the time.`
                        : 'Longer holding periods significantly increase your probability of positive returns.'}
                      {' '}Patience is the investor's greatest asset.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dollar-Cost Averaging */}
            <TabsContent value="dca" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Dollar-Cost Averaging: The Power of Consistency
                  </CardTitle>
                  <CardDescription>
                    What if you invested $1,000 every month for {summaryStats.totalYears.toFixed(0)} years, 
                    regardless of market conditions?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* DCA Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Invested</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${dcaSimulation.totalInvested.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Final Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${dcaSimulation.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Return</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {dcaSimulation.totalReturn >= 0 ? '+' : ''}{dcaSimulation.totalReturn.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Annualized Return</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dcaSimulation.annualizedReturn.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* DCA Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={dcaSimulation.monthlyData.filter((_, i) => i % 20 === 0)} // Sample for performance
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => date.substring(0, 4)}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                            name === 'invested' ? 'Total Invested' : 'Portfolio Value'
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="invested" 
                          stackId="1"
                          stroke="#94a3b8" 
                          fill="#94a3b8" 
                          fillOpacity={0.3}
                          name="Total Invested"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={selectedIndexConfig?.color} 
                          fill={selectedIndexConfig?.color} 
                          fillOpacity={0.6}
                          name="Portfolio Value"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                    <AlertTitle>The DCA Advantage</AlertTitle>
                    <AlertDescription>
                      By investing consistently, you automatically buy more shares when prices are low 
                      and fewer when prices are high. This removes emotion from investing and builds 
                      wealth steadily over time. Your ${dcaSimulation.totalInvested.toLocaleString()} 
                      investment grew to ${dcaSimulation.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}!
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Worst Timing Analysis */}
            <TabsContent value="worst-timing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Worst Possible Timing: Buying at Each Year's Peak
                  </CardTitle>
                  <CardDescription>
                    What if you had the worst luck and bought at the highest point of each year? 
                    This shows how long it took to recover and your returns today.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Year</th>
                          <th className="text-left py-3 px-4">Peak Date</th>
                          <th className="text-right py-3 px-4">Peak Value</th>
                          <th className="text-right py-3 px-4">Recovery Date</th>
                          <th className="text-right py-3 px-4">Recovery Time</th>
                          <th className="text-right py-3 px-4">Return to Today</th>
                        </tr>
                      </thead>
                      <tbody>
                        {worstEntryPoints.map((entry) => (
                          <tr key={entry.year} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-bold">{entry.year}</td>
                            <td className="py-3 px-4 text-muted-foreground">{entry.peakDate}</td>
                            <td className="text-right py-3 px-4">
                              {entry.peakValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4">
                              {entry.recoveryDate ? (
                                entry.recoveryDate
                              ) : (
                                <Badge variant="outline" className="text-orange-500">
                                  Not Yet
                                </Badge>
                              )}
                            </td>
                            <td className="text-right py-3 px-4">
                              {entry.recoveryDays ? (
                                <span className={entry.recoveryDays > 1000 ? 'text-orange-500' : 'text-green-600'}>
                                  {entry.recoveryDays < 365 
                                    ? `${entry.recoveryDays} days`
                                    : `${(entry.recoveryDays / 365).toFixed(1)} years`}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className={`text-right py-3 px-4 font-medium ${entry.currentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.currentReturn >= 0 ? '+' : ''}{entry.currentReturn.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary stats */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Years with Recovery</p>
                      <p className="text-2xl font-bold text-green-600">
                        {worstEntryPoints.filter(e => e.recoveryDate).length} / {worstEntryPoints.length}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Avg Recovery Time</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {worstEntryPoints.filter(e => e.recoveryDays).length > 0
                          ? `${(worstEntryPoints.filter(e => e.recoveryDays).reduce((sum, e) => sum + (e.recoveryDays || 0), 0) / worstEntryPoints.filter(e => e.recoveryDays).length / 365).toFixed(1)} years`
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Avg Return to Today</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {worstEntryPoints.length > 0
                          ? `+${(worstEntryPoints.reduce((sum, e) => sum + e.currentReturn, 0) / worstEntryPoints.length).toFixed(1)}%`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>What This Means for You</AlertTitle>
                    <AlertDescription>
                      Even if you bought at the absolute worst time each year (the yearly peak), 
                      most investments eventually recovered and generated positive returns. 
                      Time in the market heals even the worst timing decisions.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Missing Best Days */}
            <TabsContent value="missing-days" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-red-500" />
                    The Cost of Market Timing: Missing the Best Days
                  </CardTitle>
                  <CardDescription>
                    What happens if you try to time the market and miss the best trading days? 
                    Starting with $10,000 investment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Impact Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={missingDaysImpact} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="scenario" 
                          angle={-30} 
                          textAnchor="end" 
                          height={80}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Final Value']}
                        />
                        <Bar dataKey="finalValue" name="Final Value">
                          {missingDaysImpact.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? '#22c55e' : 
                                    index === 1 ? '#84cc16' :
                                    index === 2 ? '#eab308' :
                                    index === 3 ? '#f97316' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Impact Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Scenario</th>
                          <th className="text-right py-3 px-4">Final Value</th>
                          <th className="text-right py-3 px-4">Annualized Return</th>
                          <th className="text-right py-3 px-4">Lost vs Fully Invested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missingDaysImpact.map((scenario, idx) => {
                          const fullyInvested = missingDaysImpact[0]?.finalValue || 0;
                          const lost = fullyInvested - scenario.finalValue;
                          const lostPct = fullyInvested > 0 ? (lost / fullyInvested) * 100 : 0;
                          
                          return (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4 font-medium">{scenario.scenario}</td>
                              <td className="text-right py-3 px-4">
                                ${scenario.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className={`text-right py-3 px-4 ${scenario.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {scenario.annualizedReturn >= 0 ? '+' : ''}{scenario.annualizedReturn.toFixed(2)}%
                              </td>
                              <td className="text-right py-3 px-4">
                                {idx === 0 ? (
                                  <Badge variant="default">Baseline</Badge>
                                ) : (
                                  <span className="text-red-600">
                                    -${lost.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({lostPct.toFixed(1)}%)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>The Hidden Cost of Market Timing</AlertTitle>
                    <AlertDescription>
                      The best trading days often occur during periods of high volatility, 
                      right after the worst days. If you're out of the market trying to 
                      avoid losses, you'll likely miss the biggest gains too. 
                      Stay invested!
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Yearly Returns */}
            <TabsContent value="yearly" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Year-by-Year Market Returns
                  </CardTitle>
                  <CardDescription>
                    Annual returns for {selectedIndexConfig?.label} over {summaryStats.totalYears.toFixed(0)} years. 
                    Notice how positive years far outnumber negative ones.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Yearly Returns Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearlyReturns}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(v) => `${v}%`} />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                        />
                        <ReferenceLine y={0} stroke="#666" />
                        <Bar 
                          dataKey={selectedIndex} 
                          name={selectedIndexConfig?.label}
                        >
                          {yearlyReturns.map((entry, index) => {
                            const value = entry[selectedIndex as keyof typeof entry] as number;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={value >= 0 ? '#22c55e' : '#ef4444'}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Positive Years</p>
                      <p className="text-2xl font-bold text-green-600">
                        {yearlyReturns.filter(y => (y[selectedIndex as keyof typeof y] as number) > 0).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ({((yearlyReturns.filter(y => (y[selectedIndex as keyof typeof y] as number) > 0).length / yearlyReturns.length) * 100).toFixed(0)}% of years)
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Negative Years</p>
                      <p className="text-2xl font-bold text-red-600">
                        {yearlyReturns.filter(y => (y[selectedIndex as keyof typeof y] as number) < 0).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ({((yearlyReturns.filter(y => (y[selectedIndex as keyof typeof y] as number) < 0).length / yearlyReturns.length) * 100).toFixed(0)}% of years)
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Average Annual Return</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(yearlyReturns.reduce((sum, y) => sum + (y[selectedIndex as keyof typeof y] as number), 0) / yearlyReturns.length).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertTitle>The Odds Are in Your Favor</AlertTitle>
                    <AlertDescription>
                      Historically, markets go up more often than they go down. While individual 
                      years can be volatile, the long-term trend is upward. Focus on time in 
                      the market, not timing the market.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom Summary */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                What Should Ordinary Investors Do?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <ActionCard
                  number={1}
                  title="Start Early"
                  description="The earlier you start, the more time your money has to compound. Even small amounts grow significantly over decades."
                />
                <ActionCard
                  number={2}
                  title="Invest Regularly"
                  description="Set up automatic monthly investments. Dollar-cost averaging removes emotion and builds wealth consistently."
                />
                <ActionCard
                  number={3}
                  title="Stay Invested"
                  description="Don't try to time the market. Missing just a few of the best days can devastate your returns."
                />
                <ActionCard
                  number={4}
                  title="Think Long-Term"
                  description="Market downturns are temporary. History shows that patient investors are rewarded over time."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

// Helper Components
function InsightCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  value: string; 
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600',
    green: 'bg-green-50 dark:bg-green-950 text-green-600',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600',
    red: 'bg-red-50 dark:bg-red-950 text-red-600',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ 
  number, 
  title, 
  description 
}: { 
  number: number; 
  title: string; 
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
          {number}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground pl-11">{description}</p>
    </div>
  );
}

export default MarketInsights;
