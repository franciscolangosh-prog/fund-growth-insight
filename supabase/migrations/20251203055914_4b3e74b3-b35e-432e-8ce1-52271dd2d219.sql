-- Add shares column to portfolio_data for calculation traceability
ALTER TABLE public.portfolio_data ADD COLUMN shares numeric;

-- Clear existing data so we can reload with correct calculations
DELETE FROM public.portfolio_data;
DELETE FROM public.portfolios;