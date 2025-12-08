import { supabase } from "@/integrations/supabase/client";

export interface MarketDataPoint {
  date: string;
  sha: number;
  she: number;
  csi300: number;
  sp500: number;
  nasdaq: number;
  ftse100: number;
  hangseng: number;
}

export interface RollingReturnStats {
  period: string;
  years: number;
  positivePercentage: number;
  avgReturn: number;
  minReturn: number;
  maxReturn: number;
  medianReturn: number;
  count: number;
}

export interface DCASimulationResult {
  totalInvested: number;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  monthlyData: Array<{
    date: string;
    invested: number;
    value: number;
    indexValue: number;
  }>;
}

export interface MarketCycle {
  type: 'bull' | 'bear' | 'recovery';
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  change: number;
  durationDays: number;
}

export interface BestWorstDaysImpact {
  scenario: string;
  finalValue: number;
  annualizedReturn: number;
  missedDays: number;
}

/**
 * Fetches all market data from the database
 */
export async function fetchAllMarketData(): Promise<MarketDataPoint[]> {
  const PAGE_SIZE = 1000;
  let from = 0;
  let allData: MarketDataPoint[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('market_indices')
      .select('date, sha, she, csi300, sp500, nasdaq, ftse100, hangseng')
      .order('date', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching market data:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allData.push(...data.map(d => ({
      date: d.date,
      sha: Number(d.sha) || 0,
      she: Number(d.she) || 0,
      csi300: Number(d.csi300) || 0,
      sp500: Number(d.sp500) || 0,
      nasdaq: Number(d.nasdaq) || 0,
      ftse100: Number(d.ftse100) || 0,
      hangseng: Number(d.hangseng) || 0,
    })));

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
}

/**
 * Calculate rolling returns for different holding periods
 * Shows probability of positive returns based on holding period
 */
export function calculateRollingReturns(
  data: MarketDataPoint[],
  indexKey: keyof Omit<MarketDataPoint, 'date'>
): RollingReturnStats[] {
  const periods = [
    { label: '1 Year', years: 1 },
    { label: '3 Years', years: 3 },
    { label: '5 Years', years: 5 },
    { label: '10 Years', years: 10 },
    { label: '15 Years', years: 15 },
    { label: '20 Years', years: 20 },
  ];

  return periods.map(({ label, years }) => {
    const tradingDaysPerYear = 252;
    const lookbackDays = years * tradingDaysPerYear;
    const returns: number[] = [];

    for (let i = lookbackDays; i < data.length; i++) {
      const startValue = data[i - lookbackDays][indexKey] as number;
      const endValue = data[i][indexKey] as number;
      
      if (startValue > 0 && endValue > 0) {
        const totalReturn = ((endValue - startValue) / startValue) * 100;
        const annualizedReturn = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
        returns.push(annualizedReturn);
      }
    }

    if (returns.length === 0) {
      return {
        period: label,
        years,
        positivePercentage: 0,
        avgReturn: 0,
        minReturn: 0,
        maxReturn: 0,
        medianReturn: 0,
        count: 0,
      };
    }

    const sorted = [...returns].sort((a, b) => a - b);
    const positiveCount = returns.filter(r => r > 0).length;

    return {
      period: label,
      years,
      positivePercentage: (positiveCount / returns.length) * 100,
      avgReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
      minReturn: sorted[0],
      maxReturn: sorted[sorted.length - 1],
      medianReturn: sorted[Math.floor(sorted.length / 2)],
      count: returns.length,
    };
  });
}

/**
 * Simulate Dollar-Cost Averaging strategy
 * Investing a fixed amount monthly over the entire period
 */
export function simulateDCA(
  data: MarketDataPoint[],
  indexKey: keyof Omit<MarketDataPoint, 'date'>,
  monthlyAmount: number = 1000
): DCASimulationResult {
  const monthlyData: DCASimulationResult['monthlyData'] = [];
  let totalShares = 0;
  let totalInvested = 0;
  let lastMonth = '';

  for (const point of data) {
    const currentMonth = point.date.substring(0, 7); // YYYY-MM
    const indexValue = point[indexKey] as number;

    if (indexValue <= 0) continue;

    // Invest at the start of each new month
    if (currentMonth !== lastMonth) {
      const sharesBought = monthlyAmount / indexValue;
      totalShares += sharesBought;
      totalInvested += monthlyAmount;
      lastMonth = currentMonth;
    }

    const currentValue = totalShares * indexValue;
    monthlyData.push({
      date: point.date,
      invested: totalInvested,
      value: currentValue,
      indexValue,
    });
  }

  const finalValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;
  const totalReturn = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0;
  
  // Calculate years for annualized return
  const years = monthlyData.length > 0 
    ? (new Date(monthlyData[monthlyData.length - 1].date).getTime() - new Date(monthlyData[0].date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    : 0;
  
  const annualizedReturn = years > 0 && totalInvested > 0
    ? (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100
    : 0;

  return {
    totalInvested,
    finalValue,
    totalReturn,
    annualizedReturn,
    monthlyData,
  };
}

/**
 * Identify market cycles (bull markets, bear markets, recoveries)
 */
export function identifyMarketCycles(
  data: MarketDataPoint[],
  indexKey: keyof Omit<MarketDataPoint, 'date'>,
  threshold: number = 20 // 20% change defines bull/bear
): MarketCycle[] {
  if (data.length < 2) return [];

  const cycles: MarketCycle[] = [];
  let cycleStart = 0;
  let peakValue = data[0][indexKey] as number;
  let troughValue = data[0][indexKey] as number;
  let peakIndex = 0;
  let troughIndex = 0;
  let currentTrend: 'up' | 'down' | null = null;

  for (let i = 1; i < data.length; i++) {
    const value = data[i][indexKey] as number;
    if (value <= 0) continue;

    // Track peaks and troughs
    if (value > peakValue) {
      peakValue = value;
      peakIndex = i;
    }
    if (value < troughValue) {
      troughValue = value;
      troughIndex = i;
    }

    // Check for trend change
    const changeFromPeak = ((value - peakValue) / peakValue) * 100;
    const changeFromTrough = ((value - troughValue) / troughValue) * 100;

    if (currentTrend !== 'down' && changeFromPeak <= -threshold) {
      // Entering bear market
      if (currentTrend === 'up') {
        cycles.push({
          type: 'bull',
          startDate: data[cycleStart].date,
          endDate: data[peakIndex].date,
          startValue: data[cycleStart][indexKey] as number,
          endValue: peakValue,
          change: ((peakValue - (data[cycleStart][indexKey] as number)) / (data[cycleStart][indexKey] as number)) * 100,
          durationDays: Math.round((new Date(data[peakIndex].date).getTime() - new Date(data[cycleStart].date).getTime()) / (24 * 60 * 60 * 1000)),
        });
      }
      currentTrend = 'down';
      cycleStart = peakIndex;
      troughValue = value;
      troughIndex = i;
    } else if (currentTrend !== 'up' && changeFromTrough >= threshold) {
      // Entering bull market
      if (currentTrend === 'down') {
        cycles.push({
          type: 'bear',
          startDate: data[cycleStart].date,
          endDate: data[troughIndex].date,
          startValue: data[cycleStart][indexKey] as number,
          endValue: troughValue,
          change: ((troughValue - (data[cycleStart][indexKey] as number)) / (data[cycleStart][indexKey] as number)) * 100,
          durationDays: Math.round((new Date(data[troughIndex].date).getTime() - new Date(data[cycleStart].date).getTime()) / (24 * 60 * 60 * 1000)),
        });
      }
      currentTrend = 'up';
      cycleStart = troughIndex;
      peakValue = value;
      peakIndex = i;
    }
  }

  return cycles;
}

/**
 * Calculate impact of missing the best/worst trading days
 * Demonstrates the cost of market timing
 */
export function calculateMissingDaysImpact(
  data: MarketDataPoint[],
  indexKey: keyof Omit<MarketDataPoint, 'date'>
): BestWorstDaysImpact[] {
  if (data.length < 2) return [];

  // Calculate daily returns
  const dailyReturns: Array<{ date: string; return: number; value: number }> = [];
  for (let i = 1; i < data.length; i++) {
    const prevValue = data[i - 1][indexKey] as number;
    const currValue = data[i][indexKey] as number;
    if (prevValue > 0 && currValue > 0) {
      dailyReturns.push({
        date: data[i].date,
        return: (currValue - prevValue) / prevValue,
        value: currValue,
      });
    }
  }

  // Sort by return to find best/worst days
  const sortedByReturn = [...dailyReturns].sort((a, b) => b.return - a.return);
  
  const initialInvestment = 10000;
  const years = (new Date(data[data.length - 1].date).getTime() - new Date(data[0].date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  // Calculate scenarios
  const scenarios: BestWorstDaysImpact[] = [];

  // Fully invested
  const startValue = data[0][indexKey] as number;
  const endValue = data[data.length - 1][indexKey] as number;
  const fullyInvestedFinal = initialInvestment * (endValue / startValue);
  
  scenarios.push({
    scenario: 'Fully Invested',
    finalValue: fullyInvestedFinal,
    annualizedReturn: (Math.pow(endValue / startValue, 1 / years) - 1) * 100,
    missedDays: 0,
  });

  // Missing best N days scenarios
  [5, 10, 20, 30, 40].forEach(n => {
    if (n > sortedByReturn.length) return;
    
    const bestDays = new Set(sortedByReturn.slice(0, n).map(d => d.date));
    let value = initialInvestment;
    
    for (const day of dailyReturns) {
      if (!bestDays.has(day.date)) {
        value *= (1 + day.return);
      }
    }

    const annualized = (Math.pow(value / initialInvestment, 1 / years) - 1) * 100;
    
    scenarios.push({
      scenario: `Missing Best ${n} Days`,
      finalValue: value,
      annualizedReturn: annualized,
      missedDays: n,
    });
  });

  return scenarios;
}

/**
 * Calculate worst entry point analysis using each year's peak
 * Shows recovery time if you bought at the worst time each year
 */
export function analyzeWorstEntryPoints(
  data: MarketDataPoint[],
  indexKey: keyof Omit<MarketDataPoint, 'date'>
): Array<{
  year: number;
  peakDate: string;
  peakValue: number;
  recoveryDate: string | null;
  recoveryDays: number | null;
  currentValue: number;
  currentReturn: number;
}> {
  if (data.length < 2) return [];

  // Group data by year and find each year's peak
  const yearlyPeaks: Map<number, { index: number; value: number; date: string }> = new Map();

  for (let i = 0; i < data.length; i++) {
    const value = data[i][indexKey] as number;
    if (value <= 0) continue;
    
    const year = parseInt(data[i].date.substring(0, 4));
    const existing = yearlyPeaks.get(year);
    
    if (!existing || value > existing.value) {
      yearlyPeaks.set(year, { index: i, value, date: data[i].date });
    }
  }

  // For each year's peak, find when it recovered
  const lastValue = data[data.length - 1][indexKey] as number;
  const currentYear = parseInt(data[data.length - 1].date.substring(0, 4));
  
  return Array.from(yearlyPeaks.entries())
    .filter(([year]) => year < currentYear) // Exclude current year (incomplete)
    .sort(([a], [b]) => a - b)
    .map(([year, peak]) => {
      let recoveryDate: string | null = null;
      let recoveryDays: number | null = null;

      for (let i = peak.index + 1; i < data.length; i++) {
        const value = data[i][indexKey] as number;
        if (value >= peak.value) {
          recoveryDate = data[i].date;
          recoveryDays = Math.round(
            (new Date(data[i].date).getTime() - new Date(peak.date).getTime()) / (24 * 60 * 60 * 1000)
          );
          break;
        }
      }

      return {
        year,
        peakDate: peak.date,
        peakValue: peak.value,
        recoveryDate,
        recoveryDays,
        currentValue: lastValue,
        currentReturn: ((lastValue - peak.value) / peak.value) * 100,
      };
    });
}

/**
 * Get summary statistics for the entire dataset
 */
export function getMarketSummaryStats(data: MarketDataPoint[]): {
  startDate: string;
  endDate: string;
  totalYears: number;
  indices: Array<{
    name: string;
    key: keyof Omit<MarketDataPoint, 'date'>;
    startValue: number;
    endValue: number;
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
  }>;
} {
  if (data.length === 0) {
    return {
      startDate: '',
      endDate: '',
      totalYears: 0,
      indices: [],
    };
  }

  const startDate = data[0].date;
  const endDate = data[data.length - 1].date;
  const totalYears = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  const indexConfigs: Array<{ name: string; key: keyof Omit<MarketDataPoint, 'date'> }> = [
    { name: 'Shanghai Composite (SHA)', key: 'sha' },
    { name: 'Shenzhen Composite (SHE)', key: 'she' },
    { name: 'CSI 300', key: 'csi300' },
    { name: 'S&P 500', key: 'sp500' },
    { name: 'NASDAQ', key: 'nasdaq' },
    { name: 'FTSE 100', key: 'ftse100' },
    { name: 'Hang Seng', key: 'hangseng' },
  ];

  const indices = indexConfigs.map(({ name, key }) => {
    // Find first and last valid values
    let startValue = 0;
    let endValue = 0;
    
    for (const point of data) {
      const val = point[key] as number;
      if (val > 0) {
        if (startValue === 0) startValue = val;
        endValue = val;
      }
    }

    const totalReturn = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
    const annualizedReturn = startValue > 0 && totalYears > 0
      ? (Math.pow(endValue / startValue, 1 / totalYears) - 1) * 100
      : 0;

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    for (const point of data) {
      const val = point[key] as number;
      if (val > 0) {
        if (val > peak) peak = val;
        const drawdown = ((val - peak) / peak) * 100;
        if (drawdown < maxDrawdown) maxDrawdown = drawdown;
      }
    }

    return {
      name,
      key,
      startValue,
      endValue,
      totalReturn,
      annualizedReturn,
      maxDrawdown,
    };
  });

  return {
    startDate,
    endDate,
    totalYears,
    indices,
  };
}

/**
 * Calculate yearly returns for all indices
 * Uses previous year's last trading day as start, current year's last trading day as end
 * This handles cases where Jan 1 or Dec 31 are not trading days
 */
export function calculateYearlyReturns(data: MarketDataPoint[]): Array<{
  year: number;
  sha: number;
  she: number;
  csi300: number;
  sp500: number;
  nasdaq: number;
  ftse100: number;
  hangseng: number;
}> {
  if (data.length === 0) return [];

  // Group data by year and find last trading day of each year
  const yearEndData: Map<number, MarketDataPoint> = new Map();

  for (const point of data) {
    const year = parseInt(point.date.substring(0, 4));
    // Always update to get the last trading day of the year
    yearEndData.set(year, point);
  }

  const years = Array.from(yearEndData.keys()).sort((a, b) => a - b);
  
  const calcReturn = (start: number, end: number) => 
    start > 0 && end > 0 ? ((end - start) / start) * 100 : 0;

  // Calculate returns: compare each year's end to previous year's end
  return years.slice(1).map(year => {
    const prevYearEnd = yearEndData.get(year - 1)!;
    const currYearEnd = yearEndData.get(year)!;

    return {
      year,
      sha: calcReturn(prevYearEnd.sha, currYearEnd.sha),
      she: calcReturn(prevYearEnd.she, currYearEnd.she),
      csi300: calcReturn(prevYearEnd.csi300, currYearEnd.csi300),
      sp500: calcReturn(prevYearEnd.sp500, currYearEnd.sp500),
      nasdaq: calcReturn(prevYearEnd.nasdaq, currYearEnd.nasdaq),
      ftse100: calcReturn(prevYearEnd.ftse100, currYearEnd.ftse100),
      hangseng: calcReturn(prevYearEnd.hangseng, currYearEnd.hangseng),
    };
  });
}
