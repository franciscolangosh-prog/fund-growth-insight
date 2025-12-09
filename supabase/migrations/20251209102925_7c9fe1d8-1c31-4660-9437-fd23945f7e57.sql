-- Add new market indices columns
ALTER TABLE public.market_indices
ADD COLUMN IF NOT EXISTS nikkei225 numeric,
ADD COLUMN IF NOT EXISTS tsx numeric,
ADD COLUMN IF NOT EXISTS klse numeric,
ADD COLUMN IF NOT EXISTS cac40 numeric,
ADD COLUMN IF NOT EXISTS dax numeric,
ADD COLUMN IF NOT EXISTS sti numeric,
ADD COLUMN IF NOT EXISTS asx200 numeric;