-- Create market_indices table for centralized market data
CREATE TABLE IF NOT EXISTS public.market_indices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  sha NUMERIC,
  she NUMERIC,
  csi300 NUMERIC,
  sp500 NUMERIC,
  nasdaq NUMERIC,
  ftse100 NUMERIC,
  hangseng NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.market_indices ENABLE ROW LEVEL SECURITY;

-- Create policies for market_indices
CREATE POLICY "Market indices are viewable by everyone" 
ON public.market_indices 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert market indices" 
ON public.market_indices 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only system can update market indices" 
ON public.market_indices 
FOR UPDATE 
USING (true);

-- Create index on date for fast lookups
CREATE INDEX idx_market_indices_date ON public.market_indices(date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_market_indices_updated_at
BEFORE UPDATE ON public.market_indices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for market_indices
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_indices;