-- Adicionar coluna usina na tabela inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN usina text;