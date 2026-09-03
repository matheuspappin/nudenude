-- Add gamification and filter columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS dance_styles TEXT[],
ADD COLUMN IF NOT EXISTS gamification_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;

-- Function to handle purchase completion and gamification
CREATE OR REPLACE FUNCTION public.handle_purchase_gamification()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  -- We only act if status changed to 'completed'
  -- This handles both INSERT with completed status and UPDATE from pending to completed
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
    
    -- Find the creator of the purchased course
    SELECT creator_id INTO v_creator_id
    FROM public.courses
    WHERE id = NEW.course_id;

    IF v_creator_id IS NOT NULL THEN
      -- Increment sales by 1, and gamification points by 10
      UPDATE public.profiles
      SET 
        total_sales = COALESCE(total_sales, 0) + 1,
        gamification_points = COALESCE(gamification_points, 0) + 10
      WHERE id = v_creator_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on purchases table
DROP TRIGGER IF EXISTS on_purchase_completed ON public.purchases;
CREATE TRIGGER on_purchase_completed
AFTER INSERT OR UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.handle_purchase_gamification();
