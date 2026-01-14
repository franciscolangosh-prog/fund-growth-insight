-- Add user_id column to portfolios table
ALTER TABLE public.portfolios 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing RLS policies on portfolios
DROP POLICY IF EXISTS "Anyone can create portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Anyone can delete portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Portfolios are viewable by everyone" ON public.portfolios;

-- Create new RLS policies for portfolios (user-specific)
CREATE POLICY "Users can view their own portfolios" 
ON public.portfolios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" 
ON public.portfolios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" 
ON public.portfolios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" 
ON public.portfolios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing RLS policies on portfolio_data
DROP POLICY IF EXISTS "Anyone can delete portfolio data" ON public.portfolio_data;
DROP POLICY IF EXISTS "Anyone can insert portfolio data" ON public.portfolio_data;
DROP POLICY IF EXISTS "Anyone can update portfolio data" ON public.portfolio_data;
DROP POLICY IF EXISTS "Portfolio data is viewable by everyone" ON public.portfolio_data;

-- Create new RLS policies for portfolio_data (through portfolio ownership)
CREATE POLICY "Users can view their own portfolio data" 
ON public.portfolio_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_data.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own portfolio data" 
ON public.portfolio_data 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_data.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own portfolio data" 
ON public.portfolio_data 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_data.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own portfolio data" 
ON public.portfolio_data 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_data.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);