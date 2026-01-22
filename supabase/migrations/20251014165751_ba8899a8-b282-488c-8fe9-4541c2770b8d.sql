-- Drop existing restrictive policies and create new ones for authenticated users

-- ORDENS_SAIDA: Allow all authenticated users to view all orders
DROP POLICY IF EXISTS "Users can view their own orders or admins can view all" ON public.ordens_saida;
CREATE POLICY "Authenticated users can view all orders"
ON public.ordens_saida
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- ORDENS_SAIDA: Allow all authenticated users to update orders
DROP POLICY IF EXISTS "Users can update their own orders or admins can update all" ON public.ordens_saida;
CREATE POLICY "Authenticated users can update orders"
ON public.ordens_saida
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

-- ORDENS_SAIDA_ITENS: Allow all authenticated users to view order items
DROP POLICY IF EXISTS "Users can view items from their orders or admins can view all" ON public.ordens_saida_itens;
CREATE POLICY "Authenticated users can view all order items"
ON public.ordens_saida_itens
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- ORDENS_SAIDA_ITENS: Allow all authenticated users to update order items
DROP POLICY IF EXISTS "Users can update items from their orders or admins can update a" ON public.ordens_saida_itens;
CREATE POLICY "Authenticated users can update order items"
ON public.ordens_saida_itens
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

-- STOCK_MOVEMENTS: Allow all authenticated users to view all movements
DROP POLICY IF EXISTS "Users can view their own movements or admins can view all" ON public.stock_movements;
CREATE POLICY "Authenticated users can view all movements"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- REPORT_LOGS: Allow all authenticated users to view all logs
DROP POLICY IF EXISTS "Users can view their own logs or admins can view all" ON public.report_logs;
CREATE POLICY "Authenticated users can view all logs"
ON public.report_logs
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- PROFILES: Keep the admin policy and add one for users to view all profiles (but not edit others)
CREATE POLICY "Authenticated users can view all profiles (read-only)"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');