import { supabase } from "@/integrations/supabase/client";
import { PortfolioData, SimplifiedPortfolioData } from "./portfolioAnalysis";

const STORAGE_KEY_PREFIX = "portfolio_cache_";
const PORTFOLIOS_LIST_KEY = "portfolios_list";

export interface LocalPortfolio {
  id: string;
  name: string;
  created_at: string;
}

interface StoredPortfolioData {
  date: string;
  principle: number;
  shareValue: number;
  shares?: number;
  marketValue?: number;
}

export const savePortfolioToLocal = (
  name: string,
  data: SimplifiedPortfolioData[] | PortfolioData[]
): string => {
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store portfolio data (personal data only)
  const portfolioDataEntries: StoredPortfolioData[] = data.map((entry) => ({
    date: entry.date,
    principle: entry.principle,
    shareValue: entry.shareValue,
    shares: 'shares' in entry ? entry.shares : undefined,
    marketValue: 'marketValue' in entry ? entry.marketValue : undefined,
  }));

  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${id}`,
    JSON.stringify(portfolioDataEntries)
  );

  // Update portfolios list
  const portfoliosList = listLocalPortfolios();
  const newPortfolio: LocalPortfolio = {
    id,
    name,
    created_at: new Date().toISOString(),
  };
  portfoliosList.unshift(newPortfolio);
  localStorage.setItem(PORTFOLIOS_LIST_KEY, JSON.stringify(portfoliosList));

  return id;
};

export const loadPortfolioFromLocal = async (
  portfolioId: string
): Promise<PortfolioData[]> => {
  try {
    const storedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${portfolioId}`);
    if (!storedData) return [];

    const portfolioEntries: StoredPortfolioData[] = JSON.parse(storedData);
    if (portfolioEntries.length === 0) return [];

    // Get date range for market indices query
    const sortedDates = portfolioEntries.map(entry => entry.date).sort();
    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];

    // Fetch market indices from database
    const PAGE_SIZE = 1000;
    type MarketIndexRow = {
      date: string;
      sha: number | null;
      she: number | null;
      csi300: number | null;
      sp500: number | null;
      nasdaq: number | null;
      ftse100: number | null;
      hangseng: number | null;
      nikkei225: number | null;
      tsx: number | null;
      klse: number | null;
      cac40: number | null;
      dax: number | null;
      sti: number | null;
      asx200: number | null;
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

    // Forward-fill missing market data values
    const lastValid = {
      sha: 0, she: 0, csi300: 0, sp500: 0, nasdaq: 0, ftse100: 0,
      hangseng: 0, nikkei225: 0, tsx: 0, klse: 0, cac40: 0, dax: 0,
      sti: 0, asx200: 0,
    };

    const forwardFilledMarketIndices = allMarketIndices.map((mi) => {
      if (mi.sha && mi.sha > 0) lastValid.sha = mi.sha;
      if (mi.she && mi.she > 0) lastValid.she = mi.she;
      if (mi.csi300 && mi.csi300 > 0) lastValid.csi300 = mi.csi300;
      if (mi.sp500 && mi.sp500 > 0) lastValid.sp500 = mi.sp500;
      if (mi.nasdaq && mi.nasdaq > 0) lastValid.nasdaq = mi.nasdaq;
      if (mi.ftse100 && mi.ftse100 > 0) lastValid.ftse100 = mi.ftse100;
      if (mi.hangseng && mi.hangseng > 0) lastValid.hangseng = mi.hangseng;
      if (mi.nikkei225 && mi.nikkei225 > 0) lastValid.nikkei225 = mi.nikkei225;
      if (mi.tsx && mi.tsx > 0) lastValid.tsx = mi.tsx;
      if (mi.klse && mi.klse > 0) lastValid.klse = mi.klse;
      if (mi.cac40 && mi.cac40 > 0) lastValid.cac40 = mi.cac40;
      if (mi.dax && mi.dax > 0) lastValid.dax = mi.dax;
      if (mi.sti && mi.sti > 0) lastValid.sti = mi.sti;
      if (mi.asx200 && mi.asx200 > 0) lastValid.asx200 = mi.asx200;

      return {
        date: mi.date,
        sha: (mi.sha && mi.sha > 0) ? mi.sha : lastValid.sha,
        she: (mi.she && mi.she > 0) ? mi.she : lastValid.she,
        csi300: (mi.csi300 && mi.csi300 > 0) ? mi.csi300 : lastValid.csi300,
        sp500: (mi.sp500 && mi.sp500 > 0) ? mi.sp500 : lastValid.sp500,
        nasdaq: (mi.nasdaq && mi.nasdaq > 0) ? mi.nasdaq : lastValid.nasdaq,
        ftse100: (mi.ftse100 && mi.ftse100 > 0) ? mi.ftse100 : lastValid.ftse100,
        hangseng: (mi.hangseng && mi.hangseng > 0) ? mi.hangseng : lastValid.hangseng,
        nikkei225: (mi.nikkei225 && mi.nikkei225 > 0) ? mi.nikkei225 : lastValid.nikkei225,
        tsx: (mi.tsx && mi.tsx > 0) ? mi.tsx : lastValid.tsx,
        klse: (mi.klse && mi.klse > 0) ? mi.klse : lastValid.klse,
        cac40: (mi.cac40 && mi.cac40 > 0) ? mi.cac40 : lastValid.cac40,
        dax: (mi.dax && mi.dax > 0) ? mi.dax : lastValid.dax,
        sti: (mi.sti && mi.sti > 0) ? mi.sti : lastValid.sti,
        asx200: (mi.asx200 && mi.asx200 > 0) ? mi.asx200 : lastValid.asx200,
      };
    });

    const marketIndicesMap = new Map(
      forwardFilledMarketIndices.map(mi => [mi.date, mi])
    );

    // Calculate derived fields and merge with market data
    return portfolioEntries.map((entry, index) => {
      const principle = Number(entry.principle) || 0;
      const shareValue = Number(entry.shareValue) || 0;
      const shares = Number(entry.shares) || (shareValue > 0 ? principle / shareValue : 0);
      const marketValue = Number(entry.marketValue) || shares * shareValue;
      const gainLoss = marketValue - principle;

      let dailyGain = 0;
      if (index > 0) {
        const prevEntry = portfolioEntries[index - 1];
        const prevShareValue = Number(prevEntry.shareValue) || 0;
        const prevShares = prevShareValue > 0 ? Number(prevEntry.principle) / prevShareValue : 0;
        const prevMarketValue = prevShares * prevShareValue;
        dailyGain = marketValue - prevMarketValue;
      }

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
        nikkei225: Number(marketData?.nikkei225) || 0,
        tsx: Number(marketData?.tsx) || 0,
        klse: Number(marketData?.klse) || 0,
        cac40: Number(marketData?.cac40) || 0,
        dax: Number(marketData?.dax) || 0,
        sti: Number(marketData?.sti) || 0,
        asx200: Number(marketData?.asx200) || 0,
        shares,
        gainLoss,
        dailyGain,
        marketValue,
      };
    });
  } catch (error) {
    console.error("Error loading portfolio from local storage:", error);
    return [];
  }
};

export const listLocalPortfolios = (): LocalPortfolio[] => {
  try {
    const storedList = localStorage.getItem(PORTFOLIOS_LIST_KEY);
    if (!storedList) return [];
    return JSON.parse(storedList);
  } catch (error) {
    console.error("Error listing local portfolios:", error);
    return [];
  }
};

export const deleteLocalPortfolio = (portfolioId: string): boolean => {
  try {
    // Remove portfolio data
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${portfolioId}`);

    // Update portfolios list
    const portfoliosList = listLocalPortfolios();
    const updatedList = portfoliosList.filter(p => p.id !== portfolioId);
    localStorage.setItem(PORTFOLIOS_LIST_KEY, JSON.stringify(updatedList));

    return true;
  } catch (error) {
    console.error("Error deleting local portfolio:", error);
    return false;
  }
};

export const clearAllLocalPortfolios = (): void => {
  try {
    const portfoliosList = listLocalPortfolios();
    portfoliosList.forEach(p => {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${p.id}`);
    });
    localStorage.removeItem(PORTFOLIOS_LIST_KEY);
  } catch (error) {
    console.error("Error clearing all local portfolios:", error);
  }
};
