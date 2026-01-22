-- Enable realtime for ordens_saida_itens table
ALTER TABLE public.ordens_saida_itens REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens_saida_itens;

-- Enable realtime for inventory_items table (if not already enabled)
ALTER TABLE public.inventory_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;