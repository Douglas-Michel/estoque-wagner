-- =============================================
-- CORREÇÃO FINAL DE SEGURANÇA RLS
-- Usando has_role com parâmetros na ordem correta
-- =============================================

-- PROFILES: Remover e recriar política de admin
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- STOCK_MOVEMENTS: Remover e recriar política de admin
DROP POLICY IF EXISTS "Admins can view all movements" ON public.stock_movements;
CREATE POLICY "Admins can view all movements"
ON public.stock_movements
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- REPORT_LOGS: Remover e recriar política de admin
DROP POLICY IF EXISTS "Admins can view all report logs" ON public.report_logs;
CREATE POLICY "Admins can view all report logs"
ON public.report_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);