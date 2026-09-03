-- Security Audit Fixes

-- 1. Prevent unauthorized profile privilege escalation
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow service_role to update anything
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' OR current_user = 'postgres' THEN
        RETURN NEW;
    END IF;

    -- For regular users (authenticated/anon), revert sensitive fields to their OLD values
    NEW.is_creator = OLD.is_creator;
    NEW.gamification_points = OLD.gamification_points;
    NEW.total_sales = OLD.total_sales;
    
    -- If there's a role column added by another script, we protect it too
    -- NEW.role = OLD.role; (Role is currently not in 1_dance_saas_schema, but we use is_creator)

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_fields();

-- 2. Protect Lessons video_url leakage
-- We drop the naive "Lessons are public" policy and replace it with a more granular one
-- Actually, RLS does not do column-level easily. The best approach is to let the row be read, 
-- but we must ensure the application NEVER queries `video_url` directly from the client without checking.
-- Wait, if RLS allows SELECT on public.lessons, a malicious user can run:
-- supabase.from('lessons').select('video_url') and get it.
-- To fix this in Postgres without breaking too much:
-- We can revoke SELECT on the video_url column from authenticated and anon, but Supabase doesn't easily support column-level grants in the dashboard.
-- Instead, we can drop the public policy and create one that ONLY allows reading if they purchased. BUT that breaks the course syllabus view!
-- The safest fix for Supabase is to move video_url into a private table or use a Postgres View.
-- Given the simplicity, we will create a private table for secure lesson data.

CREATE TABLE IF NOT EXISTS public.lesson_secrets (
    lesson_id UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL
);

-- Service role only! No public policies.
ALTER TABLE public.lesson_secrets ENABLE ROW LEVEL SECURITY;

-- Migrate existing video_urls to lesson_secrets
INSERT INTO public.lesson_secrets (lesson_id, video_url)
SELECT id, video_url FROM public.lessons WHERE video_url IS NOT NULL
ON CONFLICT DO NOTHING;

-- Drop the column from public.lessons to secure it
ALTER TABLE public.lessons DROP COLUMN IF EXISTS video_url;
