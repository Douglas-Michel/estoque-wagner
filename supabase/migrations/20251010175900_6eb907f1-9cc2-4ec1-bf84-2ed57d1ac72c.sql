-- Add new columns to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS acabamento TEXT,
ADD COLUMN IF NOT EXISTS peso_bruto NUMERIC,
ADD COLUMN IF NOT EXISTS peso_liquido NUMERIC;