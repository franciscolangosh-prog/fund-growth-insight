# Market Data Architecture Setup Guide

## Overview

This application now uses a **separated architecture** where:
- **Personal portfolio data** (principle, share value) is stored per user
- **Market indices** (SHA, SHE, CSI300, S&P 500, etc.) are centralized and shared
- Market data is automatically fetched daily via scheduled jobs

## Architecture Benefits

✅ **No Data Redundancy** - Market data stored once, used by all portfolios  
✅ **Automatic Updates** - Daily cron job fetches latest indices  
✅ **Simplified UX** - Users only input their portfolio values  
✅ **Historical Accuracy** - Centralized data ensures consistency  

## Setup Steps

### Step 1: Run Data Migration

Use the **Data Migration Panel** in the app to:

1. Click "Run Migration" to copy existing market data from `portfolio_data` to `market_indices`
2. This is a **one-time operation** that populates the centralized table
3. Wait for the success message

### Step 2: Set Up Daily Cron Job

To automatically fetch market data daily, run this SQL in your backend:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily market data fetch at 6 AM UTC
SELECT cron.schedule(
  'fetch-market-data-daily',
  '0 6 * * *', -- Daily at 6 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://iigwtsthbbpufchbjmur.supabase.co/functions/v1/fetch-market-data',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZ3d0c3RoYmJwdWZjaGJqbXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTkyODEsImV4cCI6MjA3NTA5NTI4MX0.CbGprJ8z8CylcMdjIad1smKRT-sOaGWQHOmomnPhJBg"}'::jsonb,
      body:=jsonb_build_object('date', CURRENT_DATE::text)
    ) as request_id;
  $$
);
```

**Verify the cron job:**
```sql
SELECT * FROM cron.job;
```

**View cron job logs:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-market-data-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

**To unschedule:**
```sql
SELECT cron.unschedule('fetch-market-data-daily');
```

### Step 3: Configure Market Data APIs

Currently, the `fetch-market-data` edge function uses placeholder data. To fetch **real market data**, integrate one of these APIs:

#### Recommended Free APIs:

1. **Yahoo Finance** (via yfinance library)
   - Free, no API key required
   - Comprehensive global indices
   - Historical data available

2. **Alpha Vantage**
   - Free tier: 25 requests/day
   - API Key required: https://www.alphavantage.co/support/#api-key
   - Good for daily updates

3. **Financial Modeling Prep**
   - Free tier: 250 requests/day
   - API Key required: https://site.financialmodelingprep.com/developer/docs
   - Professional data quality

#### Implementation Example (Alpha Vantage):

```typescript
// In supabase/functions/fetch-market-data/index.ts

const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');

async function fetchIndexData(symbol: string): Promise<number | undefined> {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    const data = await response.json();
    return parseFloat(data['Global Quote']['05. price']);
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return undefined;
  }
}

async function fetchMarketDataFromAPIs(date: string): Promise<MarketData> {
  const [sha, she, csi300, sp500, nasdaq, ftse100, hangseng] = await Promise.all([
    fetchIndexData('000001.SS'), // Shanghai Composite
    fetchIndexData('399001.SZ'), // Shenzhen Component
    fetchIndexData('000300.SS'), // CSI 300
    fetchIndexData('SPY'),        // S&P 500 ETF
    fetchIndexData('QQQ'),        // Nasdaq ETF
    fetchIndexData('VUKE.L'),     // FTSE 100 ETF
    fetchIndexData('^HSI'),       // Hang Seng
  ]);

  return {
    date,
    sha,
    she,
    csi300,
    sp500,
    nasdaq,
    ftse100,
    hangseng,
  };
}
```

## Database Schema

### `market_indices` Table
```sql
- id: UUID (Primary Key)
- date: DATE (Unique) - The trading date
- sha: NUMERIC - Shanghai Composite Index
- she: NUMERIC - Shenzhen Component Index  
- csi300: NUMERIC - CSI 300 Index
- sp500: NUMERIC - S&P 500 Index
- nasdaq: NUMERIC - Nasdaq Composite Index
- ftse100: NUMERIC - FTSE 100 Index
- hangseng: NUMERIC - Hang Seng Index
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `portfolio_data` Table (Existing)
Still contains all fields for backward compatibility during migration.

## User Workflow

### Before Migration:
1. User uploads CSV with portfolio + market data
2. All data stored in `portfolio_data`

### After Migration:
1. User enters only: Date, Principle, Share Value
2. System automatically:
   - Looks up market indices from `market_indices` table
   - Joins data for analysis
   - Falls back to `portfolio_data` if not found (backward compatible)

## Testing

### Manual Test:
```typescript
import { fetchLatestMarketData } from "@/utils/marketDataService";

// Fetch today's market data
await fetchLatestMarketData();

// Fetch specific date
await fetchLatestMarketData('2025-01-15');
```

### Check Database:
```sql
-- View latest market data
SELECT * FROM market_indices 
ORDER BY date DESC 
LIMIT 10;

-- Check coverage
SELECT 
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(*) as total_records
FROM market_indices;
```

## Troubleshooting

### Migration fails:
- Check console logs for specific errors
- Ensure `portfolio_data` table has market index columns
- Verify database permissions

### Cron job not running:
- Verify `pg_cron` extension is enabled
- Check cron logs: `SELECT * FROM cron.job_run_details`
- Ensure edge function URL is correct
- Verify anon key is valid

### Market data not appearing:
- Check edge function logs
- Verify API keys are set (if using paid APIs)
- Check rate limits on API provider
- Ensure RLS policies allow reads from `market_indices`

## Next Steps

1. ✅ Run migration via Data Migration Panel
2. ⏰ Set up daily cron job (SQL above)
3. 🔌 Configure real API integration
4. 📊 Test with manual fetch
5. 🎉 Users can now add records with simplified form!
