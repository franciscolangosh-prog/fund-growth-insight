import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketData {
  date: string;
  sha?: number;
  she?: number;
  csi300?: number;
  sp500?: number;
  nasdaq?: number;
  ftse100?: number;
  hangseng?: number;
  nikkei225?: number;
  tsx?: number;
  klse?: number;
  cac40?: number;
  dax?: number;
  sti?: number;
  asx200?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { date } = await req.json();
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log(`Fetching market data for date: ${targetDate}`);

    // Try to fetch fresh data from APIs
    const marketData: MarketData = await fetchMarketDataFromAPIs(targetDate);

    // Build data to upsert with fresh values
    const dataToUpsert: Record<string, unknown> = { date: targetDate };
    const indexKeys = ['sha', 'she', 'csi300', 'sp500', 'nasdaq', 'ftse100', 'hangseng', 'nikkei225', 'tsx', 'klse', 'cac40', 'dax', 'sti', 'asx200'];
    
    indexKeys.forEach(key => {
      const value = marketData[key as keyof MarketData];
      if (value !== undefined) {
        dataToUpsert[key] = value;
      }
    });

    // FORWARD-FILL: For indices without fresh data, use the most recent available value
    const missingIndices = indexKeys.filter(key => dataToUpsert[key] === undefined);
    
    if (missingIndices.length > 0) {
      console.log(`Missing data for ${missingIndices.length} indices, attempting forward-fill...`);
      
      // Fetch the last 10 records to find non-null values for each missing index
      const { data: recentRecords } = await supabaseClient
        .from('market_indices')
        .select('*')
        .lt('date', targetDate)
        .order('date', { ascending: false })
        .limit(10);
      
      if (recentRecords && recentRecords.length > 0) {
        missingIndices.forEach(key => {
          // Find the most recent non-null value for this index
          for (const record of recentRecords) {
            const value = record[key];
            if (value !== null && value !== undefined) {
              dataToUpsert[key] = value;
              console.log(`Forward-filled ${key}: ${value} (from ${record.date})`);
              break;
            }
          }
        });
      }
    }

    let resultData = null;
    const valueCount = Object.keys(dataToUpsert).filter(k => k !== 'date').length;
    
    if (valueCount > 0) {
      const { data, error } = await supabaseClient
        .from('market_indices')
        .upsert(dataToUpsert, { onConflict: 'date' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting market data:', error);
        throw error;
      }

      resultData = data;
      console.log(`Market data updated successfully with ${valueCount} values (including forward-fill)`);
    } else {
      console.warn('No market data available from APIs or forward-fill');
    }

    return new Response(
      JSON.stringify({ success: true, data: resultData, marketData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-market-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Fetches market data with Chinese data sources as primary for Chinese indices
 * Uses sequential fetching with delays to avoid Yahoo Finance rate limiting (429 errors)
 */
async function fetchMarketDataFromAPIs(date: string): Promise<MarketData> {
  console.log(`Fetching real market data for ${date}`);
  
  const symbols: Array<{ key: string; yahoo: string; alpha: string; chinese?: string }> = [
    { key: 'sha', yahoo: '000001.SS', alpha: '000001.SS', chinese: 'sh000001' },
    { key: 'she', yahoo: '399001.SZ', alpha: '399001.SZ', chinese: 'sz399001' },
    { key: 'csi300', yahoo: '000300.SS', alpha: '000300.SS', chinese: 'sh000300' },
    { key: 'sp500', yahoo: '^GSPC', alpha: 'SPX' },
    { key: 'nasdaq', yahoo: '^IXIC', alpha: 'IXIC' },
    { key: 'ftse100', yahoo: '^FTSE', alpha: 'FTSE' },
    { key: 'hangseng', yahoo: '^HSI', alpha: 'HSI' },
    { key: 'nikkei225', yahoo: '^N225', alpha: 'N225' },
    { key: 'tsx', yahoo: '^GSPTSE', alpha: 'GSPTSE' },
    { key: 'klse', yahoo: '^KLSE', alpha: 'KLSE' },
    { key: 'cac40', yahoo: '^FCHI', alpha: 'FCHI' },
    { key: 'dax', yahoo: '^GDAXI', alpha: 'GDAXI' },
    { key: 'sti', yahoo: '^STI', alpha: 'STI' },
    { key: 'asx200', yahoo: '^AXJO', alpha: 'AXJO' },
  ];

  const marketData: MarketData = { date };

  // Fetch Chinese indices first (they use different API, no rate limiting issues)
  const chineseIndices = symbols.filter(s => s.chinese);
  for (const symbol of chineseIndices) {
    const value = await fetchChineseMarketData(symbol.chinese!, date);
    if (value !== undefined) {
      console.log(`Got ${symbol.key} from Chinese source: ${value}`);
      marketData[symbol.key as keyof Omit<MarketData, 'date'>] = value;
    }
  }

  // Fetch non-Chinese indices sequentially with delays to avoid rate limiting
  const nonChineseIndices = symbols.filter(s => !s.chinese);
  for (const symbol of nonChineseIndices) {
    let value: number | undefined;
    
    // Try Yahoo Finance with retry logic for rate limiting
    value = await fetchYahooFinanceDataWithRetry(symbol.yahoo, date);
    
    // If Yahoo fails, try Alpha Vantage as fallback
    if (value === undefined) {
      console.log(`Yahoo Finance failed for ${symbol.key}, trying Alpha Vantage...`);
      value = await fetchAlphaVantageData(symbol.alpha, date);
    }
    
    if (value !== undefined) {
      marketData[symbol.key as keyof Omit<MarketData, 'date'>] = value;
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return marketData;
}

// Fetch from Chinese financial data sources (similar to AkShare approach)
// Uses EastMoney API which is reliable for Chinese indices
async function fetchChineseMarketData(symbol: string, date: string): Promise<number | undefined> {
  try {
    // Try EastMoney first (more reliable)
    const value = await fetchEastMoneyData(symbol, date);
    if (value !== undefined) {
      return value;
    }
    
    // Try Sina as fallback
    return await fetchSinaData(symbol, date);
  } catch (error) {
    console.error(`Error fetching ${symbol} from Chinese sources:`, error);
    return undefined;
  }
}

// Fetch from EastMoney API for Chinese market data
async function fetchEastMoneyData(symbol: string, date: string): Promise<number | undefined> {
  try {
    // Convert symbol format: sh000300 -> 1.000300 (SH), sz399001 -> 0.399001 (SZ)
    const isShanghai = symbol.startsWith('sh');
    const code = symbol.slice(2);
    const secId = isShanghai ? `1.${code}` : `0.${code}`;
    
    // Calculate date range for the query
    const targetDate = new Date(date);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 5); // Get 5 days of data to ensure we have the target date
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secId}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57&klt=101&fqt=1&beg=${formatDate(startDate)}&end=${formatDate(targetDate)}&lmt=10`;
    
    console.log(`Fetching ${symbol} from EastMoney...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/'
      }
    });
    
    if (!response.ok) {
      console.warn(`EastMoney API error for ${symbol}: ${response.status}`);
      return undefined;
    }
    
    const data = await response.json();
    
    // Parse the response - klines format: ["date,open,close,high,low,volume,amount"]
    const klines = data?.data?.klines;
    if (!klines || !Array.isArray(klines)) {
      console.warn(`No klines data from EastMoney for ${symbol}`);
      return undefined;
    }
    
    // Find the target date's data
    for (const kline of klines) {
      const parts = kline.split(',');
      if (parts[0] === date && parts[2]) {
        const closePrice = parseFloat(parts[2]);
        if (!isNaN(closePrice) && closePrice > 0) {
          console.log(`${symbol} from EastMoney: ${closePrice}`);
          return closePrice;
        }
      }
    }
    
    console.warn(`Date ${date} not found in EastMoney response for ${symbol}`);
    return undefined;
    
  } catch (error) {
    console.error(`Error fetching ${symbol} from EastMoney:`, error);
    return undefined;
  }
}

// Fetch from Sina Finance API as fallback for Chinese market data
async function fetchSinaData(symbol: string, date: string): Promise<number | undefined> {
  try {
    const formattedDate = date.replace(/-/g, '');
    const url = `https://finance.sina.com.cn/realstock/company/${symbol}/hisdata/klc_kl.js?d=${formattedDate}`;
    
    console.log(`Fetching ${symbol} for ${date} from Sina Finance...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.sina.com.cn/'
      }
    });
    
    if (!response.ok) {
      console.warn(`Sina Finance API error for ${symbol}: ${response.status}`);
      return undefined;
    }
    
    const text = await response.text();
    
    // Parse the JavaScript response to extract price data
    const match = text.match(/close:"([\d.]+)"/);
    if (match && match[1]) {
      const closePrice = parseFloat(match[1]);
      if (!isNaN(closePrice) && closePrice > 0) {
        console.log(`${symbol} from Sina: ${closePrice}`);
        return closePrice;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error(`Error fetching ${symbol} from Sina:`, error);
    return undefined;
  }
}

/**
 * Fast fetch with short timeout (5 seconds max per request)
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches index data from Yahoo Finance with retry logic for rate limiting (429 errors)
 * Uses the proven approach from the reference implementation
 */
async function fetchYahooFinanceDataWithRetry(symbol: string, date: string, maxRetries = 3): Promise<number | undefined> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await fetchYahooFinanceData(symbol, date);
    if (result !== undefined) {
      return result;
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
      console.log(`Retrying ${symbol} in ${delay}ms (attempt ${attempt + 2}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return undefined;
}

/**
 * Fetches index data from Yahoo Finance using the proven v8/finance/chart endpoint
 * Uses interval=1d&range=1d for reliable current market data
 */
async function fetchYahooFinanceData(symbol: string, date: string): Promise<number | undefined> {
  try {
    // Use the simple and reliable endpoint format from reference implementation
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    
    console.log(`Fetching ${symbol} from Yahoo Finance...`);
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, 5000);

    if (response.status === 429) {
      console.warn(`Yahoo Finance rate limited for ${symbol}`);
      return undefined;
    }

    if (!response.ok) {
      console.warn(`Yahoo Finance HTTP ${response.status} for ${symbol}`);
      return undefined;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      console.warn(`No result data for ${symbol}`);
      return undefined;
    }
    
    const meta = result.meta;
    
    // Primary: Get regularMarketPrice from meta (most reliable for current data)
    const currentPrice = meta?.regularMarketPrice;
    if (currentPrice != null && !isNaN(currentPrice) && currentPrice > 0) {
      console.log(`${symbol}: ${currentPrice} (regularMarketPrice)`);
      return currentPrice;
    }
    
    // Fallback: Get previousClose if regularMarketPrice not available
    const previousClose = meta?.previousClose ?? meta?.chartPreviousClose;
    if (previousClose != null && !isNaN(previousClose) && previousClose > 0) {
      console.log(`${symbol}: ${previousClose} (previousClose)`);
      return previousClose;
    }
    
    // Last resort: Get from quote indicators
    const quote = result.indicators?.quote?.[0];
    const closePrice = quote?.close?.[quote.close.length - 1];
    if (closePrice != null && !isNaN(closePrice) && closePrice > 0) {
      console.log(`${symbol}: ${closePrice} (quote close)`);
      return closePrice;
    }
    
    console.warn(`No valid price data for ${symbol}`);
    return undefined;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown';
    if (msg.includes('abort')) {
      console.warn(`${symbol} request timeout`);
    } else {
      console.warn(`${symbol} error: ${msg}`);
    }
    return undefined;
  }
}

/**
 * Fetches index data from Alpha Vantage API as fallback
 * Requires ALPHA_VANTAGE_API_KEY environment variable
 */
async function fetchAlphaVantageData(symbol: string, date: string): Promise<number | undefined> {
  try {
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return undefined;
    }

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
    
    console.log(`Fetching ${symbol} from Alpha Vantage...`);
    
    const response = await fetchWithTimeout(url, {}, 10000);

    if (!response.ok) {
      console.error(`Alpha Vantage API error for ${symbol}: ${response.status}`);
      return undefined;
    }

    const data = await response.json();
    
    // Check for API limit or error
    if (data['Error Message'] || data['Note']) {
      console.warn(`Alpha Vantage issue for ${symbol}:`, data['Error Message'] || data['Note']);
      return undefined;
    }
    
    // Try to get the most recent available data
    const timeSeries = data['Time Series (Daily)'];
    if (timeSeries) {
      // First try the exact date
      if (timeSeries[date]) {
        const closePrice = parseFloat(timeSeries[date]['4. close']);
        if (!isNaN(closePrice) && closePrice > 0) {
          console.log(`${symbol} (Alpha Vantage): ${closePrice}`);
          return closePrice;
        }
      }
      
      // If exact date not found, get the most recent available
      const dates = Object.keys(timeSeries).sort().reverse();
      if (dates.length > 0) {
        const latestDate = dates[0];
        const closePrice = parseFloat(timeSeries[latestDate]['4. close']);
        if (!isNaN(closePrice) && closePrice > 0) {
          console.log(`${symbol} (Alpha Vantage, ${latestDate}): ${closePrice}`);
          return closePrice;
        }
      }
    }
    
    console.warn(`No valid price data for ${symbol} from Alpha Vantage`);
    return undefined;
  } catch (error) {
    console.error(`Error fetching ${symbol} from Alpha Vantage:`, error);
    return undefined;
  }
}
