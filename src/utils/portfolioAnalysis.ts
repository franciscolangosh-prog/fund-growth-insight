export interface PortfolioData {
  date: string;
  shareValue: number;
  sha: number;
  she: number;
  csi300: number;
  sp500: number;
  nasdaq: number;
  ftse100: number;
  hangseng: number;
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
  sp500Return: number;
  nasdaqReturn: number;
  ftse100Return: number;
  hangsengReturn: number;
}

export interface CorrelationData {
  sha: number;
  she: number;
  csi300: number;
  sp500: number;
  nasdaq: number;
  ftse100: number;
  hangseng: number;
}

export interface SimplifiedPortfolioData {
  date: string;
  shareValue: number;
  principle: number;
  marketValue: number;
}

export interface UserPortfolioInput {
  date: string;
  principle: number;
  marketValue: number;
}

// Convert user-friendly format (principle + market_value) to share_value format
export function convertToShareValue(data: UserPortfolioInput[]): SimplifiedPortfolioData[] {
  if (data.length === 0) return [];
  
  // Sort by date to ensure chronological order
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const result: SimplifiedPortfolioData[] = [];
  let currentShares = 0;
  
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    let shareValue: number;
    
    if (i === 0) {
      // First entry: initialize with share value of 1.0
      shareValue = 1.0;
      currentShares = entry.principle / shareValue;
    } else {
      const prevEntry = sorted[i - 1];
      const prevShareValue = result[i - 1].shareValue;
      const prevShares = currentShares;
      
      if (entry.principle === prevEntry.principle) {
        // No new investment/withdrawal - calculate new share value based on market value change
        shareValue = entry.marketValue / prevShares;
      } else if (entry.principle > prevEntry.principle) {
        // New investment - calculate shares bought at current share value
        const addedPrinciple = entry.principle - prevEntry.principle;
        // First calculate current share value from existing shares
        const currentShareValue = entry.marketValue / (prevShares + (addedPrinciple / prevShareValue));
        shareValue = currentShareValue;
        currentShares = prevShares + (addedPrinciple / prevShareValue);
      } else {
        // Withdrawal - calculate shares sold
        const withdrawnPrinciple = prevEntry.principle - entry.principle;
        const withdrawnShares = withdrawnPrinciple / prevShareValue;
        currentShares = prevShares - withdrawnShares;
        shareValue = currentShares > 0 ? entry.marketValue / currentShares : prevShareValue;
      }
      
      // Update shares for next iteration if principle changed
      if (entry.principle !== prevEntry.principle) {
        currentShares = entry.principle / shareValue;
      }
    }
    
    result.push({
      date: entry.date,
      principle: entry.principle,
      shareValue: parseFloat(shareValue.toFixed(4)),
      marketValue: entry.marketValue,
    });
  }
  
  return result;
}

// Helper function to parse date from various formats to YYYY-MM-DD
function parseDateToISO(dateStr: string): string {
  // Try different delimiters: /, -, .
  let parts: string[] = [];
  
  if (dateStr.includes('/')) {
    parts = dateStr.split('/');
  } else if (dateStr.includes('-')) {
    // Check if it's already YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    parts = dateStr.split('-');
  } else if (dateStr.includes('.')) {
    parts = dateStr.split('.');
  }
  
  if (parts.length === 3) {
    // Assume DD/MM/YYYY or DD-MM-YYYY format
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return dateStr; // Return as-is if can't parse
}

export function parseCSV(csvText: string): SimplifiedPortfolioData[] | PortfolioData[] {
  const lines = csvText.trim().split('\n');
  
  // Detect if first line is a sheet name or actual header
  const firstLine = lines[0].toLowerCase();
  const hasSheetNameRow = !firstLine.includes('date') && !firstLine.includes('principle') && !firstLine.includes('market');
  
  const headerLineIndex = hasSheetNameRow ? 1 : 0;
  const dataStartIndex = headerLineIndex + 1;
  const header = lines[headerLineIndex].toLowerCase();
  
  // Detect format type
  const isOldFullFormat = header.includes('sha') && header.includes('she') && header.includes('csi300');
  const isUserFriendlyFormat = header.includes('market_value') || header.includes('marketvalue') || header.includes('market value');
  
  if (isUserFriendlyFormat) {
    // Parse user-friendly format (date, principle, market_value)
    const userInput: UserPortfolioInput[] = [];

    lines.slice(dataStartIndex).forEach(line => {
      if (!line.trim()) return; // Skip empty lines
      const values = line.split(',').map(v => v.trim());
      
      const formattedDate = parseDateToISO(values[0]);
      const principle = parseFloat(values[1]) || 0;
      const marketValue = parseFloat(values[2]) || 0;
      
      if (principle > 0 && marketValue > 0) {
        userInput.push({
          date: formattedDate,
          principle,
          marketValue,
        });
      }
    });

    return convertToShareValue(userInput);
  } else if (isOldFullFormat) {
    // Parse old format (includes market indices)
    const parsedData: PortfolioData[] = [];
    let lastValues = {
      sp500: 0,
      nasdaq: 0,
      ftse100: 0,
      hangseng: 0,
    };

    lines.slice(dataStartIndex).forEach(line => {
      if (!line.trim()) return;
      const values = line.split(',').map(v => v.trim());
      
      const formattedDate = parseDateToISO(values[0]);
      // Parse global indices, use previous value if missing
      const sp500 = parseFloat(values[10]) || lastValues.sp500;
      const nasdaq = parseFloat(values[11]) || lastValues.nasdaq;
      const ftse100 = parseFloat(values[12]) || lastValues.ftse100;
      const hangseng = parseFloat(values[13]) || lastValues.hangseng;
      
      // Update last values for next iteration
      if (sp500 > 0) lastValues.sp500 = sp500;
      if (nasdaq > 0) lastValues.nasdaq = nasdaq;
      if (ftse100 > 0) lastValues.ftse100 = ftse100;
      if (hangseng > 0) lastValues.hangseng = hangseng;
      
      const row = {
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
        sp500,
        nasdaq,
        ftse100,
        hangseng,
      };
      
      if (row.shareValue > 0) {
        parsedData.push(row);
      }
    });

    return parsedData;
  } else {
    // Parse old simplified format (date, shares, share_value, gain_loss, principle) - for backward compatibility
    const parsedData: SimplifiedPortfolioData[] = [];

    lines.slice(dataStartIndex).forEach(line => {
      if (!line.trim()) return;
      const values = line.split(',').map(v => v.trim());
      
      const formattedDate = parseDateToISO(values[0]);
      const shares = parseFloat(values[1]) || 0;
      const shareValue = parseFloat(values[2]) || 0;
      const principle = parseFloat(values[4]) || 0;
      
      const row = {
        date: formattedDate,
        shareValue,
        principle,
        marketValue: shares * shareValue, // Calculate from shares * shareValue
      };
      
      if (row.shareValue > 0) {
        parsedData.push(row);
      }
    });

    return parsedData;
  }
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
    sp500: parseFloat(row[10]) || 0,
    nasdaq: parseFloat(row[11]) || 0,
    ftse100: parseFloat(row[12]) || 0,
    hangseng: parseFloat(row[13]) || 0,
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
  const sp500Values = data.map(d => d.sp500);
  const nasdaqValues = data.map(d => d.nasdaq);
  const ftse100Values = data.map(d => d.ftse100);
  const hangsengValues = data.map(d => d.hangseng);

  return {
    sha: calculateCorrelation(shareValues, shaValues),
    she: calculateCorrelation(shareValues, sheValues),
    csi300: calculateCorrelation(shareValues, csi300Values),
    sp500: calculateCorrelation(shareValues, sp500Values),
    nasdaq: calculateCorrelation(shareValues, nasdaqValues),
    ftse100: calculateCorrelation(shareValues, ftse100Values),
    hangseng: calculateCorrelation(shareValues, hangsengValues),
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
      sp500Return: first.sp500 > 0 ? ((last.sp500 - first.sp500) / first.sp500) * 100 : 0,
      nasdaqReturn: first.nasdaq > 0 ? ((last.nasdaq - first.nasdaq) / first.nasdaq) * 100 : 0,
      ftse100Return: first.ftse100 > 0 ? ((last.ftse100 - first.ftse100) / first.ftse100) * 100 : 0,
      hangsengReturn: first.hangseng > 0 ? ((last.hangseng - first.hangseng) / first.hangseng) * 100 : 0,
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

  // Calculate annualized global market indices returns
  const sp500Annualized = first.sp500 > 0 && last.sp500 > 0 ? (Math.pow(last.sp500 / first.sp500, 1 / years) - 1) * 100 : 0;
  const nasdaqAnnualized = first.nasdaq > 0 && last.nasdaq > 0 ? (Math.pow(last.nasdaq / first.nasdaq, 1 / years) - 1) * 100 : 0;
  const ftse100Annualized = first.ftse100 > 0 && last.ftse100 > 0 ? (Math.pow(last.ftse100 / first.ftse100, 1 / years) - 1) * 100 : 0;
  const hangsengAnnualized = first.hangseng > 0 && last.hangseng > 0 ? (Math.pow(last.hangseng / first.hangseng, 1 / years) - 1) * 100 : 0;

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
    // Global market indices annualized returns
    sp500Annualized,
    nasdaqAnnualized,
    ftse100Annualized,
    hangsengAnnualized,
  };
}
