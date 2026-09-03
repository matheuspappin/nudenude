-- 11. Add Stripe Connect tracking to profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- Force postgREST to reload the schema so the API immediately recognizes the new columns
NOTIFY pgrst, 'reload schema';
