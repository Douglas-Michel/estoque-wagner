-- Improve security for stock_movements table

-- 1. Create a trigger function to validate and enforce user_id
CREATE OR REPLACE FUNCTION public.validate_movement_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user_id matches authenticated user
  IF NEW.user_id IS NOT NULL AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create movement for another user';
  END IF;
  
  -- Auto-set user_id if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create trigger to validate movements before insert
DROP TRIGGER IF EXISTS validate_movement_user_trigger ON public.stock_movements;
CREATE TRIGGER validate_movement_user_trigger
BEFORE INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.validate_movement_user();

-- 3. Make user_id NOT NULL to enforce accountability
ALTER TABLE public.stock_movements
ALTER COLUMN user_id SET NOT NULL;