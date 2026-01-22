-- Tornar campos de dimensões e têmpera opcionais (nullable)
ALTER TABLE inventory_items 
  ALTER COLUMN largura DROP NOT NULL,
  ALTER COLUMN altura DROP NOT NULL,
  ALTER COLUMN espessura DROP NOT NULL,
  ALTER COLUMN tempera DROP NOT NULL;