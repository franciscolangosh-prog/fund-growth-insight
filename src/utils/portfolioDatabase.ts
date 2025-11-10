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

    // Check if data is simplified format (doesn't have market indices)
    const isSimplified = data.length > 0 && !('sha' in data[0]);

    if (isSimplified) {
      // Fetch market indices for all dates in the portfolio data
      const dates = data.map(entry => entry.date);
      const { data: marketIndices, error: marketError } = await supabase
        .from('market_indices')
        .select('*')
        .in('date', dates);

      if (marketError) {
        console.error("Error fetching market indices:", marketError);
      }

      // Create a map of market indices by date
      const marketIndicesMap = new Map(
        marketIndices?.map(mi => [mi.date, mi]) || []
      );

      // Insert portfolio data with market indices
      const portfolioDataEntries = (data as SimplifiedPortfolioData[]).map((entry) => {
        const marketData = marketIndicesMap.get(entry.date);
        
        return {
          portfolio_id: portfolio.id,
          date: entry.date,
          principle: entry.principle,
          share_value: entry.shareValue,
          sha: marketData?.sha || 0,
          she: marketData?.she || 0,
          csi300: marketData?.csi300 || 0,
          sp500: marketData?.sp500 || 0,
          nasdaq: marketData?.nasdaq || 0,
          ftse100: marketData?.ftse100 || 0,
          hangseng: marketData?.hangseng || 0,
        };
      });

      const { error: dataError } = await supabase
        .from('portfolio_data')
        .insert(portfolioDataEntries);

      if (dataError) throw dataError;
    } else {
      // Insert portfolio data with market indices already included
      const portfolioDataEntries = (data as PortfolioData[]).map((entry) => ({
        portfolio_id: portfolio.id,
        date: entry.date,
        principle: entry.principle,
        share_value: entry.shareValue,
        sha: entry.sha,
        she: entry.she,
        csi300: entry.csi300,
        sp500: entry.sp500,
        nasdaq: entry.nasdaq,
        ftse100: entry.ftse100,
        hangseng: entry.hangseng,
      }));

      const { error: dataError } = await supabase
        .from('portfolio_data')
        .insert(portfolioDataEntries);

      if (dataError) throw dataError;
    }

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

    // Calculate derived fields
    return allEntries.map((entry, index) => {
      const principle = Number(entry.principle) || 0;
      const shareValue = Number(entry.share_value) || 0;
      const shares = shareValue > 0 ? principle / shareValue : 0;
      const marketValue = shares * shareValue;
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

      return {
        date: entry.date,
        principle,
        shareValue,
        sha: Number(entry.sha),
        she: Number(entry.she),
        csi300: Number(entry.csi300),
        sp500: Number(entry.sp500) || 0,
        nasdaq: Number(entry.nasdaq) || 0,
        ftse100: Number(entry.ftse100) || 0,
        hangseng: Number(entry.hangseng) || 0,
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
    shareValue: number;
    sha: number;
    she: number;
    csi300: number;
    sp500?: number;
    nasdaq?: number;
    ftse100?: number;
    hangseng?: number;
  }
) => {
  try {
    const { error } = await supabase
      .from('portfolio_data')
      .insert({
        portfolio_id: portfolioId,
        date: record.date,
        principle: record.principle,
        share_value: record.shareValue,
        sha: record.sha,
        she: record.she,
        csi300: record.csi300,
        sp500: record.sp500 || 0,
        nasdaq: record.nasdaq || 0,
        ftse100: record.ftse100 || 0,
        hangseng: record.hangseng || 0,
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
    shareValue: number;
    sha: number;
    she: number;
    csi300: number;
    sp500?: number;
    nasdaq?: number;
    ftse100?: number;
    hangseng?: number;
  }
) => {
  try {
    const { error } = await supabase
      .from('portfolio_data')
      .update({
        principle: record.principle,
        share_value: record.shareValue,
        sha: record.sha,
        she: record.she,
        csi300: record.csi300,
        sp500: record.sp500 || 0,
        nasdaq: record.nasdaq || 0,
        ftse100: record.ftse100 || 0,
        hangseng: record.hangseng || 0,
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

