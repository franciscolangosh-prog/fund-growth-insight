import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PortfolioData } from "./portfolioAnalysis";

type PortfolioDataRow = Tables<'portfolio_data'>;

export const savePortfolioToDatabase = async (
  name: string,
  data: PortfolioData[]
): Promise<string | null> => {
  try {
    // Create portfolio entry
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({ name })
      .select()
      .single();

    if (portfolioError) throw portfolioError;

    // Insert portfolio data
    const portfolioDataEntries = data.map((entry) => ({
      portfolio_id: portfolio.id,
      date: entry.date,
      principle: entry.principle,
      share_value: entry.shareValue,
      sha: entry.sha,
      she: entry.she,
      csi300: entry.csi300,
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
