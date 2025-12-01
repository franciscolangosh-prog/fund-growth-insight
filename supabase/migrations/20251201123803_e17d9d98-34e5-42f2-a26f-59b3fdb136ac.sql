-- Remove market indices columns from portfolio_data table
-- Market indices are now managed separately in market_indices table

ALTER TABLE portfolio_data
DROP COLUMN IF EXISTS sha,
DROP COLUMN IF EXISTS she,
DROP COLUMN IF EXISTS csi300,
DROP COLUMN IF EXISTS sp500,
DROP COLUMN IF EXISTS nasdaq,
DROP COLUMN IF EXISTS ftse100,
DROP COLUMN IF EXISTS hangseng;