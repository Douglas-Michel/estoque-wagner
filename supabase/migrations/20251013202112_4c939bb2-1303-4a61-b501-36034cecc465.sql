-- Adicionar campo para agrupar bobinas cadastradas juntas
ALTER TABLE inventory_items 
ADD COLUMN lote_id TEXT;

-- Adicionar índice para melhorar performance de consultas por lote
CREATE INDEX idx_inventory_items_lote_id ON inventory_items(lote_id);