-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update ordens_saida policies to restrict sensitive data
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.ordens_saida;
CREATE POLICY "Users can view their own orders or admins can view all"
  ON public.ordens_saida
  FOR SELECT
  USING (
    auth.uid() = usuario_id 
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.ordens_saida;
CREATE POLICY "Authenticated users can insert their own orders"
  ON public.ordens_saida
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.ordens_saida;
CREATE POLICY "Users can update their own orders or admins can update all"
  ON public.ordens_saida
  FOR UPDATE
  USING (
    auth.uid() = usuario_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Add DELETE policy for ordens_saida
CREATE POLICY "Only admins can delete orders"
  ON public.ordens_saida
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Update stock_movements policies - make logs immutable
DROP POLICY IF EXISTS "Authenticated users can view movements" ON public.stock_movements;
CREATE POLICY "Users can view their own movements or admins can view all"
  ON public.stock_movements
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Authenticated users can insert movements" ON public.stock_movements;
CREATE POLICY "Authenticated users can insert their own movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Explicitly deny UPDATE and DELETE on stock_movements (audit trail protection)
CREATE POLICY "No one can update movements"
  ON public.stock_movements
  FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete movements"
  ON public.stock_movements
  FOR DELETE
  USING (false);

-- 7. Update report_logs policies - make logs immutable
DROP POLICY IF EXISTS "Authenticated users can view report logs" ON public.report_logs;
CREATE POLICY "Users can view their own logs or admins can view all"
  ON public.report_logs
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Authenticated users can insert report logs" ON public.report_logs;
CREATE POLICY "Authenticated users can insert their own logs"
  ON public.report_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Explicitly deny UPDATE and DELETE on report_logs (audit trail protection)
CREATE POLICY "No one can update report logs"
  ON public.report_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete report logs"
  ON public.report_logs
  FOR DELETE
  USING (false);

-- 8. Update ordens_saida_itens policies
DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.ordens_saida_itens;
CREATE POLICY "Users can view items from their orders or admins can view all"
  ON public.ordens_saida_itens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ordens_saida
      WHERE id = ordem_id
      AND (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.ordens_saida_itens;
CREATE POLICY "Users can insert items for their orders"
  ON public.ordens_saida_itens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ordens_saida
      WHERE id = ordem_id
      AND usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.ordens_saida_itens;
CREATE POLICY "Users can update items from their orders or admins can update all"
  ON public.ordens_saida_itens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ordens_saida
      WHERE id = ordem_id
      AND (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Add DELETE policy for ordens_saida_itens
CREATE POLICY "Only admins can delete order items"
  ON public.ordens_saida_itens
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));