import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    const indexKeys = ['sha', 'she', 'csi300', 'sp500', 'nasdaq', 'ftse100', 'hangseng', 'nikkei225', 'tsx', 'klse', 'cac40', 'dax', 'sti', 'asx200'];

    // Process dates ONE AT A TIME to avoid CPU spikes
    // Use smaller batches with longer delays
    const batchSize = 2; // Process 2 dates at a time
    
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      
      // Process each date in the batch sequentially
      for (const date of batch) {
        try {
          const marketData = await fetchMarketDataFromAPIs(date);
          
          // Only include fields that have actual values
          const dataToUpsert: Record<string, unknown> = { date };
          indexKeys.forEach(key => {
            const value = marketData[key as keyof typeof marketData];
            if (value !== undefined) {
              dataToUpsert[key] = value;
            }
          });

          // FORWARD-FILL: For indices without fresh data, use the most recent available value
          const missingIndices = indexKeys.filter(key => dataToUpsert[key] === undefined);
          
          if (missingIndices.length > 0) {
            console.log(`Forward-filling ${missingIndices.length} indices for ${date}...`);
            
            // Fetch recent records to find non-null values
            const { data: recentRecords } = await supabaseClient
              .from('market_indices')
              .select('*')
              .lt('date', date)
              .order('date', { ascending: false })
              .limit(10);
            
            if (recentRecords && recentRecords.length > 0) {
              missingIndices.forEach(key => {
                for (const record of recentRecords) {
                  const value = record[key];
                  if (value !== null && value !== undefined) {
                    dataToUpsert[key] = value;
                    break;
                  }
                }
              });
            }
          }

          // Only upsert if we have at least one market value
          const valueCount = Object.keys(dataToUpsert).filter(k => k !== 'date').length;
          if (valueCount > 0) {
            const { error } = await supabaseClient
              .from('market_indices')
              .upsert(dataToUpsert, { onConflict: 'date' });

            if (error) {
              console.error(`Error upserting data for ${date}:`, error);
              failCount++;
            } else {
              console.log(`✓ ${date}: ${valueCount} values (including forward-fill)`);
              successCount++;
            }
          } else {
            console.warn(`⚠ No data for ${date}`);
            successCount++; // Count as success (weekend/holiday)
          }
        } catch (error) {
          console.error(`Error processing ${date}:`, error);
          failCount++;
        }
        
        // Small delay between each date to prevent CPU spikes
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Longer delay between batches
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
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

// Fetch market data - sequential calls to avoid CPU overload
async function fetchMarketDataFromAPIs(date: string): Promise<Omit<MarketData, 'date'>> {
  const marketData: Omit<MarketData, 'date'> = {
    sha: undefined,
    she: undefined,
    csi300: undefined,
    sp500: undefined,
    nasdaq: undefined,
    ftse100: undefined,
    hangseng: undefined,
    nikkei225: undefined,
    tsx: undefined,
    klse: undefined,
    cac40: undefined,
    dax: undefined,
    sti: undefined,
    asx200: undefined,
  };

  // Fetch indices sequentially to avoid CPU spikes
  // Yahoo Finance symbols for all indices
  const indices = [
    { key: 'sha', symbol: '000001.SS' },
    { key: 'she', symbol: '399001.SZ' },
    { key: 'csi300', symbol: '000300.SS' },
    { key: 'sp500', symbol: '^GSPC' },
    { key: 'nasdaq', symbol: '^IXIC' },
    { key: 'ftse100', symbol: '^FTSE' },
    { key: 'hangseng', symbol: '^HSI' },
    { key: 'nikkei225', symbol: '^N225' },
    { key: 'tsx', symbol: '^GSPTSE' },
    { key: 'klse', symbol: '^KLSE' },
    { key: 'cac40', symbol: '^FCHI' },
    { key: 'dax', symbol: '^GDAXI' },
    { key: 'sti', symbol: '^STI' },
    { key: 'asx200', symbol: '^AXJO' },
  ];

  for (const { key, symbol } of indices) {
    try {
      const value = await fetchYahooFinanceData(symbol, date);
      if (value !== undefined) {
        marketData[key as keyof Omit<MarketData, 'date'>] = value;
      }
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
    }
    
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return marketData;
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
 * Fetches historical index data from Yahoo Finance for a specific date
 * Uses period1/period2 for historical data
 */
async function fetchYahooFinanceData(symbol: string, date: string): Promise<number | undefined> {
  try {
    // For historical backfill, we need period-based query
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const isToday = targetDate.getTime() >= today.getTime() - 86400000; // Within 1 day
    
    let url: string;
    if (isToday) {
      // For recent dates, use range query to get current price
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    } else {
      // For historical dates, use period query
      const period1 = Math.floor(targetDate.getTime() / 1000);
      const period2 = period1 + 86400;
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`;
    }
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, 5000);

    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      return undefined;
    }
    
    const meta = result.meta;
    
    // For today/recent, use regularMarketPrice
    if (isToday) {
      const currentPrice = meta?.regularMarketPrice;
      if (currentPrice != null && !isNaN(currentPrice) && currentPrice > 0) {
        console.log(`${symbol}: ${currentPrice}`);
        return currentPrice;
      }
    }
    
    // For historical, get close price from quote indicators
    const quote = result.indicators?.quote?.[0];
    if (quote?.close && quote.close.length > 0) {
      const closePrice = quote.close[quote.close.length - 1];
      if (closePrice != null && !isNaN(closePrice) && closePrice > 0) {
        console.log(`${symbol}: ${closePrice}`);
        return closePrice;
      }
    }
    
    // Fallback to meta prices
    const previousClose = meta?.previousClose ?? meta?.chartPreviousClose ?? meta?.regularMarketPrice;
    if (previousClose != null && !isNaN(previousClose) && previousClose > 0) {
      console.log(`${symbol}: ${previousClose} (fallback)`);
      return previousClose;
    }
    
    return undefined;
  } catch (error) {
    // Silently fail - this is expected for weekends/holidays
    return undefined;
  }
}
