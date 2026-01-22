-- Add 'inactive' status for suspended users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'inactive'));

-- Add RLS policy to allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Update inventory and orders policies to block inactive users
DROP POLICY IF EXISTS "Only approved users can access the app" ON public.inventory_items;
CREATE POLICY "Only approved users can access the app"
ON public.inventory_items
FOR ALL
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.status = 'approved'
  )) OR has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Only approved users can access orders" ON public.ordens_saida;
CREATE POLICY "Only approved users can access orders"
ON public.ordens_saida
FOR ALL
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.status = 'approved'
  )) OR has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Only approved users can access movements" ON public.stock_movements;
CREATE POLICY "Only approved users can access movements"
ON public.stock_movements
FOR ALL
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.status = 'approved'
  )) OR has_role(auth.uid(), 'admin')
);