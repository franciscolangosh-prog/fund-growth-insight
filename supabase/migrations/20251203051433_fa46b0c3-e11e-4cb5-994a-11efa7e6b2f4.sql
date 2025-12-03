-- Add market_value column to portfolio_data table
ALTER TABLE public.portfolio_data 
ADD COLUMN market_value numeric;

-- Clear existing portfolio data for fresh testing
DELETE FROM public.portfolio_data;
DELETE FROM public.portfolios;

-- Add UPDATE policy for portfolio_data (needed for editing records)
CREATE POLICY "Anyone can update portfolio data" 
ON public.portfolio_data 
FOR UPDATE 
USING (true);

-- Add DELETE policy for portfolio_data (needed for deleting records)
CREATE POLICY "Anyone can delete portfolio data" 
ON public.portfolio_data 
FOR DELETE 
USING (true);