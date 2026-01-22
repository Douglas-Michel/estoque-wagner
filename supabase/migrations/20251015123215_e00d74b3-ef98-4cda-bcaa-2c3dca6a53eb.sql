-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing users to approved status
UPDATE public.profiles SET status = 'approved';

-- Create index for better performance
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Update RLS policy to block unapproved users
CREATE POLICY "Only approved users can access the app"
ON public.inventory_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND status = 'approved'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only approved users can access orders"
ON public.ordens_saida
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND status = 'approved'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only approved users can access movements"
ON public.stock_movements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND status = 'approved'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);