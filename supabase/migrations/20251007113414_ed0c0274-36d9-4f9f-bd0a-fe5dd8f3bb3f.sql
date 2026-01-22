-- Adicionar campos para quantidades por status
ALTER TABLE public.inventory_items
ADD COLUMN quantidade_disponivel INTEGER NOT NULL DEFAULT 0,
ADD COLUMN quantidade_reservada INTEGER NOT NULL DEFAULT 0,
ADD COLUMN quantidade_avaria INTEGER NOT NULL DEFAULT 0;

-- Migrar dados existentes: mover quantidade total para o status atual
UPDATE public.inventory_items
SET 
  quantidade_disponivel = CASE WHEN status = 'disponivel' THEN quantidade ELSE 0 END,
  quantidade_reservada = CASE WHEN status = 'reservado' THEN quantidade ELSE 0 END,
  quantidade_avaria = CASE WHEN status = 'avaria' THEN quantidade ELSE 0 END;

-- Adicionar constraint para garantir que a soma das quantidades seja igual à quantidade total
ALTER TABLE public.inventory_items
ADD CONSTRAINT quantidade_consistency_check 
CHECK (quantidade = (quantidade_disponivel + quantidade_reservada + quantidade_avaria));