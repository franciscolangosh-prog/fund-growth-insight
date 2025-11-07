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
    sha: { yahoo: '000001.SS', alpha: '000001.SS' },
    she: { yahoo: '399001.SZ', alpha: '399001.SZ' },
    csi300: { yahoo: '000300.SS', alpha: '000300.SS' },
    sp500: { yahoo: '^GSPC', alpha: 'SPX' },
    nasdaq: { yahoo: '^IXIC', alpha: 'IXIC' },
    ftse100: { yahoo: '^FTSE', alpha: 'FTSE' },
    hangseng: { yahoo: '^HSI', alpha: 'HSI' }
  };

  const results = await Promise.allSettled(
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

async function fetchYahooFinanceData(symbol: string, date: string): Promise<number | undefined> {
  try {
    const targetDate = new Date(date);
    const startTimestamp = Math.floor(targetDate.getTime() / 1000);
    const endTimestamp = startTimestamp + 86400; // +1 day

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return undefined;
    }

    const data = await response.json();
    
    if (!data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0]) {
      console.warn(`No data available for ${symbol} on ${date}`);
      return undefined;
    }

    const closePrice = data.chart.result[0].indicators.quote[0].close[0];
    return closePrice;

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
