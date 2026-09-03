-- Add teaching level to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS teaching_level TEXT DEFAULT 'All Levels';
