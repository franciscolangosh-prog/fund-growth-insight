import { supabase } from "@/integrations/supabase/client";

export interface MarketIndices {
  sha: number;
  she: number;
  csi300: number;
  sp500?: number;
  nasdaq?: number;
  ftse100?: number;
  hangseng?: number;
}

/**
 * Fetches market indices for a specific date
 * Checks market_indices table first, falls back to portfolio_data for backward compatibility
 */
export async function getMarketIndicesForDate(date: string): Promise<MarketIndices | null> {
  const { data: marketData, error: marketError } = await supabase
    .from('market_indices')
    .select('sha, she, csi300, sp500, nasdaq, ftse100, hangseng')
    .eq('date', date)
    .maybeSingle();

  if (marketError) {
    console.error('Error fetching market data:', marketError);
    return null;
  }

  if (!marketData) {
    console.log('Market data not found for date:', date);
    return null;
  }

  return {
    sha: Number(marketData.sha) || 0,
    she: Number(marketData.she) || 0,
    csi300: Number(marketData.csi300) || 0,
    sp500: marketData.sp500 ? Number(marketData.sp500) : undefined,
    nasdaq: marketData.nasdaq ? Number(marketData.nasdaq) : undefined,
    ftse100: marketData.ftse100 ? Number(marketData.ftse100) : undefined,
    hangseng: marketData.hangseng ? Number(marketData.hangseng) : undefined,
  };
}

/**
 * Fetches market indices for a date range
 */
export async function getMarketIndicesForDateRange(
  startDate: string,
  endDate: string
): Promise<Record<string, MarketIndices>> {
  const { data: marketData, error } = await supabase
    .from('market_indices')
    .select('date, sha, she, csi300, sp500, nasdaq, ftse100, hangseng')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  if (error) {
    console.error('Error fetching market indices:', error);
    return {};
  }

  const marketIndicesByDate: Record<string, MarketIndices> = {};
  
  for (const record of marketData) {
    marketIndicesByDate[record.date] = {
      sha: Number(record.sha) || 0,
      she: Number(record.she) || 0,
      csi300: Number(record.csi300) || 0,
      sp500: record.sp500 ? Number(record.sp500) : undefined,
      nasdaq: record.nasdaq ? Number(record.nasdaq) : undefined,
      ftse100: record.ftse100 ? Number(record.ftse100) : undefined,
      hangseng: record.hangseng ? Number(record.hangseng) : undefined,
    };
  }

  return marketIndicesByDate;
}

/**
 * Triggers the edge function to fetch and update market data
 */
export async function fetchLatestMarketData(date?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { date: date || new Date().toISOString().split('T')[0] },
    });

    if (error) {
      console.error('Error fetching market data:', error);
      return false;
    }

    console.log('Market data fetched successfully:', data);
    return true;
  } catch (error) {
    console.error('Error calling fetch-market-data function:', error);
    return false;
  }
}

/**
 * Runs the migration to copy market data from portfolio_data to market_indices
 */
export async function migrateMarketData(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('migrate-market-data');

    if (error) {
      console.error('Error migrating market data:', error);
      return false;
    }

    console.log('Market data migration completed:', data);
    return true;
  } catch (error) {
    console.error('Error calling migrate-market-data function:', error);
    return false;
  }
}

/**
 * Backfills market data for a date range
 */
export async function backfillMarketData(startDate: string, endDate: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('backfill-market-data', {
      body: { startDate, endDate },
    });

    if (error) {
      console.error('Error backfilling market data:', error);
      return false;
    }

    console.log('Market data backfill completed:', data);
    return true;
  } catch (error) {
    console.error('Error calling backfill-market-data function:', error);
    return false;
  }
}
