-- Add length constraints to observation fields across all tables

-- 1. Inventory items observation fields
ALTER TABLE public.inventory_items
ADD CONSTRAINT observacoes_length CHECK (LENGTH(observacoes) <= 1000);

ALTER TABLE public.inventory_items
ADD CONSTRAINT observacao_disponivel_length CHECK (LENGTH(observacao_disponivel) <= 500);

ALTER TABLE public.inventory_items
ADD CONSTRAINT observacao_reservado_length CHECK (LENGTH(observacao_reservado) <= 500);

ALTER TABLE public.inventory_items
ADD CONSTRAINT observacao_avaria_length CHECK (LENGTH(observacao_avaria) <= 500);

-- 2. Orders observations
ALTER TABLE public.ordens_saida
ADD CONSTRAINT observacoes_length CHECK (LENGTH(observacoes) <= 1000);

-- 3. Order items observations
ALTER TABLE public.ordens_saida_itens
ADD CONSTRAINT observacoes_length CHECK (LENGTH(observacoes) <= 500);

-- 4. Stock movements observations
ALTER TABLE public.stock_movements
ADD CONSTRAINT observacoes_length CHECK (LENGTH(observacoes) <= 1000);