import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Starting market data migration...');

    // Fetch ALL records from portfolio_data with pagination
    type PortfolioMarketRow = {
      date: string;
      sha: number | null;
      she: number | null;
      csi300: number | null;
      sp500: number | null;
      nasdaq: number | null;
      ftse100: number | null;
      hangseng: number | null;
    };
    let allPortfolioData: PortfolioMarketRow[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: portfolioData, error: fetchError } = await supabaseClient
        .from('portfolio_data')
        .select('date, sha, she, csi300, sp500, nasdaq, ftse100, hangseng')
        .order('date')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (fetchError) {
        console.error('Error fetching portfolio data:', fetchError);
        throw fetchError;
      }

      if (portfolioData && portfolioData.length > 0) {
        allPortfolioData = allPortfolioData.concat(portfolioData);
        console.log(`Fetched page ${page + 1}: ${portfolioData.length} records (total: ${allPortfolioData.length})`);
        hasMore = portfolioData.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log(`Found ${allPortfolioData.length} total portfolio records`);

    // Group by date and take the most recent values for each date
    const marketDataByDate = new Map<string, PortfolioMarketRow>();
    
    for (const record of allPortfolioData) {
      const dateKey = record.date;
      if (!marketDataByDate.has(dateKey)) {
        marketDataByDate.set(dateKey, {
          date: record.date,
          sha: record.sha,
          she: record.she,
          csi300: record.csi300,
          sp500: record.sp500,
          nasdaq: record.nasdaq,
          ftse100: record.ftse100,
          hangseng: record.hangseng,
        });
      }
    }

    const uniqueMarketData = Array.from(marketDataByDate.values());
    console.log(`Migrating ${uniqueMarketData.length} unique market data records`);

    // Batch insert market data
    const batchSize = 100;
    let migratedCount = 0;

    for (let i = 0; i < uniqueMarketData.length; i += batchSize) {
      const batch = uniqueMarketData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabaseClient
        .from('market_indices')
        .upsert(batch, { onConflict: 'date' });

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        throw insertError;
      }

      migratedCount += batch.length;
      console.log(`Migrated ${migratedCount}/${uniqueMarketData.length} records`);
    }

    console.log('Migration completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Market data migration completed',
        recordsMigrated: migratedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in migrate-market-data function:', error);
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
