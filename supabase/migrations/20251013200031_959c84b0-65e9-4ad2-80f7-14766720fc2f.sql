-- Create table to store tower configuration
CREATE TABLE IF NOT EXISTS public.tower_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_name TEXT NOT NULL UNIQUE,
  floors INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tower_config ENABLE ROW LEVEL SECURITY;

-- Create policies - anyone can read/write tower config
CREATE POLICY "Anyone can view tower config"
  ON public.tower_config
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tower config"
  ON public.tower_config
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tower config"
  ON public.tower_config
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete tower config"
  ON public.tower_config
  FOR DELETE
  USING (true);

-- Insert default configuration
INSERT INTO public.tower_config (column_name, floors)
VALUES 
  ('A', ARRAY[1,2,3,4]),
  ('B', ARRAY[1,2,3,4]),
  ('C', ARRAY[1,2,3,4]),
  ('D', ARRAY[1,2,3,4]),
  ('E', ARRAY[1,2,3,4]),
  ('F', ARRAY[1,2,3,4]),
  ('G', ARRAY[1,2,3,4]),
  ('H', ARRAY[1,2,3,4])
ON CONFLICT (column_name) DO NOTHING;