-- Create Niches Table
CREATE TABLE IF NOT EXISTS public.niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_base BOOLEAN DEFAULT false,
    icon_name TEXT, -- To store a lucide-react icon name if possible, or we just map it in frontend
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Niches
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Anyone can read niches
DROP POLICY IF EXISTS "Niches are public" ON public.niches;
CREATE POLICY "Niches are public" 
ON public.niches FOR SELECT USING (true);

-- Insert Immutable Base Niches (Dance Styles)
INSERT INTO public.niches (name, is_base, icon_name) VALUES
('Hip Hop', true, 'Sparkles'),
('Ballet', true, 'Heart'),
('Contemporary', true, 'Music'),
('Jazz', true, 'Star'),
('Heels', true, 'Camera'),
('Urban', true, 'Dumbbell')
ON CONFLICT (name) DO NOTHING;

-- Add niche_id to Courses
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS niche_id UUID REFERENCES public.niches(id) ON DELETE SET NULL;

-- Create RPC function to get active niches based on a threshold
CREATE OR REPLACE FUNCTION public.get_active_niches(threshold INT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    is_base BOOLEAN,
    icon_name TEXT,
    course_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id, 
        n.name, 
        n.is_base,
        n.icon_name,
        COUNT(c.id) AS course_count
    FROM public.niches n
    LEFT JOIN public.courses c ON c.niche_id = n.id
    GROUP BY n.id, n.name, n.is_base, n.icon_name
    HAVING n.is_base = true OR COUNT(c.id) >= threshold
    ORDER BY n.is_base DESC, course_count DESC, n.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
