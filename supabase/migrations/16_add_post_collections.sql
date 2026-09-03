-- 16. Post Collections

-- Table for organizing posts into collections/series/folders
CREATE TABLE IF NOT EXISTS public.post_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(creator_id, name)
);

-- Enable RLS
ALTER TABLE public.post_collections ENABLE ROW LEVEL SECURITY;

-- Policies for post_collections
CREATE POLICY "Collections are public to view" 
ON public.post_collections FOR SELECT 
USING (true);

CREATE POLICY "Creators can manage their own collections" 
ON public.post_collections FOR ALL 
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);


-- Add collection_id to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.post_collections(id) ON DELETE SET NULL;
