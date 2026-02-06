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
 * Fetches index data from Yahoo Finance with retry logic for rate limiting (429 errors)
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
 * Fetches index data from Yahoo Finance query API
 * Uses the public query1.finance.yahoo.com endpoint (no API key required)
 */
async function fetchYahooFinanceData(symbol: string, date: string): Promise<number | undefined> {
  try {
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    let url: string;
    
    // For current/recent data, use the range parameter (works better)
    if (targetDate.getTime() === today.getTime()) {
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?region=US&lang=en-US&includePrePost=false&interval=1d&useYfid=true&range=1d`;
      console.log(`Fetching latest data for ${symbol}...`);
    } else {
      // For historical data, use period parameters
      const period1 = Math.floor(targetDate.getTime() / 1000);
      const period2 = period1 + 86400; // Add 1 day
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
      console.log(`Fetching historical data for ${symbol} on ${date}...`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 429) {
      console.warn(`Yahoo Finance rate limited for ${symbol}`);
      return undefined;
    }

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return undefined;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      console.warn(`No result data for ${symbol}`);
      return undefined;
    }
    
    // Try to get price from meta first (more reliable for current data)
    const metaPrice = result.meta?.regularMarketPrice;
    if (metaPrice != null && !isNaN(metaPrice)) {
      console.log(`${symbol}: ${metaPrice} (from meta)`);
      return metaPrice;
    }
    
    // Fallback to historical close price
    const closePrice = result.indicators?.quote?.[0]?.close?.[0];
    if (closePrice != null && !isNaN(closePrice)) {
      console.log(`${symbol}: ${closePrice} (from quote)`);
      return closePrice;
    }
    
    console.warn(`No valid price data for ${symbol}`);
    return undefined;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
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
    
    const response = await fetch(url);

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
    
    // Extract close price for the specific date
    const timeSeries = data['Time Series (Daily)'];
    if (timeSeries && timeSeries[date]) {
      const closePrice = parseFloat(timeSeries[date]['4. close']);
      if (!isNaN(closePrice)) {
        console.log(`${symbol} (Alpha Vantage): ${closePrice}`);
        return closePrice;
      }
    }
    
    console.warn(`No valid price data for ${symbol} on ${date} from Alpha Vantage`);
    return undefined;
  } catch (error) {
    console.error(`Error fetching ${symbol} from Alpha Vantage:`, error);
    return undefined;
  }
}
