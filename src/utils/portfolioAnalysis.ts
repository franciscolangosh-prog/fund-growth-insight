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
  nikkei225: number;
  tsx: number;
  klse: number;
  cac40: number;
  dax: number;
  sti: number;
  asx200: number;
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
  nikkei225Return: number;
  tsxReturn: number;
  klseReturn: number;
  cac40Return: number;
  daxReturn: number;
  stiReturn: number;
  asx200Return: number;
}

export interface CorrelationData {
  sha: number;
  she: number;
  csi300: number;
  sp500: number;
  nasdaq: number;
  ftse100: number;
  hangseng: number;
  nikkei225: number;
  tsx: number;
  klse: number;
  cac40: number;
  dax: number;
  sti: number;
  asx200: number;
}

export interface SimplifiedPortfolioData {
  date: string;
  shares: number;
  shareValue: number;
  principle: number;
  marketValue: number;
}

export interface UserPortfolioInput {
  date: string;
  principle: number;
  marketValue: number;
}

export interface ConversionResult {
  data: SimplifiedPortfolioData[];
  errors: string[];
}

// Convert user-friendly format (principle + market_value) to share_value format
// Logic: shares = principle (treating initial investment as 1 share per dollar)
//        share_value = market_value / shares
// When principle changes: buy/sell shares at previous share_value
// 
// Business Rules:
// - Day 1: principle must be > 0 (initial investment required)
// - Other days: principle can be 0 or negative (withdrawals exceeding total invested)
// - shares and shareValue must always be > 0
export function convertToShareValue(data: UserPortfolioInput[]): ConversionResult {
  const errors: string[] = [];

  if (data.length === 0) return { data: [], errors: ['No data to process'] };

  // Sort by date to ensure chronological order
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Validate Day 1: principle must be positive
  if (sorted[0].principle <= 0) {
    errors.push(`Day 1 (${sorted[0].date}): principle must be positive, got ${sorted[0].principle}`);
    return { data: [], errors };
  }

  // Validate Day 1: market_value must be positive
  if (sorted[0].marketValue <= 0) {
    errors.push(`Day 1 (${sorted[0].date}): market_value must be positive, got ${sorted[0].marketValue}`);
    return { data: [], errors };
  }

  const result: SimplifiedPortfolioData[] = [];
  let currentShares = 0;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    if (i === 0) {
      // Day 1: shares = principle, share_value = market_value / shares
      currentShares = entry.principle;
      const shareValue = entry.marketValue / currentShares;

      result.push({
        date: entry.date,
        shares: parseFloat(currentShares.toFixed(4)),
        shareValue: parseFloat(shareValue.toFixed(4)),
        principle: entry.principle,
        marketValue: entry.marketValue,
      });
    } else {
      const prevEntry = sorted[i - 1];
      const prevShareValue = result[i - 1].shareValue;

      if (entry.principle !== prevEntry.principle) {
        // Principle changed - buy/sell shares at previous share_value
        const principleChange = entry.principle - prevEntry.principle;
        const sharesChange = principleChange / prevShareValue;
        currentShares = currentShares + sharesChange;
      }
      // If principle unchanged, shares remain the same

      // Validate: shares must remain positive after transaction
      if (currentShares <= 0) {
        errors.push(`Row ${i + 1} (${entry.date}): withdrawal too large, shares would become ${currentShares.toFixed(4)} (must be > 0)`);
        return { data: [], errors };
      }

      // Validate: market_value must be positive
      if (entry.marketValue <= 0) {
        errors.push(`Row ${i + 1} (${entry.date}): market_value must be positive, got ${entry.marketValue}`);
        return { data: [], errors };
      }

      // Calculate new share_value based on current market_value and shares
      const shareValue = entry.marketValue / currentShares;

      result.push({
        date: entry.date,
        shares: parseFloat(currentShares.toFixed(4)),
        shareValue: parseFloat(shareValue.toFixed(4)),
        principle: entry.principle,
        marketValue: entry.marketValue,
      });
    }
  }

  return { data: result, errors: [] };
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

export interface ParseCSVResult {
  data: SimplifiedPortfolioData[] | PortfolioData[];
  errors: string[];
}

export function parseCSV(csvText: string): ParseCSVResult {
  const lines = csvText.trim().split('\n');

  // Detect if first line is a sheet name or actual header
  const firstLine = lines[0].toLowerCase();
  const hasSheetNameRow = !firstLine.includes('date') && !firstLine.includes('principle') && !firstLine.includes('market');

  const headerLineIndex = hasSheetNameRow ? 1 : 0;
  const dataStartIndex = headerLineIndex + 1;
  const header = lines[headerLineIndex].toLowerCase();

  // Detect format type
  // Check isOldFullFormat FIRST since it's more specific (has SHA, SHE, CSI300 columns)
  // The old format also contains 'market_value' column, so we must check for it first
  const isOldFullFormat = header.includes('sha') && header.includes('she') && header.includes('csi300');
  const isUserFriendlyFormat = header.includes('market_value') || header.includes('marketvalue') || header.includes('market value');

  if (isOldFullFormat) {
    // Parse old format (includes market indices)
    // Header: Date,SHA,SHE,CSI300,Share,Share_V,Gain_Loss,DailyGain,Market_Value,Principle,SP500,Nasdaq,FTSE100,HangSeng
    const parsedData: PortfolioData[] = [];
    let lastValues = {
      sp500: 0,
      nasdaq: 0,
      ftse100: 0,
      hangseng: 0,
      nikkei225: 0,
      tsx: 0,
      klse: 0,
      cac40: 0,
      dax: 0,
      sti: 0,
      asx200: 0,
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
        nikkei225: 0, // Not in old CSV format
        tsx: 0,
        klse: 0,
        cac40: 0,
        dax: 0,
        sti: 0,
        asx200: 0,
      };

      if (row.shareValue > 0) {
        parsedData.push(row);
      }
    });

    return { data: parsedData, errors: [] };
  } else if (isUserFriendlyFormat) {
    // Parse user-friendly format (date, principle, market_value)
    // Note: principle can be 0 or negative for non-first rows (withdrawals exceeding total invested)
    // Only market_value must always be positive
    const userInput: UserPortfolioInput[] = [];

    lines.slice(dataStartIndex).forEach(line => {
      if (!line.trim()) return; // Skip empty lines
      const values = line.split(',').map(v => v.trim());

      const formattedDate = parseDateToISO(values[0]);
      const principle = parseFloat(values[1]);
      const marketValue = parseFloat(values[2]);

      // Only skip rows with invalid/missing values (NaN)
      // Allow principle to be any number (including 0 or negative)
      // market_value validation will be done in convertToShareValue
      if (!isNaN(principle) && !isNaN(marketValue)) {
        userInput.push({
          date: formattedDate,
          principle,
          marketValue,
        });
      }
    });

    const conversionResult = convertToShareValue(userInput);
    return { data: conversionResult.data, errors: conversionResult.errors };
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
        shares,
        shareValue,
        principle,
        marketValue: shares * shareValue,
      };

      if (row.shareValue > 0) {
        parsedData.push(row);
      }
    });

    return { data: parsedData, errors: [] };
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
    nikkei225: 0,
    tsx: 0,
    klse: 0,
    cac40: 0,
    dax: 0,
    sti: 0,
    asx200: 0,
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
  const nikkei225Values = data.map(d => d.nikkei225);
  const tsxValues = data.map(d => d.tsx);
  const klseValues = data.map(d => d.klse);
  const cac40Values = data.map(d => d.cac40);
  const daxValues = data.map(d => d.dax);
  const stiValues = data.map(d => d.sti);
  const asx200Values = data.map(d => d.asx200);

  return {
    sha: calculateCorrelation(shareValues, shaValues),
    she: calculateCorrelation(shareValues, sheValues),
    csi300: calculateCorrelation(shareValues, csi300Values),
    sp500: calculateCorrelation(shareValues, sp500Values),
    nasdaq: calculateCorrelation(shareValues, nasdaqValues),
    ftse100: calculateCorrelation(shareValues, ftse100Values),
    hangseng: calculateCorrelation(shareValues, hangsengValues),
    nikkei225: calculateCorrelation(shareValues, nikkei225Values),
    tsx: calculateCorrelation(shareValues, tsxValues),
    klse: calculateCorrelation(shareValues, klseValues),
    cac40: calculateCorrelation(shareValues, cac40Values),
    dax: calculateCorrelation(shareValues, daxValues),
    sti: calculateCorrelation(shareValues, stiValues),
    asx200: calculateCorrelation(shareValues, asx200Values),
  };
}

export function calculateAnnualReturns(data: PortfolioData[]): AnnualReturn[] {
  const yearlyData = new Map<number, { firstIndex: number; lastIndex: number }>();

  data.forEach((row, index) => {
    const year = new Date(row.date).getFullYear();
    if (!yearlyData.has(year)) {
      yearlyData.set(year, { firstIndex: index, lastIndex: index });
    } else {
      const existing = yearlyData.get(year)!;
      yearlyData.set(year, { firstIndex: existing.firstIndex, lastIndex: index });
    }
  });

  // Helper to find the closest valid value for an index field
  // For start of year: search forward within year first, then backward to previous data
  // For end of year: search backward within year first, then forward to next data
  const findValidValueForStart = (
    startIndex: number,
    endIndex: number,
    field: keyof PortfolioData
  ): number => {
    // First try the exact index
    if (Number(data[startIndex][field]) > 0) {
      return Number(data[startIndex][field]);
    }

    // Search forward within the year range first
    for (let i = startIndex + 1; i <= endIndex; i++) {
      if (Number(data[i][field]) > 0) {
        return Number(data[i][field]);
      }
    }
    // Then search backward to find closest previous value
    for (let i = startIndex - 1; i >= 0; i--) {
      if (Number(data[i][field]) > 0) {
        return Number(data[i][field]);
      }
    }
    return 0;
  };

  const findValidValueForEnd = (
    startIndex: number,
    endIndex: number,
    field: keyof PortfolioData
  ): number => {
    // First try the exact index
    if (Number(data[endIndex][field]) > 0) {
      return Number(data[endIndex][field]);
    }

    // Search backward within the year range first
    for (let i = endIndex - 1; i >= startIndex; i--) {
      if (Number(data[i][field]) > 0) {
        return Number(data[i][field]);
      }
    }
    // Then search forward to find closest next value
    for (let i = endIndex + 1; i < data.length; i++) {
      if (Number(data[i][field]) > 0) {
        return Number(data[i][field]);
      }
    }
    return 0;
  };

  return Array.from(yearlyData.entries())
    .map(([year, { firstIndex, lastIndex }]) => {
      const first = data[firstIndex];
      const last = data[lastIndex];

      // For global indices, find valid start and end values
      const sp500Start = findValidValueForStart(firstIndex, lastIndex, 'sp500');
      const sp500End = findValidValueForEnd(firstIndex, lastIndex, 'sp500');
      const nasdaqStart = findValidValueForStart(firstIndex, lastIndex, 'nasdaq');
      const nasdaqEnd = findValidValueForEnd(firstIndex, lastIndex, 'nasdaq');
      const ftse100Start = findValidValueForStart(firstIndex, lastIndex, 'ftse100');
      const ftse100End = findValidValueForEnd(firstIndex, lastIndex, 'ftse100');
      const hangsengStart = findValidValueForStart(firstIndex, lastIndex, 'hangseng');
      const hangsengEnd = findValidValueForEnd(firstIndex, lastIndex, 'hangseng');
      const nikkei225Start = findValidValueForStart(firstIndex, lastIndex, 'nikkei225');
      const nikkei225End = findValidValueForEnd(firstIndex, lastIndex, 'nikkei225');
      const tsxStart = findValidValueForStart(firstIndex, lastIndex, 'tsx');
      const tsxEnd = findValidValueForEnd(firstIndex, lastIndex, 'tsx');
      const klseStart = findValidValueForStart(firstIndex, lastIndex, 'klse');
      const klseEnd = findValidValueForEnd(firstIndex, lastIndex, 'klse');
      const cac40Start = findValidValueForStart(firstIndex, lastIndex, 'cac40');
      const cac40End = findValidValueForEnd(firstIndex, lastIndex, 'cac40');
      const daxStart = findValidValueForStart(firstIndex, lastIndex, 'dax');
      const daxEnd = findValidValueForEnd(firstIndex, lastIndex, 'dax');
      const stiStart = findValidValueForStart(firstIndex, lastIndex, 'sti');
      const stiEnd = findValidValueForEnd(firstIndex, lastIndex, 'sti');
      const asx200Start = findValidValueForStart(firstIndex, lastIndex, 'asx200');
      const asx200End = findValidValueForEnd(firstIndex, lastIndex, 'asx200');

      return {
        year,
        fundReturn: ((last.shareValue - first.shareValue) / first.shareValue) * 100,
        shaReturn: ((last.sha - first.sha) / first.sha) * 100,
        sheReturn: ((last.she - first.she) / first.she) * 100,
        csi300Return: ((last.csi300 - first.csi300) / first.csi300) * 100,
        sp500Return: sp500Start > 0 && sp500End > 0 ? ((sp500End - sp500Start) / sp500Start) * 100 : 0,
        nasdaqReturn: nasdaqStart > 0 && nasdaqEnd > 0 ? ((nasdaqEnd - nasdaqStart) / nasdaqStart) * 100 : 0,
        ftse100Return: ftse100Start > 0 && ftse100End > 0 ? ((ftse100End - ftse100Start) / ftse100Start) * 100 : 0,
        hangsengReturn: hangsengStart > 0 && hangsengEnd > 0 ? ((hangsengEnd - hangsengStart) / hangsengStart) * 100 : 0,
        nikkei225Return: nikkei225Start > 0 && nikkei225End > 0 ? ((nikkei225End - nikkei225Start) / nikkei225Start) * 100 : 0,
        tsxReturn: tsxStart > 0 && tsxEnd > 0 ? ((tsxEnd - tsxStart) / tsxStart) * 100 : 0,
        klseReturn: klseStart > 0 && klseEnd > 0 ? ((klseEnd - klseStart) / klseStart) * 100 : 0,
        cac40Return: cac40Start > 0 && cac40End > 0 ? ((cac40End - cac40Start) / cac40Start) * 100 : 0,
        daxReturn: daxStart > 0 && daxEnd > 0 ? ((daxEnd - daxStart) / daxStart) * 100 : 0,
        stiReturn: stiStart > 0 && stiEnd > 0 ? ((stiEnd - stiStart) / stiStart) * 100 : 0,
        asx200Return: asx200Start > 0 && asx200End > 0 ? ((asx200End - asx200Start) / asx200Start) * 100 : 0,
      };
    })
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

  // Helper to find the first valid value (searching forward from start)
  const findFirstValidValue = (field: keyof PortfolioData): number => {
    for (let i = 0; i < data.length; i++) {
      if (Number(data[i][field]) > 0) {
        return Number(data[i][field]);
      }
    }
    return 0;
  };

  // Helper to find the last valid value (searching backward from end)
  const findLastValidValue = (field: keyof PortfolioData): number => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (Number(data[i][field]) > 0) {
        return Number(data[i][field]);
      }
    }
    return 0;
  };

  // Calculate annualized global market indices returns using first/last valid values
  const sp500First = findFirstValidValue('sp500');
  const sp500Last = findLastValidValue('sp500');
  const nasdaqFirst = findFirstValidValue('nasdaq');
  const nasdaqLast = findLastValidValue('nasdaq');
  const ftse100First = findFirstValidValue('ftse100');
  const ftse100Last = findLastValidValue('ftse100');
  const hangsengFirst = findFirstValidValue('hangseng');
  const hangsengLast = findLastValidValue('hangseng');
  const nikkei225First = findFirstValidValue('nikkei225');
  const nikkei225Last = findLastValidValue('nikkei225');
  const tsxFirst = findFirstValidValue('tsx');
  const tsxLast = findLastValidValue('tsx');
  const klseFirst = findFirstValidValue('klse');
  const klseLast = findLastValidValue('klse');
  const cac40First = findFirstValidValue('cac40');
  const cac40Last = findLastValidValue('cac40');
  const daxFirst = findFirstValidValue('dax');
  const daxLast = findLastValidValue('dax');
  const stiFirst = findFirstValidValue('sti');
  const stiLast = findLastValidValue('sti');
  const asx200First = findFirstValidValue('asx200');
  const asx200Last = findLastValidValue('asx200');

  const sp500Annualized = sp500First > 0 && sp500Last > 0 ? (Math.pow(sp500Last / sp500First, 1 / years) - 1) * 100 : 0;
  const nasdaqAnnualized = nasdaqFirst > 0 && nasdaqLast > 0 ? (Math.pow(nasdaqLast / nasdaqFirst, 1 / years) - 1) * 100 : 0;
  const ftse100Annualized = ftse100First > 0 && ftse100Last > 0 ? (Math.pow(ftse100Last / ftse100First, 1 / years) - 1) * 100 : 0;
  const hangsengAnnualized = hangsengFirst > 0 && hangsengLast > 0 ? (Math.pow(hangsengLast / hangsengFirst, 1 / years) - 1) * 100 : 0;
  const nikkei225Annualized = nikkei225First > 0 && nikkei225Last > 0 ? (Math.pow(nikkei225Last / nikkei225First, 1 / years) - 1) * 100 : 0;
  const tsxAnnualized = tsxFirst > 0 && tsxLast > 0 ? (Math.pow(tsxLast / tsxFirst, 1 / years) - 1) * 100 : 0;
  const klseAnnualized = klseFirst > 0 && klseLast > 0 ? (Math.pow(klseLast / klseFirst, 1 / years) - 1) * 100 : 0;
  const cac40Annualized = cac40First > 0 && cac40Last > 0 ? (Math.pow(cac40Last / cac40First, 1 / years) - 1) * 100 : 0;
  const daxAnnualized = daxFirst > 0 && daxLast > 0 ? (Math.pow(daxLast / daxFirst, 1 / years) - 1) * 100 : 0;
  const stiAnnualized = stiFirst > 0 && stiLast > 0 ? (Math.pow(stiLast / stiFirst, 1 / years) - 1) * 100 : 0;
  const asx200Annualized = asx200First > 0 && asx200Last > 0 ? (Math.pow(asx200Last / asx200First, 1 / years) - 1) * 100 : 0;

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
    nikkei225Annualized,
    tsxAnnualized,
    klseAnnualized,
    cac40Annualized,
    daxAnnualized,
    stiAnnualized,
    asx200Annualized,
  };
}
