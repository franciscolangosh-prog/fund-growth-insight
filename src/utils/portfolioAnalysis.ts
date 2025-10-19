export interface PortfolioData {
  date: string;
  shareValue: number;
  sha: number;
  she: number;
  csi300: number;
  shares: number;
  gainLoss: number;
  dailyGain: number;
  marketValue: number;
  principle: number;
}

export interface AnnualReturn {
  year: number;
  fundReturn: number;
  shaReturn: number;
  sheReturn: number;
  csi300Return: number;
}

export interface CorrelationData {
  sha: number;
  she: number;
  csi300: number;
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  beta: {
    sha: number;
    she: number;
    csi300: number;
  };
  alpha: {
    sha: number;
    she: number;
    csi300: number;
  };
  calmarRatio: number;
  informationRatio: number;
}

export interface RollingMetrics {
  date: string;
  return30d: number;
  return60d: number;
  return90d: number;
  volatility30d: number;
  volatility60d: number;
  volatility90d: number;
  sharpe30d: number;
  sharpe60d: number;
  sharpe90d: number;
  correlation30d: {
    sha: number;
    she: number;
    csi300: number;
  };
  correlation60d: {
    sha: number;
    she: number;
    csi300: number;
  };
  correlation90d: {
    sha: number;
    she: number;
    csi300: number;
  };
}

export function parseCSV(csvText: string): PortfolioData[] {
  const lines = csvText.trim().split('\n');
  // Skip first 2 rows (Sheet name and header)
  return lines.slice(2).map(line => {
    const values = line.split(',').map(v => v.trim());
    
    // Parse DD/MM/YYYY format to YYYY-MM-DD
    const dateParts = values[0].split('/');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    return {
      date: formattedDate,
      sha: parseFloat(values[1]) || 0,
      she: parseFloat(values[2]) || 0,
      csi300: parseFloat(values[3]) || 0,
      shares: parseFloat(values[4]) || 0,
      shareValue: parseFloat(values[5]) || 0,
      gainLoss: parseFloat(values[6].replace(/[()]/g, '').replace(',', '')) * (values[6].includes('(') ? -1 : 1) || 0,
      dailyGain: parseFloat(values[7].replace(/[()]/g, '').replace(',', '')) * (values[7].includes('(') ? -1 : 1) || 0,
      marketValue: parseFloat(values[8]) || 0,
      principle: parseFloat(values[9]) || 0,
    };
  }).filter(row => row.shareValue > 0);
}

export function parsePortfolioData(data: any[]): PortfolioData[] {
  return data.slice(1).map(row => ({
    date: row[0],
    shareValue: parseFloat(row[1]) || 0,
    sha: parseFloat(row[2]) || 0,
    she: parseFloat(row[3]) || 0,
    csi300: parseFloat(row[4]) || 0,
    shares: parseFloat(row[5]) || 0,
    gainLoss: parseFloat(row[6]) || 0,
    dailyGain: parseFloat(row[7]) || 0,
    marketValue: parseFloat(row[8]) || 0,
    principle: parseFloat(row[9]) || 0,
  })).filter(row => row.shareValue > 0);
}

export function calculateCorrelation(values1: number[], values2: number[]): number {
  const n = Math.min(values1.length, values2.length);
  if (n === 0) return 0;

  const mean1 = values1.reduce((a, b) => a + b, 0) / n;
  const mean2 = values2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sum1 = 0;
  let sum2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    numerator += diff1 * diff2;
    sum1 += diff1 * diff1;
    sum2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sum1 * sum2);
  return denominator === 0 ? 0 : numerator / denominator;
}

export function calculateCorrelations(data: PortfolioData[]): CorrelationData {
  const shareValues = data.map(d => d.shareValue);
  const shaValues = data.map(d => d.sha);
  const sheValues = data.map(d => d.she);
  const csi300Values = data.map(d => d.csi300);

  return {
    sha: calculateCorrelation(shareValues, shaValues),
    she: calculateCorrelation(shareValues, sheValues),
    csi300: calculateCorrelation(shareValues, csi300Values),
  };
}

export function calculateAnnualReturns(data: PortfolioData[]): AnnualReturn[] {
  const yearlyData = new Map<number, { first: PortfolioData; last: PortfolioData }>();

  data.forEach(row => {
    const year = new Date(row.date).getFullYear();
    if (!yearlyData.has(year)) {
      yearlyData.set(year, { first: row, last: row });
    } else {
      const existing = yearlyData.get(year)!;
      yearlyData.set(year, { first: existing.first, last: row });
    }
  });

  return Array.from(yearlyData.entries())
    .map(([year, { first, last }]) => ({
      year,
      fundReturn: ((last.shareValue - first.shareValue) / first.shareValue) * 100,
      shaReturn: ((last.sha - first.sha) / first.sha) * 100,
      sheReturn: ((last.she - first.she) / first.she) * 100,
      csi300Return: ((last.csi300 - first.csi300) / first.csi300) * 100,
    }))
    .sort((a, b) => a.year - b.year);
}

// Calculate daily returns
export function calculateDailyReturns(data: PortfolioData[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const current = data[i].shareValue;
    const previous = data[i - 1].shareValue;
    if (previous > 0) {
      returns.push((current - previous) / previous);
    }
  }
  return returns;
}

// Calculate benchmark daily returns
export function calculateBenchmarkDailyReturns(data: PortfolioData[], benchmark: 'sha' | 'she' | 'csi300'): number[] {
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const current = data[i][benchmark];
    const previous = data[i - 1][benchmark];
    if (previous > 0) {
      returns.push((current - previous) / previous);
    }
  }
  return returns;
}

// Calculate standard deviation (volatility)
export function calculateVolatility(returns: number[], annualized: boolean = true): number {
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance);
  
  return annualized ? volatility * Math.sqrt(252) : volatility;
}

// Calculate Sharpe ratio
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const volatility = calculateVolatility(returns, false);
  
  if (volatility === 0) return 0;
  
  const annualizedReturn = meanReturn * 252;
  const annualizedVolatility = volatility * Math.sqrt(252);
  
  return (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

// Calculate Sortino ratio (focuses on downside deviation)
export function calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const negativeReturns = returns.filter(r => r < 0);
  
  if (negativeReturns.length === 0) return Infinity;
  
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  if (downsideDeviation === 0) return Infinity;
  
  const annualizedReturn = meanReturn * 252;
  const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(252);
  
  return (annualizedReturn - riskFreeRate) / annualizedDownsideDeviation;
}

// Calculate maximum drawdown
export function calculateMaxDrawdown(data: PortfolioData[]): number {
  if (data.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = data[0].shareValue;
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i].shareValue;
    if (current > peak) {
      peak = current;
    } else {
      const drawdown = (peak - current) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100; // Return as percentage
}

// Calculate Beta (sensitivity to market movements)
export function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
  if (portfolioReturns.length === 0 || benchmarkReturns.length === 0) return 0;
  
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const portfolioMean = portfolioReturns.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
  const benchmarkMean = benchmarkReturns.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
  
  let covariance = 0;
  let benchmarkVariance = 0;
  
  for (let i = 0; i < n; i++) {
    const portfolioDiff = portfolioReturns[i] - portfolioMean;
    const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
    covariance += portfolioDiff * benchmarkDiff;
    benchmarkVariance += benchmarkDiff * benchmarkDiff;
  }
  
  return benchmarkVariance === 0 ? 0 : covariance / benchmarkVariance;
}

// Calculate Alpha (excess return after adjusting for risk)
export function calculateAlpha(portfolioReturns: number[], benchmarkReturns: number[], riskFreeRate: number = 0.02): number {
  const beta = calculateBeta(portfolioReturns, benchmarkReturns);
  const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
  
  const annualizedPortfolioReturn = portfolioMean * 252;
  const annualizedBenchmarkReturn = benchmarkMean * 252;
  
  return annualizedPortfolioReturn - (riskFreeRate + beta * (annualizedBenchmarkReturn - riskFreeRate));
}

// Calculate Calmar ratio (return vs max drawdown)
export function calculateCalmarRatio(annualizedReturn: number, maxDrawdown: number): number {
  return maxDrawdown === 0 ? Infinity : annualizedReturn / maxDrawdown;
}

// Calculate Information ratio
export function calculateInformationRatio(portfolioReturns: number[], benchmarkReturns: number[]): number {
  if (portfolioReturns.length === 0 || benchmarkReturns.length === 0) return 0;
  
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const excessReturns = [];
  
  for (let i = 0; i < n; i++) {
    excessReturns.push(portfolioReturns[i] - benchmarkReturns[i]);
  }
  
  const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
  const trackingError = calculateVolatility(excessReturns, false);
  
  return trackingError === 0 ? 0 : (meanExcessReturn * 252) / (trackingError * Math.sqrt(252));
}

// Calculate comprehensive risk metrics
export function calculateRiskMetrics(data: PortfolioData[]): RiskMetrics {
  if (data.length === 0) {
    return {
      volatility: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      beta: { sha: 0, she: 0, csi300: 0 },
      alpha: { sha: 0, she: 0, csi300: 0 },
      calmarRatio: 0,
      informationRatio: 0,
    };
  }

  const portfolioReturns = calculateDailyReturns(data);
  const shaReturns = calculateBenchmarkDailyReturns(data, 'sha');
  const sheReturns = calculateBenchmarkDailyReturns(data, 'she');
  const csi300Returns = calculateBenchmarkDailyReturns(data, 'csi300');
  
  const volatility = calculateVolatility(portfolioReturns);
  const sharpeRatio = calculateSharpeRatio(portfolioReturns);
  const sortinoRatio = calculateSortinoRatio(portfolioReturns);
  const maxDrawdown = calculateMaxDrawdown(data);
  
  const beta = {
    sha: calculateBeta(portfolioReturns, shaReturns),
    she: calculateBeta(portfolioReturns, sheReturns),
    csi300: calculateBeta(portfolioReturns, csi300Returns),
  };
  
  const alpha = {
    sha: calculateAlpha(portfolioReturns, shaReturns),
    she: calculateAlpha(portfolioReturns, sheReturns),
    csi300: calculateAlpha(portfolioReturns, csi300Returns),
  };
  
  const first = data[0];
  const last = data[data.length - 1];
  const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const annualizedReturn = (Math.pow(last.shareValue / first.shareValue, 1 / years) - 1) * 100;
  
  const calmarRatio = calculateCalmarRatio(annualizedReturn, maxDrawdown);
  
  // Calculate average benchmark returns for information ratio
  const avgBenchmarkReturns = [];
  for (let i = 0; i < Math.min(shaReturns.length, sheReturns.length, csi300Returns.length); i++) {
    avgBenchmarkReturns.push((shaReturns[i] + sheReturns[i] + csi300Returns[i]) / 3);
  }
  
  const informationRatio = calculateInformationRatio(portfolioReturns, avgBenchmarkReturns);
  
  return {
    volatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    beta,
    alpha,
    calmarRatio,
    informationRatio,
  };
}

// Calculate rolling metrics
export function calculateRollingMetrics(data: PortfolioData[], window: number): RollingMetrics[] {
  const results: RollingMetrics[] = [];
  
  // Calculate all daily returns once for efficiency
  const allPortfolioReturns = calculateDailyReturns(data);
  const allShaReturns = calculateBenchmarkDailyReturns(data, 'sha');
  const allSheReturns = calculateBenchmarkDailyReturns(data, 'she');
  const allCsi300Returns = calculateBenchmarkDailyReturns(data, 'csi300');
  
  // Start from the minimum window size to ensure we have enough data
  const minWindow = Math.min(30, window);
  
  for (let i = minWindow; i < data.length; i++) {
    const currentDate = data[i].date;
    
    // Calculate rolling returns for different periods
    const return30d = i >= 30 ? ((data[i].shareValue - data[i - 30].shareValue) / data[i - 30].shareValue) * 100 : 0;
    const return60d = i >= 60 ? ((data[i].shareValue - data[i - 60].shareValue) / data[i - 60].shareValue) * 100 : 0;
    const return90d = i >= 90 ? ((data[i].shareValue - data[i - 90].shareValue) / data[i - 90].shareValue) * 100 : 0;
    
    // Calculate rolling volatilities
    const volatility30d = i >= 30 ? calculateVolatility(allPortfolioReturns.slice(i - 30, i)) : 0;
    const volatility60d = i >= 60 ? calculateVolatility(allPortfolioReturns.slice(i - 60, i)) : 0;
    const volatility90d = i >= 90 ? calculateVolatility(allPortfolioReturns.slice(i - 90, i)) : 0;
    
    // Calculate rolling Sharpe ratios
    const sharpe30d = i >= 30 ? calculateSharpeRatio(allPortfolioReturns.slice(i - 30, i)) : 0;
    const sharpe60d = i >= 60 ? calculateSharpeRatio(allPortfolioReturns.slice(i - 60, i)) : 0;
    const sharpe90d = i >= 90 ? calculateSharpeRatio(allPortfolioReturns.slice(i - 90, i)) : 0;
    
    // Calculate rolling correlations
    const correlation30d = {
      sha: i >= 30 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 30, i), 
        allShaReturns.slice(i - 30, i)
      ) : 0,
      she: i >= 30 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 30, i), 
        allSheReturns.slice(i - 30, i)
      ) : 0,
      csi300: i >= 30 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 30, i), 
        allCsi300Returns.slice(i - 30, i)
      ) : 0,
    };
    
    const correlation60d = {
      sha: i >= 60 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 60, i), 
        allShaReturns.slice(i - 60, i)
      ) : 0,
      she: i >= 60 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 60, i), 
        allSheReturns.slice(i - 60, i)
      ) : 0,
      csi300: i >= 60 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 60, i), 
        allCsi300Returns.slice(i - 60, i)
      ) : 0,
    };
    
    const correlation90d = {
      sha: i >= 90 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 90, i), 
        allShaReturns.slice(i - 90, i)
      ) : 0,
      she: i >= 90 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 90, i), 
        allSheReturns.slice(i - 90, i)
      ) : 0,
      csi300: i >= 90 ? calculateCorrelation(
        allPortfolioReturns.slice(i - 90, i), 
        allCsi300Returns.slice(i - 90, i)
      ) : 0,
    };
    
    results.push({
      date: currentDate,
      return30d,
      return60d,
      return90d,
      volatility30d,
      volatility60d,
      volatility90d,
      sharpe30d,
      sharpe60d,
      sharpe90d,
      correlation30d,
      correlation60d,
      correlation90d,
    });
  }
  
  return results;
}

// Helper function to calculate period return
function calculatePeriodReturn(data: PortfolioData[], days: number): number {
  if (data.length < days) return 0;
  const start = data[0];
  const end = data[data.length - 1];
  return ((end.shareValue - start.shareValue) / start.shareValue) * 100;
}

export function calculateOverallMetrics(data: PortfolioData[]) {
  if (data.length === 0) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  const totalReturn = ((last.shareValue - first.shareValue) / first.shareValue) * 100;
  const annualizedReturn = (Math.pow(last.shareValue / first.shareValue, 1 / years) - 1) * 100;

  // Calculate benchmark returns
  const shaReturn = ((last.sha - first.sha) / first.sha) * 100;
  const sheReturn = ((last.she - first.she) / first.she) * 100;
  const csi300Return = ((last.csi300 - first.csi300) / first.csi300) * 100;
  
  // Calculate average benchmark return
  const avgBenchmarkReturn = (shaReturn + sheReturn + csi300Return) / 3;
  const outperformance = totalReturn - avgBenchmarkReturn;
  
  // Calculate annualized benchmark returns
  const shaAnnualized = (Math.pow(last.sha / first.sha, 1 / years) - 1) * 100;
  const sheAnnualized = (Math.pow(last.she / first.she, 1 / years) - 1) * 100;
  const csi300Annualized = (Math.pow(last.csi300 / first.csi300, 1 / years) - 1) * 100;
  const avgBenchmarkAnnualized = (shaAnnualized + sheAnnualized + csi300Annualized) / 3;

  return {
    totalReturn,
    annualizedReturn,
    currentShareValue: last.shareValue || 0,
    totalShares: last.shares || 0,
    totalMarketValue: last.marketValue || 0,
    totalPrinciple: last.principle || 0,
    // Benchmark comparisons
    shaReturn,
    sheReturn,
    csi300Return,
    avgBenchmarkReturn,
    outperformance,
    shaAnnualized,
    sheAnnualized,
    csi300Annualized,
    avgBenchmarkAnnualized,
    annualizedOutperformance: annualizedReturn - avgBenchmarkAnnualized,
  };
}
