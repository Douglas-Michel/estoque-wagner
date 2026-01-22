-- =============================================
-- CORREÇÕES DE SEGURANÇA RLS - PARTE 2 (CORRIGIDO)
-- =============================================

-- 3. STOCK_MOVEMENTS: Restringir acesso a movimentações
-- Remover política existente
DROP POLICY IF EXISTS "Authenticated users can read all movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Allow all authenticated users to read movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can view own movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admins can view all movements" ON public.stock_movements;

-- Usuários podem ver apenas suas próprias movimentações
CREATE POLICY "Users can view own movements"
ON public.stock_movements
FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem ver todas as movimentações
CREATE POLICY "Admins can view all movements"
ON public.stock_movements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. REPORT_LOGS: Restringir acesso aos logs de relatórios
-- Remover políticas existentes
DROP POLICY IF EXISTS "Authenticated users can read all report logs" ON public.report_logs;
DROP POLICY IF EXISTS "Allow all authenticated users to read report logs" ON public.report_logs;
DROP POLICY IF EXISTS "Users can view own report logs" ON public.report_logs;
DROP POLICY IF EXISTS "Admins can view all report logs" ON public.report_logs;

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view own report logs"
ON public.report_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all report logs"
ON public.report_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);