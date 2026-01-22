-- Enable realtime for ordens_saida table
ALTER TABLE public.ordens_saida REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens_saida;