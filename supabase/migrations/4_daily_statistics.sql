-- Create extension for Cron if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create Daily Statistics Table
CREATE TABLE public.daily_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    total_creators INTEGER DEFAULT 0,
    total_courses INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    top_styles JSONB DEFAULT '[]'::jsonb,
    top_locations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.daily_statistics ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read stats
CREATE POLICY "Public stats are viewable by everyone" 
ON public.daily_statistics FOR SELECT USING (true);

-- Function to generate the daily snapshot
CREATE OR REPLACE FUNCTION public.generate_daily_statistics()
RETURNS void AS $$
DECLARE
    v_creators INTEGER;
    v_courses INTEGER;
    v_purchases INTEGER;
    v_styles JSONB;
    v_locations JSONB;
BEGIN
    -- 1. Total Creators
    SELECT COUNT(*) INTO v_creators FROM public.profiles WHERE is_creator = true;
    
    -- 2. Total Courses
    SELECT COUNT(*) INTO v_courses FROM public.courses;
    
    -- 3. Total Purchases (Completed)
    SELECT COUNT(*) INTO v_purchases FROM public.purchases WHERE status = 'completed';

    -- 4. Top Styles (Unnest array, group, count, order, limit to top 10)
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_styles
    FROM (
        SELECT trim(style) as style_name, COUNT(*) as count
        FROM public.profiles, unnest(dance_styles) as style
        WHERE is_creator = true AND style IS NOT NULL
        GROUP BY trim(style)
        ORDER BY count DESC
        LIMIT 10
    ) t;

    -- 5. Top Locations
    SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb) INTO v_locations
    FROM (
        SELECT location, COUNT(*) as count
        FROM public.profiles
        WHERE is_creator = true AND location IS NOT NULL AND location != ''
        GROUP BY location
        ORDER BY count DESC
        LIMIT 10
    ) l;

    -- Insert or Update for the current date
    INSERT INTO public.daily_statistics (snapshot_date, total_creators, total_courses, total_purchases, top_styles, top_locations)
    VALUES (CURRENT_DATE, v_creators, v_courses, v_purchases, v_styles, v_locations)
    ON CONFLICT (snapshot_date) 
    DO UPDATE SET 
        total_creators = EXCLUDED.total_creators,
        total_courses = EXCLUDED.total_courses,
        total_purchases = EXCLUDED.total_purchases,
        top_styles = EXCLUDED.top_styles,
        top_locations = EXCLUDED.top_locations,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run every day at midnight (UTC)
SELECT cron.schedule('generate_daily_stats', '0 0 * * *', 'SELECT public.generate_daily_statistics()');

-- Run once immediately to populate data for testing
SELECT public.generate_daily_statistics();
