import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PortfolioData, SimplifiedPortfolioData } from "./portfolioAnalysis";

type PortfolioDataRow = Tables<'portfolio_data'>;

export const savePortfolioToDatabase = async (
  name: string,
  data: SimplifiedPortfolioData[] | PortfolioData[]
): Promise<string | null> => {
  try {
    // Create portfolio entry
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({ name })
      .select()
      .single();

    if (portfolioError) throw portfolioError;

    // Insert portfolio data (personal data only, no market indices)
    const portfolioDataEntries = data.map((entry) => ({
      portfolio_id: portfolio.id,
      date: entry.date,
      principle: entry.principle,
      share_value: entry.shareValue,
      shares: 'shares' in entry ? entry.shares : null,
      market_value: 'marketValue' in entry ? entry.marketValue : null,
    }));

    const { error: dataError } = await supabase
      .from('portfolio_data')
      .insert(portfolioDataEntries);

    if (dataError) throw dataError;

    return portfolio.id;
  } catch (error) {
    console.error("Error saving portfolio to database:", error);
    return null;
  }
};

export const loadPortfolioFromDatabase = async (
  portfolioId: string
): Promise<PortfolioData[]> => {
  try {
    const PAGE_SIZE = 1000;
    let from = 0;
    let to = PAGE_SIZE - 1;
    const allEntries: PortfolioDataRow[] = [];

    while (true) {
      const { data: batch, error } = await supabase
        .from('portfolio_data')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('date', { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!batch || batch.length === 0) break;

      allEntries.push(...batch);

      if (batch.length < PAGE_SIZE) break;

      from += PAGE_SIZE;
      to += PAGE_SIZE;
    }

    if (allEntries.length === 0) return [];

    // Get date range for market indices query
    const sortedDates = allEntries.map(entry => entry.date).sort();
    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];

    // Fetch market indices for date range with pagination
    type MarketIndexRow = {
      date: string;
      sha: number | null;
      she: number | null;
      csi300: number | null;
      sp500: number | null;
      nasdaq: number | null;
      ftse100: number | null;
      hangseng: number | null;
    };
    const allMarketIndices: MarketIndexRow[] = [];
    let marketFrom = 0;
    let marketTo = PAGE_SIZE - 1;

    while (true) {
      const { data: marketBatch, error: marketError } = await supabase
        .from('market_indices')
        .select('*')
        .gte('date', minDate)
        .lte('date', maxDate)
        .order('date', { ascending: true })
        .range(marketFrom, marketTo);

      if (marketError) {
        console.error("Error fetching market indices:", marketError);
        break;
      }

      if (!marketBatch || marketBatch.length === 0) break;

      allMarketIndices.push(...marketBatch);

      if (marketBatch.length < PAGE_SIZE) break;

      marketFrom += PAGE_SIZE;
      marketTo += PAGE_SIZE;
    }

    // Create a map of market indices by date
    const marketIndicesMap = new Map(
      allMarketIndices.map(mi => [mi.date, mi])
    );

    // Calculate derived fields and merge with market data
    return allEntries.map((entry, index) => {
      const principle = Number(entry.principle) || 0;
      const shareValue = Number(entry.share_value) || 0;
      const shares = Number((entry as any).shares) || (shareValue > 0 ? principle / shareValue : 0);
      const marketValue = Number((entry as any).market_value) || shares * shareValue;
      const gainLoss = marketValue - principle;
      
      // Calculate daily gain
      let dailyGain = 0;
      if (index > 0) {
        const prevEntry = allEntries[index - 1];
        const prevShareValue = Number(prevEntry.share_value) || 0;
        const prevShares = prevShareValue > 0 ? Number(prevEntry.principle) / prevShareValue : 0;
        const prevMarketValue = prevShares * prevShareValue;
        dailyGain = marketValue - prevMarketValue;
      }

      // Get market data for this date
      const marketData = marketIndicesMap.get(entry.date);

      return {
        date: entry.date,
        principle,
        shareValue,
        sha: Number(marketData?.sha) || 0,
        she: Number(marketData?.she) || 0,
        csi300: Number(marketData?.csi300) || 0,
        sp500: Number(marketData?.sp500) || 0,
        nasdaq: Number(marketData?.nasdaq) || 0,
        ftse100: Number(marketData?.ftse100) || 0,
        hangseng: Number(marketData?.hangseng) || 0,
        shares,
        gainLoss,
        dailyGain,
        marketValue,
      };
    });
  } catch (error) {
    console.error("Error loading portfolio from database:", error);
    return [];
  }
};

export const listPortfolios = async () => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error listing portfolios:", error);
    return [];
  }
};

export const addPortfolioRecord = async (
  portfolioId: string,
  record: {
    date: string;
    principle: number;
    shares: number;
    shareValue: number;
    marketValue: number;
  }
) => {
  try {
    const { error } = await supabase
      .from('portfolio_data')
      .insert({
        portfolio_id: portfolioId,
        date: record.date,
        principle: record.principle,
        shares: record.shares,
        share_value: record.shareValue,
        market_value: record.marketValue,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding portfolio record:", error);
    return false;
  }
};

export const updatePortfolioRecord = async (
  recordId: string,
  record: {
    principle: number;
    shares: number;
    shareValue: number;
    marketValue: number;
  }
) => {
  try {
    const { error } = await supabase
      .from('portfolio_data')
      .update({
        principle: record.principle,
        shares: record.shares,
        share_value: record.shareValue,
        market_value: record.marketValue,
      })
      .eq('id', recordId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating portfolio record:", error);
    return false;
  }
};

export const getRecordByDate = async (
  portfolioId: string,
  date: string
) => {
  try {
    const { data, error } = await supabase
      .from('portfolio_data')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('date', date)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
};

export const getRecordsByDateRange = async (
  portfolioId: string,
  startDate: string,
  endDate: string
): Promise<Tables<'portfolio_data'>[]> => {
  try {
    const { data, error } = await supabase
      .from('portfolio_data')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting records by date range:", error);
    return [];
  }
};

