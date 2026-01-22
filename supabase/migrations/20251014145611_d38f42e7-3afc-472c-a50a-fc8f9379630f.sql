-- Add new status 'aguardando_envio' to ordem_status enum
ALTER TYPE ordem_status ADD VALUE IF NOT EXISTS 'aguardando_envio';

-- Update ordens_saida_itens table to allow empresa field if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ordens_saida_itens' 
    AND column_name = 'empresa'
  ) THEN
    ALTER TABLE ordens_saida_itens ADD COLUMN empresa TEXT;
  END IF;
END $$;