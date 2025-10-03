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

export function calculateOverallMetrics(data: PortfolioData[]) {
  if (data.length === 0) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  const totalReturn = ((last.shareValue - first.shareValue) / first.shareValue) * 100;
  const annualizedReturn = (Math.pow(last.shareValue / first.shareValue, 1 / years) - 1) * 100;

  return {
    totalReturn,
    annualizedReturn,
    currentShareValue: last.shareValue,
    totalShares: last.shares,
    totalMarketValue: last.marketValue,
    totalGainLoss: last.gainLoss,
    totalPrinciple: last.principle,
  };
}
