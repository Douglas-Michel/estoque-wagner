-- Create enum for order status
CREATE TYPE public.ordem_status AS ENUM ('em_separacao', 'concluida', 'cancelada');

-- Create table for outbound orders
CREATE TABLE public.ordens_saida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ordem TEXT NOT NULL UNIQUE,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  usuario_email TEXT,
  status ordem_status NOT NULL DEFAULT 'em_separacao',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for order items
CREATE TABLE public.ordens_saida_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id UUID REFERENCES public.ordens_saida(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  position_column TEXT NOT NULL,
  position_floor INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ordens_saida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_saida_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ordens_saida
CREATE POLICY "All users can view orders"
  ON public.ordens_saida
  FOR SELECT
  USING (true);

CREATE POLICY "All users can insert orders"
  ON public.ordens_saida
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update orders"
  ON public.ordens_saida
  FOR UPDATE
  USING (true);

-- RLS Policies for ordens_saida_itens
CREATE POLICY "All users can view order items"
  ON public.ordens_saida_itens
  FOR SELECT
  USING (true);

CREATE POLICY "All users can insert order items"
  ON public.ordens_saida_itens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update order items"
  ON public.ordens_saida_itens
  FOR UPDATE
  USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_ordens_saida_updated_at
  BEFORE UPDATE ON public.ordens_saida
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to generate next order number
CREATE OR REPLACE FUNCTION public.gerar_numero_ordem()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  ordem_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM ordens_saida;
  
  ordem_num := 'OS-' || LPAD(next_num::TEXT, 5, '0');
  RETURN ordem_num;
END;
$$;