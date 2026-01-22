-- Adicionar campos de observação para cada status
ALTER TABLE public.inventory_items
ADD COLUMN observacao_disponivel TEXT,
ADD COLUMN observacao_reservado TEXT,
ADD COLUMN observacao_avaria TEXT;