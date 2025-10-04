-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create portfolios table
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_data table
CREATE TABLE public.portfolio_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  principle NUMERIC NOT NULL,
  share_value NUMERIC NOT NULL,
  sha NUMERIC NOT NULL,
  she NUMERIC NOT NULL,
  csi300 NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_data ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now)
CREATE POLICY "Portfolios are viewable by everyone" 
ON public.portfolios 
FOR SELECT 
USING (true);

CREATE POLICY "Portfolio data is viewable by everyone" 
ON public.portfolio_data 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create portfolios" 
ON public.portfolios 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can insert portfolio data" 
ON public.portfolio_data 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete portfolios" 
ON public.portfolios 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_portfolio_data_portfolio_id ON public.portfolio_data(portfolio_id);
CREATE INDEX idx_portfolio_data_date ON public.portfolio_data(date);