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
 * Fetches market data from Yahoo Finance API (free, no API key required)
 */
async function fetchMarketDataFromAPIs(date: string): Promise<MarketData> {
  console.log(`Fetching real market data for ${date}`);
  
  try {
    const results = await Promise.allSettled([
      fetchYahooFinanceData('000001.SS', date), // Shanghai Composite
      fetchYahooFinanceData('399001.SZ', date), // Shenzhen Component
      fetchYahooFinanceData('000300.SS', date), // CSI 300
      fetchYahooFinanceData('%5EGSPC', date),   // S&P 500
      fetchYahooFinanceData('%5EIXIC', date),   // Nasdaq
      fetchYahooFinanceData('%5EFTSE', date),   // FTSE 100
      fetchYahooFinanceData('%5EHSI', date),    // Hang Seng
    ]);

    return {
      date,
      sha: results[0].status === 'fulfilled' ? results[0].value : undefined,
      she: results[1].status === 'fulfilled' ? results[1].value : undefined,
      csi300: results[2].status === 'fulfilled' ? results[2].value : undefined,
      sp500: results[3].status === 'fulfilled' ? results[3].value : undefined,
      nasdaq: results[4].status === 'fulfilled' ? results[4].value : undefined,
      ftse100: results[5].status === 'fulfilled' ? results[5].value : undefined,
      hangseng: results[6].status === 'fulfilled' ? results[6].value : undefined,
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
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
