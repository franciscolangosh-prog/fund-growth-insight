-- Add new global index columns to portfolio_data table
ALTER TABLE public.portfolio_data 
ADD COLUMN sp500 numeric,
ADD COLUMN nasdaq numeric,
ADD COLUMN ftse100 numeric,
ADD COLUMN hangseng numeric;