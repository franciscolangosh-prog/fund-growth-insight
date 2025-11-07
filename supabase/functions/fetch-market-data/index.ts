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

    // TODO: Replace with actual API calls to fetch real market data
    // For now, using placeholder logic
    // Recommended APIs: Yahoo Finance, Alpha Vantage, or Financial Modeling Prep
    
    const marketData: MarketData = await fetchMarketDataFromAPIs(targetDate);

    // Upsert market data
    const { data, error } = await supabaseClient
      .from('market_indices')
      .upsert(
        {
          date: targetDate,
          sha: marketData.sha,
          she: marketData.she,
          csi300: marketData.csi300,
          sp500: marketData.sp500,
          nasdaq: marketData.nasdaq,
          ftse100: marketData.ftse100,
          hangseng: marketData.hangseng,
        },
        { onConflict: 'date' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting market data:', error);
      throw error;
    }

    console.log('Market data updated successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
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
 * Fetches market data with Yahoo Finance as primary and Alpha Vantage as fallback
 */
async function fetchMarketDataFromAPIs(date: string): Promise<MarketData> {
  console.log(`Fetching real market data for ${date}`);
  
  const symbols = {
    sha: { yahoo: '000001.SS', alpha: '000001.SS' },
    she: { yahoo: '399001.SZ', alpha: '399001.SZ' },
    csi300: { yahoo: '000300.SS', alpha: '000300.SS' },
    sp500: { yahoo: '%5EGSPC', alpha: 'SPX' },
    nasdaq: { yahoo: '%5EIXIC', alpha: 'IXIC' },
    ftse100: { yahoo: '%5EFTSE', alpha: 'FTSE' },
    hangseng: { yahoo: '%5EHSI', alpha: 'HSI' },
  };

  const results = await Promise.all(
    Object.entries(symbols).map(async ([key, symbol]) => {
      // Try Yahoo Finance first
      let value = await fetchYahooFinanceData(symbol.yahoo, date);
      
      // If Yahoo fails, try Alpha Vantage as fallback
      if (value === undefined) {
        console.log(`Yahoo Finance failed for ${key}, trying Alpha Vantage...`);
        value = await fetchAlphaVantageData(symbol.alpha, date);
      }
      
      return { key, value };
    })
  );

  const marketData: MarketData = { date };
  results.forEach(({ key, value }) => {
    marketData[key as keyof Omit<MarketData, 'date'>] = value;
  });

  return marketData;
}

/**
 * Fetches index data from Yahoo Finance query API
 * Uses the public query1.finance.yahoo.com endpoint (no API key required)
 */
async function fetchYahooFinanceData(symbol: string, date: string): Promise<number | undefined> {
  try {
    // Convert date to timestamps
    const targetDate = new Date(date);
    const period1 = Math.floor(targetDate.getTime() / 1000);
    const period2 = period1 + 86400; // Add 1 day

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
    console.log(`Fetching ${symbol} from Yahoo Finance...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return undefined;
    }

    const data = await response.json();
    
    // Extract close price from Yahoo Finance response
    const result = data?.chart?.result?.[0];
    const closePrice = result?.indicators?.quote?.[0]?.close?.[0];
    
    if (closePrice && !isNaN(closePrice)) {
      console.log(`${symbol}: ${closePrice}`);
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
