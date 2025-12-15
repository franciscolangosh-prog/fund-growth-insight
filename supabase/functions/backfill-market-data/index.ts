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
              failCount++;
            } else {
              console.log(`✓ ${date}: ${Object.keys(dataToUpsert).length - 1} values`);
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

async function fetchYahooFinanceData(symbol: string, date: string): Promise<number | undefined> {
  try {
    const targetDate = new Date(date);
    const period1 = Math.floor(targetDate.getTime() / 1000);
    const period2 = period1 + 86400; // +1 day

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      return undefined;
    }
    
    // Get historical close price only
    const closePrice = result.indicators?.quote?.[0]?.close?.[0];
    if (closePrice != null && !isNaN(closePrice)) {
      return closePrice;
    }
    
    return undefined;

  } catch (error) {
    // Silently fail - this is expected for weekends/holidays
    return undefined;
  }
}
