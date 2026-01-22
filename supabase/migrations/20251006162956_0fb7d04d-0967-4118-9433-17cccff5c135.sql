-- Add status and observacoes columns to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN status TEXT NOT NULL DEFAULT 'disponivel',
ADD COLUMN observacoes TEXT;

-- Add a check constraint for valid status values
ALTER TABLE public.inventory_items
ADD CONSTRAINT valid_status CHECK (status IN ('disponivel', 'reservado', 'avaria'));