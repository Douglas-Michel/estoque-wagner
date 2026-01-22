-- =============================================
-- REMOVER POLÍTICAS DE ACESSO AMPLO CONFLITANTES
-- =============================================

-- PROFILES: Remover políticas de acesso amplo
DROP POLICY IF EXISTS "Authenticated users can view all profiles (read-only)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- STOCK_MOVEMENTS: Remover política de acesso amplo
DROP POLICY IF EXISTS "Authenticated users can view all movements" ON public.stock_movements;

-- REPORT_LOGS: Remover política de acesso amplo
DROP POLICY IF EXISTS "Authenticated users can view all logs" ON public.report_logs;