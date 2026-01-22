-- Corrigir políticas RLS para ambiente de produção
-- Todas as tabelas devem exigir autenticação

-- 1. INVENTORY_ITEMS - Exigir autenticação
DROP POLICY IF EXISTS "All users can view inventory" ON inventory_items;
DROP POLICY IF EXISTS "All users can insert inventory" ON inventory_items;
DROP POLICY IF EXISTS "All users can update inventory" ON inventory_items;
DROP POLICY IF EXISTS "All users can delete inventory" ON inventory_items;

CREATE POLICY "Authenticated users can view inventory" 
ON inventory_items FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory" 
ON inventory_items FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inventory" 
ON inventory_items FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete inventory" 
ON inventory_items FOR DELETE 
USING (auth.role() = 'authenticated');

-- 2. ORDENS_SAIDA - Exigir autenticação
DROP POLICY IF EXISTS "All users can view orders" ON ordens_saida;
DROP POLICY IF EXISTS "All users can insert orders" ON ordens_saida;
DROP POLICY IF EXISTS "All users can update orders" ON ordens_saida;

CREATE POLICY "Authenticated users can view orders" 
ON ordens_saida FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders" 
ON ordens_saida FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" 
ON ordens_saida FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 3. ORDENS_SAIDA_ITENS - Exigir autenticação
DROP POLICY IF EXISTS "All users can view order items" ON ordens_saida_itens;
DROP POLICY IF EXISTS "All users can insert order items" ON ordens_saida_itens;
DROP POLICY IF EXISTS "All users can update order items" ON ordens_saida_itens;

CREATE POLICY "Authenticated users can view order items" 
ON ordens_saida_itens FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order items" 
ON ordens_saida_itens FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order items" 
ON ordens_saida_itens FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 4. STOCK_MOVEMENTS - Exigir autenticação
DROP POLICY IF EXISTS "All users can view movements" ON stock_movements;
DROP POLICY IF EXISTS "All users can insert movements" ON stock_movements;

CREATE POLICY "Authenticated users can view movements" 
ON stock_movements FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert movements" 
ON stock_movements FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 5. REPORT_LOGS - Exigir autenticação
DROP POLICY IF EXISTS "All users can view report logs" ON report_logs;
DROP POLICY IF EXISTS "All users can insert report logs" ON report_logs;

CREATE POLICY "Authenticated users can view report logs" 
ON report_logs FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert report logs" 
ON report_logs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 6. TOWER_CONFIG - Exigir autenticação
DROP POLICY IF EXISTS "Anyone can view tower config" ON tower_config;
DROP POLICY IF EXISTS "Anyone can insert tower config" ON tower_config;
DROP POLICY IF EXISTS "Anyone can update tower config" ON tower_config;
DROP POLICY IF EXISTS "Anyone can delete tower config" ON tower_config;

CREATE POLICY "Authenticated users can view tower config" 
ON tower_config FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tower config" 
ON tower_config FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tower config" 
ON tower_config FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tower config" 
ON tower_config FOR DELETE 
USING (auth.role() = 'authenticated');

-- 7. PROFILES - Restringir visualização ao próprio perfil
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Limpar dados de teste mantendo a estrutura
DELETE FROM ordens_saida_itens;
DELETE FROM ordens_saida;
DELETE FROM stock_movements;
DELETE FROM inventory_items;
DELETE FROM report_logs;

-- Resetar a sequência de números de ordem
-- A função gerar_numero_ordem já está preparada para gerar OS-00001, OS-00002, etc.