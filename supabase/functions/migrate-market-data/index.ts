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

    // Fetch all unique market data from portfolio_data
    const { data: portfolioData, error: fetchError } = await supabaseClient
      .from('portfolio_data')
      .select('date, sha, she, csi300, sp500, nasdaq, ftse100, hangseng')
      .order('date');

    if (fetchError) {
      console.error('Error fetching portfolio data:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${portfolioData.length} portfolio records`);

    // Group by date and take the most recent values for each date
    const marketDataByDate = new Map();
    
    for (const record of portfolioData) {
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
