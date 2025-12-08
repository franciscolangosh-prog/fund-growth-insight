import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketData {
  date: string;
  sha: number | undefined;
  she: number | undefined;
  csi300: number | undefined;
  sp500?: number | undefined;
  nasdaq?: number | undefined;
  ftse100?: number | undefined;
  hangseng?: number | undefined;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { startDate, endDate } = await req.json();
    
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    console.log(`Backfilling market data from ${startDate} to ${endDate}`);

    // Generate array of dates between start and end
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }

    console.log(`Processing ${dates.length} dates`);

    let successCount = 0;
    let failCount = 0;

    // Process dates in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async (date) => {
          const marketData = await fetchMarketDataFromAPIs(date);
          
          // Only include fields that have actual values (not undefined)
          const dataToUpsert: Record<string, any> = { date };
          Object.entries(marketData).forEach(([key, value]) => {
            if (value !== undefined) {
              dataToUpsert[key] = value;
            }
          });

          // Only upsert if we have at least one market value
          if (Object.keys(dataToUpsert).length > 1) {
            const { error } = await supabaseClient
              .from('market_indices')
              .upsert(dataToUpsert, { onConflict: 'date' });

            if (error) {
              console.error(`Error upserting data for ${date}:`, error);
              throw error;
            }

            console.log(`✓ Processed ${date} with ${Object.keys(dataToUpsert).length - 1} values`);
          } else {
            console.warn(`⚠ No market data available for ${date}, skipping upsert`);
          }
          
          return date;
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failCount++;
        }
      });

      // Small delay between batches
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Backfill complete: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: dates.length,
        successful: successCount,
        failed: failCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in backfill-market-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchMarketDataFromAPIs(date: string): Promise<Omit<MarketData, 'date'>> {
  const symbols = {
    sha: { yahoo: '000001.SS', alpha: '000001.SS', chinese: 'sh000001' },
    she: { yahoo: '399001.SZ', alpha: '399001.SZ', chinese: 'sz399001' },
    csi300: { yahoo: '000300.SS', alpha: '000300.SS', chinese: 'sh000300' },
    sp500: { yahoo: '^GSPC', alpha: 'SPX' },
    nasdaq: { yahoo: '^IXIC', alpha: 'IXIC' },
    ftse100: { yahoo: '^FTSE', alpha: 'FTSE' },
    hangseng: { yahoo: '^HSI', alpha: 'HSI' }
  };

  const results = await Promise.allSettled(
    Object.entries(symbols).map(async ([key, symbol]) => {
      let value: number | undefined;
      
      // For Chinese indices (sha, she, csi300), try Chinese data sources first
      if ('chinese' in symbol && symbol.chinese) {
        value = await fetchChineseMarketData(symbol.chinese, date);
        if (value !== undefined) {
          console.log(`Got ${key} from Chinese source: ${value}`);
          return { key, value };
        }
      }
      
      // Try Yahoo Finance 
      value = await fetchYahooFinanceData(symbol.yahoo, date);
      
      // If Yahoo fails, try Alpha Vantage as fallback
      if (value === undefined) {
        console.log(`Yahoo Finance failed for ${key}, trying Alpha Vantage...`);
        value = await fetchAlphaVantageData(symbol.alpha, date);
      }
      
      return { key, value };
    })
  );

  const marketData: Omit<MarketData, 'date'> = {
    sha: undefined,
    she: undefined,
    csi300: undefined,
    sp500: undefined,
    nasdaq: undefined,
    ftse100: undefined,
    hangseng: undefined,
  };

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { key, value } = result.value;
      marketData[key as keyof Omit<MarketData, 'date'>] = value;
    }
  });

  return marketData;
}

// Fetch from Chinese financial data sources (similar to AkShare approach)
// Uses Sina Finance API which is the primary source for AkShare's stock_zh_index_daily
async function fetchChineseMarketData(symbol: string, date: string): Promise<number | undefined> {
  try {
    // Format date for API (YYYYMMDD)
    const formattedDate = date.replace(/-/g, '');
    
    // Try Sina Finance API - this is what AkShare uses under the hood
    // The API provides historical daily data for Chinese indices
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
      // Try alternative API - EastMoney
      return await fetchEastMoneyData(symbol, date);
    }
    
    const text = await response.text();
    
    // Parse the JavaScript response to extract price data
    // Format: KLC_KL_sh000300=[{day:"2014-01-02",open:"2327.01",close:"2330.03",...}]
    const match = text.match(/close:"([\d.]+)"/);
    if (match && match[1]) {
      const closePrice = parseFloat(match[1]);
      if (!isNaN(closePrice) && closePrice > 0) {
        console.log(`${symbol} from Sina: ${closePrice}`);
        return closePrice;
      }
    }
    
    // If Sina doesn't have the data, try EastMoney
    return await fetchEastMoneyData(symbol, date);
    
  } catch (error) {
    console.error(`Error fetching ${symbol} from Chinese sources:`, error);
    return await fetchEastMoneyData(symbol, date);
  }
}

// Fallback to EastMoney API for Chinese market data
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

async function fetchYahooFinanceData(symbol: string, date: string): Promise<number | undefined> {
  try {
    const targetDate = new Date(date);
    const period1 = Math.floor(targetDate.getTime() / 1000);
    const period2 = period1 + 86400; // +1 day

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return undefined;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      console.warn(`No result data for ${symbol} on ${date}`);
      return undefined;
    }
    
    // For historical data, ONLY use the close price from the time series
    // meta.regularMarketPrice is the CURRENT price, not historical!
    const closePrice = result.indicators?.quote?.[0]?.close?.[0];
    if (closePrice != null && !isNaN(closePrice)) {
      console.log(`${symbol} on ${date}: ${closePrice} (historical close)`);
      return closePrice;
    }
    
    console.warn(`No valid price data for ${symbol} on ${date}`);
    return undefined;

  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return undefined;
  }
}

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
    
    if (data['Error Message'] || data['Note']) {
      console.warn(`Alpha Vantage issue for ${symbol}:`, data['Error Message'] || data['Note']);
      return undefined;
    }
    
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
