-- 10. Add Admin and Suspension flags

-- Add is_admin and is_suspended columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Update the protect_profile_fields function to also protect the new flags
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
    is_admin_user BOOLEAN;
BEGIN
    -- Allow service_role to update anything
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' OR current_user = 'postgres' THEN
        RETURN NEW;
    END IF;

    -- Check if the person executing the query is an Admin
    SELECT is_admin INTO is_admin_user FROM public.profiles WHERE id = auth.uid();
    IF is_admin_user = true THEN
        RETURN NEW;
    END IF;

    -- For regular users (authenticated/anon), revert sensitive fields to their OLD values
    NEW.is_creator = OLD.is_creator;
    NEW.gamification_points = OLD.gamification_points;
    NEW.total_sales = OLD.total_sales;
    NEW.is_admin = OLD.is_admin;
    NEW.is_suspended = OLD.is_suspended;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin RLS Policies
-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Allow admins to delete any course
CREATE POLICY "Admins can delete any course" 
ON public.courses FOR DELETE USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Allow admins to delete any lesson
CREATE POLICY "Admins can delete any lesson" 
ON public.lessons FOR DELETE USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
