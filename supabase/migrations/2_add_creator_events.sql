-- Create creator_events table for physical workshops and tour dates
CREATE TABLE public.creator_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    ticket_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.creator_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public events are viewable by everyone" 
ON public.creator_events FOR SELECT 
USING (true);

CREATE POLICY "Creators can insert their own events" 
ON public.creator_events FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own events" 
ON public.creator_events FOR UPDATE 
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own events" 
ON public.creator_events FOR DELETE 
USING (auth.uid() = creator_id);
