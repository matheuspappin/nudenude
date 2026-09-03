-- 9. Add Affiliate Referrals

-- Add referred_by column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create or replace the trigger function that automatically creates a profile when a user signs up.
-- We extract all custom metadata, including the new 'referred_by' field, so it gets saved automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    is_creator,
    location,
    dance_styles,
    referred_by
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username'),
    COALESCE((NEW.raw_user_meta_data->>'is_creator')::boolean, false),
    NEW.raw_user_meta_data->>'location',
    (SELECT array_agg(trim(s)) FROM unnest(string_to_array(NEW.raw_user_meta_data->>'dance_styles', ',')) s) :: TEXT[],
    (NEW.raw_user_meta_data->>'referred_by')::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
